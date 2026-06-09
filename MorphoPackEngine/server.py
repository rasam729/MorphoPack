"""
MorphoPackEngine/server.py
Flask API bridge — runs pipeline.py via Blender 4.5 headlessly.
pipeline.py uses Blender's Python API + io_mesh_paper_model addon to produce:
  - outputs/preview.glb
  - outputs/dieline_pattern.svg
If Blender produces the GLB but not the SVG (addon unavailable headlessly),
a Python-native BFS unfolding fallback generates the SVG instead.
"""

import os
import uuid
import subprocess
import threading
from pathlib import Path
from datetime import datetime

from flask import Flask, request, jsonify, send_file, send_from_directory, abort
from flask_cors import CORS

# ─── Paths ────────────────────────────────────────────────────────────────────
ENGINE_DIR      = Path(__file__).parent.resolve()
UPLOADS_DIR     = ENGINE_DIR / "uploads"
OUTPUTS_DIR     = ENGINE_DIR / "outputs"
PIPELINE_SCRIPT = ENGINE_DIR / "pipeline.py"

UPLOADS_DIR.mkdir(exist_ok=True)
OUTPUTS_DIR.mkdir(exist_ok=True)

# ─── Blender path ─────────────────────────────────────────────────────────────
BLENDER_EXE = (
    os.environ.get("BLENDER_PATH")
    or r"C:\Program Files\Blender Foundation\Blender 4.5\blender.exe"
)

# ─── Flask app ────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response

# ─── In-memory job state ──────────────────────────────────────────────────────
_job: dict = {
    "id":          None,
    "status":      "idle",   # idle | uploaded | running | done | error
    "step":        None,
    "steps_done":  [],
    "error":       None,
    "file":        None,
    "started_at":  None,
    "finished_at": None,
}
_job_lock = threading.Lock()

PIPELINE_STEPS = [
    "Mesh import & validation",
    "Displacement modifier (2mm clearance)",
    "Stage 1: WELD — Merge duplicate vertices",
    "Stage 2: DECIMATE — Reduce polygon count",
    "Stage 3: CLEANUP — Remove degenerate geometry",
    "Manufacturing threshold check & simplification",
    "GLB viewport export",
    "SVG dieline unfold & export",
]


def _update_job(**kw):
    with _job_lock:
        _job.update(kw)


# ─── Python-native BFS dieline fallback ───────────────────────────────────────
# Only used when Blender's io_mesh_paper_model addon is unavailable headlessly.

def _generate_dieline_fallback(mesh_path: str, output_path: str) -> str:
    """
    Emergency fallback: BFS mesh-unfolding using raw numpy arrays.
    Builds edge-adjacency from scratch — no reliance on trimesh.face_adjacency.
    """
    import trimesh
    import numpy as np
    from collections import deque

    print(f"[Dieline-FB] Loading: {mesh_path}")
    mesh = trimesh.load(mesh_path, force="mesh")

    if not isinstance(mesh, trimesh.Trimesh):
        try:
            parts = (
                list(mesh.geometry.values())
                if hasattr(mesh, "geometry")
                else list(mesh.dump())
            )
            mesh = trimesh.util.concatenate(parts)
        except Exception:
            mesh = list(mesh.dump())[0]

    # ── CRITICAL: Weld coincident vertices ────────────────────────────────────
    # STL files store each triangle with unique vertices. We must merge them
    # so adjacent triangles share vertex IDs, otherwise edge-adjacency is empty.
    try:
        mesh.merge_vertices()
        print("[Dieline-FB] Applied trimesh.merge_vertices()")
    except Exception as exc:
        print(f"[Dieline-FB] merge_vertices failed: {exc}")

    verts = np.array(mesh.vertices, dtype=np.float64)
    faces = np.array(mesh.faces,    dtype=np.int32)
    n_f   = len(faces)
    print(f"[Dieline-FB] After weld: {n_f} faces, {len(verts)} verts")

    # Decimate if too large
    MAX_F = 1500
    if n_f > MAX_F:
        try:
            import fast_simplification
            reduction = 1.0 - (MAX_F / n_f)
            verts, faces = fast_simplification.simplify(verts, faces, target_reduction=reduction)
            n_f = len(faces)
            print(f"[Dieline-FB] Decimated to {n_f} faces using fast-simplification")
        except ImportError:
            step  = (n_f + MAX_F - 1) // MAX_F  # ceiling division
            faces = faces[::step]
            n_f   = len(faces)
            print(f"[Dieline-FB] fast_simplification missing. Sampled to {n_f} faces (step={step})")


    # Build edge → [face_idx] adjacency from raw arrays
    edge_faces: dict = {}
    for fi in range(n_f):
        for k in range(3):
            a   = int(faces[fi][k])
            b   = int(faces[fi][(k + 1) % 3])
            key = (min(a, b), max(a, b))
            edge_faces.setdefault(key, []).append(fi)

    adj: dict = {fi: [] for fi in range(n_f)}
    for (va, vb), flist in edge_faces.items():
        if len(flist) == 2:
            fa, fb = flist[0], flist[1]
            adj[fa].append((fb, va, vb))
            adj[fb].append((fa, va, vb))

    print(f"[Dieline-FB] Shared edges: {sum(len(v) for v in adj.values()) // 2}")

    # BFS unfolding via trilateration
    vert2d:  dict = {}
    face_2d: dict = {}
    visited: set  = set()

    def place_face0():
        fi  = 0
        gv  = [int(faces[fi][k]) for k in range(3)]
        v3d = verts[gv]
        e1  = v3d[1] - v3d[0]
        nrm = np.cross(e1, v3d[2] - v3d[0])
        nrm = nrm / (np.linalg.norm(nrm) + 1e-12)
        xa  = e1 / (np.linalg.norm(e1) + 1e-12)
        ya  = np.cross(nrm, xa)
        pts = np.array([
            [0.0, 0.0],
            [float(np.dot(v3d[1]-v3d[0], xa)), float(np.dot(v3d[1]-v3d[0], ya))],
            [float(np.dot(v3d[2]-v3d[0], xa)), float(np.dot(v3d[2]-v3d[0], ya))],
        ])
        face_2d[fi] = pts
        for li, gi in enumerate(gv):
            vert2d[(fi, gi)] = pts[li]

    place_face0()
    visited.add(0)
    queue = deque([0])

    while queue:
        cur     = queue.popleft()
        cur_gv  = [int(faces[cur][k]) for k in range(3)]
        cur_map = {gi: vert2d[(cur, gi)] for gi in cur_gv}

        for (nbr, sv0, sv1) in adj.get(cur, []):
            if nbr in visited:
                continue
            visited.add(nbr)

            p0 = cur_map.get(sv0)
            p1 = cur_map.get(sv1)
            if p0 is None or p1 is None:
                continue

            nbr_gv   = [int(faces[nbr][k]) for k in range(3)]
            unshared = [v for v in nbr_gv if v != sv0 and v != sv1]
            if not unshared:
                continue
            uv = unshared[0]

            uv3   = verts[uv]
            d0    = float(np.linalg.norm(uv3 - verts[sv0]))
            d1    = float(np.linalg.norm(uv3 - verts[sv1]))

            ev   = p1 - p0
            elen = float(np.linalg.norm(ev))
            if elen < 1e-12:
                continue
            ed  = ev / elen
            pd  = np.array([-ed[1], ed[0]])

            xa_ = (d0**2 - d1**2 + elen**2) / (2.0 * elen + 1e-12)
            yp_ = float(np.sqrt(max(0.0, d0**2 - xa_**2)))

            c1 = p0 + xa_ * ed + yp_ * pd
            c2 = p0 + xa_ * ed - yp_ * pd
            cc = np.mean(face_2d[cur], axis=0)
            u2 = c1 if np.linalg.norm(c1-cc) >= np.linalg.norm(c2-cc) else c2

            nm  = {sv0: p0, sv1: p1, uv: u2}
            face_2d[nbr] = np.array([nm[nbr_gv[k]] for k in range(3)])
            for gi in nbr_gv:
                vert2d[(nbr, gi)] = nm[gi]
            queue.append(nbr)
# ─── Background pipeline thread ───────────────────────────────────────────────

def _run_pipeline_thread(blender_exe: str):
    """
    1. Clear previous outputs so stale files never mask missing results.
    2. Run pipeline.py via Blender --background.
       pipeline.py uses Blender's Python API + bl_ext.blender_org.export_paper_model to produce
       outputs/preview.glb AND outputs/dieline_pattern.svg.
    """
    _update_job(status="running", step=PIPELINE_STEPS[0], steps_done=[], error=None)

    glb_out = OUTPUTS_DIR / "preview.glb"
    svg_out = OUTPUTS_DIR / "dieline_pattern.svg"

    # ── Clear old outputs so we can tell what Blender produced this run ───────
    for f in [glb_out, svg_out]:
        if f.exists():
            f.unlink()
            print(f"[CLR] Removed old output: {f.name}")

    mesh_files = (
        list(UPLOADS_DIR.glob("*.stl")) + list(UPLOADS_DIR.glob("*.STL")) +
        list(UPLOADS_DIR.glob("*.obj")) + list(UPLOADS_DIR.glob("*.OBJ"))
    )
    
    blender_err = None

    # ── Step 1: Run Blender (pipeline.py handles GLB + SVG) ──────────────────
    try:
        cmd = [blender_exe, "--background", "--python", str(PIPELINE_SCRIPT)]
        print(f"\n[Morpho] Launching: {' '.join(cmd)}\n")

        # Set environment to use UTF-8 encoding
        import os
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'

        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",  # Replace problematic characters instead of failing
            cwd=str(ENGINE_DIR),
            env=env
        )

        step_idx = 0
        for line in proc.stdout:
            line = line.rstrip()
            if line:
                # Remove or replace problematic Unicode characters for logging
                safe_line = line.encode('ascii', 'replace').decode('ascii')
                print(f"  [Blender] {safe_line}")
            low = line.lower()
            
            # Track pipeline progress through log output
            if "compiling file" in low or "import" in low:
                step_idx = max(step_idx, 0)
                _update_job(step=PIPELINE_STEPS[0], steps_done=PIPELINE_STEPS[:step_idx])
            elif "displace" in low or "clearance" in low or "padding" in low:
                step_idx = max(step_idx, 1)
                _update_job(step=PIPELINE_STEPS[1], steps_done=PIPELINE_STEPS[:step_idx])
            elif "stage 1" in low or "weld" in low and "geom-prep" in low:
                step_idx = max(step_idx, 2)
                _update_job(step=PIPELINE_STEPS[2], steps_done=PIPELINE_STEPS[:step_idx])
            elif "stage 2" in low or "decimate" in low and "geom-prep" in low:
                step_idx = max(step_idx, 3)
                _update_job(step=PIPELINE_STEPS[3], steps_done=PIPELINE_STEPS[:step_idx])
            elif "stage 3" in low or "cleanup" in low and "geom-prep" in low:
                step_idx = max(step_idx, 4)
                _update_job(step=PIPELINE_STEPS[4], steps_done=PIPELINE_STEPS[:step_idx])
            elif "mfg-check" in low or "mfg-simplify" in low or "manufacturing" in low:
                step_idx = max(step_idx, 5)
                _update_job(step=PIPELINE_STEPS[5], steps_done=PIPELINE_STEPS[:step_idx])
            elif "preview.glb" in low or "gltf" in low or "glb export" in low:
                step_idx = max(step_idx, 6)
                _update_job(step=PIPELINE_STEPS[6], steps_done=PIPELINE_STEPS[:step_idx])
            elif any(k in low for k in ("unwrap", "dieline", "svg", "unfold", "paper", "direct module")):
                step_idx = max(step_idx, 7)
                _update_job(step=PIPELINE_STEPS[7], steps_done=PIPELINE_STEPS[:step_idx])

        proc.wait()
        if proc.returncode != 0:
            blender_err = f"Blender exited with code {proc.returncode}"
            print(f"[WARN] {blender_err}")
        else:
            print("[OK] Blender pipeline completed.")

    except FileNotFoundError:
        blender_err = f"Blender not found at: {blender_exe}"
        print(f"[WARN] {blender_err}")
    except Exception as exc:
        blender_err = str(exc)
        print(f"[WARN] Blender error: {exc}")

    # If Blender wasn't available or failed to produce outputs, attempt a Python fallback
    # that generates a GLB (via trimesh) and an SVG dieline (via _generate_dieline_fallback).
    if blender_err and mesh_files:
        try:
            mesh_path = str(mesh_files[0])
            print(f"[Fallback] Attempting Python fallback for mesh: {mesh_path}")

            # Create GLB using trimesh if GLB missing
            try:
                if not glb_out.exists():
                    import trimesh
                    m = trimesh.load(mesh_path, force='mesh')
                    # Ensure mesh is Trimesh
                    if not isinstance(m, trimesh.Trimesh):
                        try:
                            m = trimesh.util.concatenate(list(m.geometry.values()))
                        except Exception:
                            pass
                    m.export(str(glb_out))
                    print(f"[Fallback] Exported GLB fallback: {glb_out}")
            except Exception as ge:
                print(f"[Fallback] GLB generation failed: {ge}")

            # Create SVG dieline using the existing Python fallback
            try:
                if not svg_out.exists():
                    _generate_dieline_fallback(mesh_path, str(svg_out))
                    print(f"[Fallback] Generated SVG dieline fallback: {svg_out}")
            except Exception as se:
                print(f"[Fallback] SVG generation failed: {se}")

            # Clear blender_err if we produced both files
            if glb_out.exists() and svg_out.exists():
                print("[Fallback] Both GLB and SVG produced by fallback.")
                blender_err = None
        except Exception as fb_exc:
            print(f"[Fallback] Fallback process error: {fb_exc}")
    # ── Finalise ──────────────────────────────────────────────────────────────
    glb_ok    = glb_out.exists()
    svg_ok    = svg_out.exists()
    final_err = None if (glb_ok and svg_ok) else (blender_err or "No output files produced.")

    _update_job(
        status="done" if not final_err else "error",
        step=None,
        steps_done=PIPELINE_STEPS,
        error=final_err,
        finished_at=datetime.utcnow().isoformat(),
    )
    print(f"\n[OK] Pipeline done.  GLB={glb_ok}  SVG={svg_ok}\n")



# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status":       "healthy",
        "service":      "morpho-pack-engine",
        "version":      "1.2.0",
        "blender":      BLENDER_EXE,
        "uploads_dir":  str(UPLOADS_DIR),
        "outputs_dir":  str(OUTPUTS_DIR),
    })


@app.route("/api/upload", methods=["POST"])
def upload():
    if "mesh" not in request.files:
        return jsonify({"error": "No 'mesh' file field in request."}), 400

    file = request.files["mesh"]
    if not file.filename:
        return jsonify({"error": "Empty filename."}), 400

    ext = Path(file.filename).suffix.lower()
    if ext not in (".stl", ".obj"):
        return jsonify({"error": f"Unsupported type '{ext}'. Only .stl/.obj accepted."}), 422

    # Purge previous uploads
    for old in UPLOADS_DIR.glob("*"):
        if old.is_file() and old.name != ".gitkeep":
            old.unlink()
            print(f"[DEL] Purged: {old.name}")

    # Also clear previous outputs so stale SVG/GLB from last run don't persist
    for old in OUTPUTS_DIR.glob("*"):
        if old.is_file() and old.name not in (".gitkeep",):
            old.unlink()
            print(f"[DEL] Cleared old output: {old.name}")

    safe_name = Path(file.filename).name
    dest = UPLOADS_DIR / safe_name
    file.save(str(dest))
    print(f"[UP] Saved: {dest}  ({dest.stat().st_size:,} bytes)")

    job_id = f"job_{uuid.uuid4().hex[:8]}"
    _update_job(
        id=job_id, status="uploaded", file=safe_name,
        step=None, steps_done=[], error=None,
        started_at=None, finished_at=None,
    )

    # Do NOT auto-start pipeline - wait for user to click "Run Pipeline" button
    return jsonify({
        "success": True,
        "message": "File uploaded successfully. Click 'Run Pipeline' to process.",
        "filename": safe_name,
        "job_id": job_id
    })


@app.route("/api/run-pipeline", methods=["POST"])
def run_pipeline():
    job_id = _job["id"] or f"job_{uuid.uuid4().hex[:8]}"
    _update_job(id=job_id)

    thread = threading.Thread(target=_run_pipeline_thread, args=(BLENDER_EXE,))
    thread.daemon = True
    thread.start()
    
    return jsonify({
        "success": True,
        "message": "Pipeline started manually. Poll /api/pipeline-status for progress.",
        "job_id": job_id
    })


@app.route("/api/pipeline-status", methods=["GET"])
def pipeline_status():
    with _job_lock:
        state = dict(_job)
    
    # Check current filesystem state
    glb_ready = (OUTPUTS_DIR / "preview.glb").exists()
    
    # Check for SVG outputs (single-page or multi-page)
    svg_single = (OUTPUTS_DIR / "dieline_pattern.svg").exists()
    svg_multi = (OUTPUTS_DIR / "dieline_pattern_page0.svg").exists()
    svg_ready = svg_single or svg_multi
    
    # Check for mesh metrics
    metrics_file = OUTPUTS_DIR / "mesh_metrics.json"
    metrics_ready = metrics_file.exists()
    
    state["outputs"] = {
        "glb_ready": glb_ready,
        "glb_url":   "/api/outputs/preview.glb" if glb_ready else None,
        "svg_ready": svg_ready,
        "svg_url":   "/api/outputs/dieline_pattern.svg" if svg_ready else None,
        "metrics_ready": metrics_ready,
        "metrics_url": "/api/outputs/mesh_metrics.json" if metrics_ready else None,
    }
    return jsonify(state)


@app.route("/api/mesh-metrics", methods=["GET"])
def get_mesh_metrics():
    """Get mesh metrics for dynamic sustainability calculation"""
    metrics_file = OUTPUTS_DIR / "mesh_metrics.json"
    if not metrics_file.exists():
        return jsonify({"error": "Metrics not available. Run pipeline first."}), 404
    
    try:
        import json
        with open(metrics_file, 'r') as f:
            metrics = json.load(f)
        return jsonify(metrics)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/outputs/<path:filename>", methods=["GET", "OPTIONS"])
def serve_output_file(filename):
    """Serve any file from outputs directory with proper CORS and download headers"""
    if request.method == "OPTIONS":
        resp = app.make_default_options_response()
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return resp

    try:
        filepath = OUTPUTS_DIR / filename

        if not filepath.exists() or not filepath.is_file():
            abort(404, description=f"{filename} not found in outputs")

        resp = send_file(
            str(filepath),
            as_attachment=False,
            mimetype='application/octet-stream'
        )

        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
        resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        resp.headers["Pragma"] = "no-cache"
        resp.headers["Expires"] = "0"

        if filename.endswith('.svg'):
            resp.headers["Content-Type"] = "image/svg+xml; charset=utf-8"
        elif filename.endswith('.glb') or filename.endswith('.gltf'):
            resp.headers["Content-Type"] = "model/gltf-binary"
        elif filename.endswith('.pdf'):
            resp.headers["Content-Type"] = "application/pdf"

        return resp
    except FileNotFoundError:
        abort(404, description=f"{filename} not found in outputs")


@app.route("/api/debug/files", methods=["GET"])
def debug_files():
    """Debug endpoint to list all files in outputs directory"""
    import os
    files = []
    for f in OUTPUTS_DIR.iterdir():
        if f.is_file():
            files.append({
                "name": f.name,
                "size": f.stat().st_size,
                "exists": f.exists()
            })
    return jsonify({
        "outputs_dir": str(OUTPUTS_DIR),
        "files": files
    })




# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\n[*] MorphoPackEngine API  v1.3.0")
    print(f"[*] Blender:  {BLENDER_EXE}")
    print(f"[*] Uploads:  {UPLOADS_DIR}")
    print(f"[*] Outputs:  {OUTPUTS_DIR}")
    print(f"[*] Pipeline: {PIPELINE_SCRIPT}")
    print(f"[*] Endpoints:")
    print(f"      GET  http://localhost:5050/api/health")
    print(f"      POST http://localhost:5050/api/upload")
    print(f"      POST http://localhost:5050/api/run-pipeline")
    print(f"      GET  http://localhost:5050/api/pipeline-status")
    print(f"      GET  http://localhost:5050/api/mesh-metrics         [NEW: Dynamic scoring]")
    print(f"      GET  http://localhost:5050/api/outputs/<filename>")
    print(f"      GET  http://localhost:5050/api/debug/files\n")
    app.run(host="0.0.0.0", port=5050, debug=True, use_reloader=False)
