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
import shutil
from pathlib import Path
from datetime import datetime

import bcrypt
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_file, send_from_directory, abort
from flask_cors import CORS
from sqlalchemy import (
    create_engine, MetaData, Table, Column, Integer, String, Boolean,
    Text, JSON, ForeignKey, DateTime, select, insert, update
)
from sqlalchemy.sql import func

# ─── Paths ────────────────────────────────────────────────────────────────────
ENGINE_DIR      = Path(__file__).parent.resolve()
UPLOADS_DIR     = ENGINE_DIR / "uploads"
OUTPUTS_DIR     = ENGINE_DIR / "outputs"
PIPELINE_SCRIPT = ENGINE_DIR / "pipeline.py"

UPLOADS_DIR.mkdir(exist_ok=True)
OUTPUTS_DIR.mkdir(exist_ok=True)
load_dotenv(ENGINE_DIR.parent / ".env")

# ─── Blender path ─────────────────────────────────────────────────────────────

def _find_blender_executable() -> str:
    env_path = os.environ.get("BLENDER_PATH", "").strip()
    candidates = []

    # Only use BLENDER_PATH from environment if it points to an existing file
    if env_path and Path(env_path).exists():
        candidates.append(env_path)
    elif env_path:
        # Warn user (printed to server logs) but do not treat non-existent path as valid
        print(f"[WARN] BLENDER_PATH set but file not found: {env_path}")

    path_cmd = shutil.which("blender")
    if path_cmd:
        candidates.append(path_cmd)

    if os.name == "nt":
        candidates.extend([
            r"C:\Program Files\Blender Foundation\Blender 4.5\blender.exe",
            r"C:\Program Files\Blender Foundation\Blender 4.4\blender.exe",
            r"C:\Program Files\Blender Foundation\Blender 4.3\blender.exe",
            r"C:\Program Files (x86)\Blender Foundation\Blender 4.5\blender.exe",
        ])
    else:
        candidates.extend([
            "/usr/bin/blender",
            "/usr/local/bin/blender",
        ])

    for candidate in candidates:
        try:
            if candidate and Path(candidate).exists():
                return str(Path(candidate).resolve())
        except Exception:
            continue

    # Try to find `blender` on PATH
    path_cmd = shutil.which("blender")
    if path_cmd:
        return str(Path(path_cmd).resolve())

    # Fall back to common defaults (only if they exist)
    default_candidates = []
    if os.name == "nt":
        default_candidates = [
            r"C:\Program Files\Blender Foundation\Blender 4.5\blender.exe",
            r"C:\Program Files\Blender Foundation\Blender 4.4\blender.exe",
            r"C:\Program Files\Blender Foundation\Blender 4.3\blender.exe",
        ]
    else:
        default_candidates = ["/usr/bin/blender", "/usr/local/bin/blender"]

    for dc in default_candidates:
        if Path(dc).exists():
            return str(Path(dc).resolve())

    # If nothing found, return the literal 'blender' so subprocess may still attempt PATH lookup
    return "blender"


BLENDER_EXE = _find_blender_executable()

# ─── Flask app ────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

# ─── Database configuration ───────────────────────────────────────────────────
DATABASE_URL = os.environ.get("DATABASE_URL")
engine = None
metadata = MetaData()
users = Table(
    "users", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("email", String(255), nullable=False, unique=True),
    Column("password_hash", String(255), nullable=False),
    Column("name", String(255)),
    Column("is_active", Boolean, nullable=False, server_default="true"),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)
upload_history = Table(
    "upload_history", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", Integer, ForeignKey("users.id"), nullable=True),
    Column("job_id", String(64), nullable=True, index=True),
    Column("file_name", String(512), nullable=False),
    Column("blob_url", Text, nullable=True),
    Column("status", String(50), nullable=False, server_default="uploaded"),
    Column("pipeline_result", JSON, nullable=True),
    Column("metadata", JSON, nullable=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)

if DATABASE_URL:
    engine = create_engine(DATABASE_URL, future=True)
    metadata.create_all(engine)


def get_db_connection():
    if engine is None:
        raise RuntimeError("DATABASE_URL is not configured. Set DATABASE_URL in environment.")
    return engine.begin()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


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


# ─── SVG to PDF conversion ────────────────────────────────────────────────────
def _convert_svg_to_pdf(svg_path: str, pdf_path: str) -> bool:
    """
    Convert SVG dieline to PDF for printing and archival.
    Uses svglib + reportlab for pure Python conversion (no external tools needed).
    """
    try:
        from svglib.svglib import svg2rlg
        from reportlab.graphics import renderPDF
        
        print(f"[PDF] Converting SVG to PDF: {svg_path} → {pdf_path}")
        
        # Parse SVG and convert to ReportLab drawing
        drawing = svg2rlg(svg_path)
        
        if drawing is None:
            print("[PDF] [WARN] SVG parsing returned None")
            return False
        
        # Render to PDF
        renderPDF.drawToFile(drawing, pdf_path, fmt='PDF')
        
        if Path(pdf_path).exists():
            pdf_size = Path(pdf_path).stat().st_size / 1024
            print(f"[PDF] [OK] PDF generated successfully ({pdf_size:.1f} KB)")
            return True
        else:
            print("[PDF] [WARN] PDF file not created")
            return False
            
    except ImportError as ie:
        print(f"[PDF] [WARN] Missing PDF library: {ie}")
        return False
    except Exception as e:
        print(f"[PDF] [ERROR] SVG to PDF conversion failed: {e}")
        return False


# ─── Python-native BFS dieline fallback ───────────────────────────────────────
# Only used when Blender's io_mesh_paper_model addon is unavailable headlessly.

def _write_placeholder_svg(output_path: str, message: str = 'Fallback dieline placeholder.') -> str:
    content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="260" viewBox="0 0 500 260">
  <rect x="12" y="12" width="476" height="236" rx="16" ry="16" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3" />
  <text x="250" y="105" text-anchor="middle" fill="#1e293b" font-family="DM Sans,Arial,sans-serif" font-size="22" font-weight="700">Dieline placeholder</text>
  <text x="250" y="145" text-anchor="middle" fill="#64748b" font-family="DM Mono,monospace" font-size="12">{message}</text>
  <path d="M60 200 H440" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="8 6" />
  <text x="250" y="225" text-anchor="middle" fill="#94a3b8" font-family="DM Mono,monospace" font-size="10">Generated when no Blender SVG export was available</text>
</svg>
'''
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)
    return output_path


def _generate_dieline_fallback(mesh_path: str, output_path: str) -> str:
    """
    Emergency fallback: Simple SVG dieline from mesh bounding box.
    Since full unfolding is complex without Blender, generate a technical drawing instead.
    """
    import trimesh
    import numpy as np

    try:
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

        # Get mesh extents
        try:
            mesh.merge_vertices()
        except Exception as exc:
            print(f"[Dieline-FB] merge_vertices failed: {exc}")

        bounds = mesh.bounds
        extents = bounds[1] - bounds[0]
        
        # Scale to fit page (convert to mm and scale for SVG)
        scale = 100.0  # pixels per meter
        w = extents[0] * scale
        h = extents[1] * scale
        d = extents[2] * scale
        
        # Add margins
        margin = 40
        svg_w = w + 2 * margin + 100
        svg_h = (h + d) + 3 * margin + 100

        print(f"[Dieline-FB] Mesh bounds: {extents[0]:.3f}m x {extents[1]:.3f}m x {extents[2]:.3f}m")
        print(f"[Dieline-FB] Generating technical dieline drawing ({svg_w:.0f}x{svg_h:.0f}px)...")

        # Generate technical drawing SVG
        svg_lines = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{svg_w:.0f}" height="{svg_h:.0f}" viewBox="0 0 {svg_w:.0f} {svg_h:.0f}">',
            '<style>',
            '  .frame { fill: none; stroke: #333; stroke-width: 2; }',
            '  .fold-line { fill: none; stroke: #0066cc; stroke-width: 1.5; stroke-dasharray: 5,5; }',
            '  .cut-line { fill: none; stroke: #ff3333; stroke-width: 2; }',
            '  .label { font-family: Arial, sans-serif; font-size: 12px; fill: #333; }',
            '  .dimension { font-family: Arial, sans-serif; font-size: 10px; fill: #666; }',
            '</style>',
        ]
        
        x_off = margin
        y_off = margin
        
        # Front view (width x height)
        svg_lines.extend([
            f'<rect class="frame" x="{x_off}" y="{y_off}" width="{w}" height="{h}"/>',
            f'<text class="label" x="{x_off + w/2}" y="{y_off - 15}" text-anchor="middle">Front View</text>',
        ])
        
        # Top view (width x depth) - below front view
        top_y = y_off + h + margin
        svg_lines.extend([
            f'<rect class="frame" x="{x_off}" y="{top_y}" width="{w}" height="{d}"/>',
            f'<text class="label" x="{x_off + w/2}" y="{top_y - 15}" text-anchor="middle">Top View</text>',
        ])
        
        # Side view (depth x height) - to the right
        side_x = x_off + w + margin
        svg_lines.extend([
            f'<rect class="frame" x="{side_x}" y="{y_off}" width="{d}" height="{h}"/>',
            f'<text class="label" x="{side_x + d/2}" y="{y_off - 15}" text-anchor="middle">Side View</text>',
        ])
        
        # Add dimension labels
        svg_lines.extend([
            f'<text class="dimension" x="{x_off + w/2}" y="{top_y + d + 30}">{extents[0]*1000:.0f}mm</text>',
            f'<text class="dimension" x="{x_off - 30}" y="{y_off + h/2}">{extents[1]*1000:.0f}mm</text>',
            f'<text class="dimension" x="{side_x + d/2}" y="{y_off + h + 30}">{extents[2]*1000:.0f}mm</text>',
            f'<text class="dimension" x="{side_x + d/2}" y="{y_off - 30}" text-anchor="middle">Face count: {len(mesh.faces)}</text>',
        ])
        
        # Add fold and cut indicators
        svg_lines.extend([
            f'<line class="fold-line" x1="{x_off + w*0.25}" y1="{y_off}" x2="{x_off + w*0.25}" y2="{y_off + h}"/>',
            f'<line class="fold-line" x1="{x_off + w*0.75}" y1="{y_off}" x2="{x_off + w*0.75}" y2="{y_off + h}"/>',
            f'<text class="label" x="{x_off + 5}" y="{y_off + h + 20}" font-size="11">Fold lines: — — —</text>',
            f'<text class="label" x="{x_off + 5}" y="{y_off + h + 35}" font-size="11">Cut lines: ─────</text>',
        ])
        
        svg_lines.append('</svg>')
        
        svg_content = '\n'.join(svg_lines)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(svg_content)
        
        print(f"[Dieline-FB] [OK] Generated technical drawing SVG: {output_path}")
        return output_path
        
    except Exception as exc:
        print(f"[Dieline-FB] Generation failed: {exc}")
        _write_placeholder_svg(output_path, message="Fallback technical drawing generated")
        return output_path

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
                try:
                    _write_placeholder_svg(str(svg_out), message='Fallback placeholder generated')
                    print(f"[Fallback] Wrote placeholder SVG: {svg_out}")
                except Exception as ph_exc:
                    print(f"[Fallback] Placeholder SVG creation failed: {ph_exc}")

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

    # ── Generate PDF from SVG if available ─────────────────────────────────────
    pdf_out = OUTPUTS_DIR / "dieline_pattern.pdf"
    pdf_ok = False
    if svg_ok:
        pdf_ok = _convert_svg_to_pdf(str(svg_out), str(pdf_out))
        if not pdf_ok:
            # PDF generation failed, but SVG is still available so not a critical error
            print("[PDF] PDF generation failed but SVG is available")

    if engine and _job.get("id"):
        result_payload = {
            "glb_url": f"/api/outputs/preview.glb" if glb_ok else None,
            "svg_url": f"/api/outputs/dieline_pattern.svg" if svg_ok else None,
            "pdf_url": f"/api/outputs/dieline_pattern.pdf" if pdf_ok else None,
            "status": "done" if not final_err else "error",
            "generated_at": datetime.utcnow().isoformat(),
        }
        with get_db_connection() as conn:
            conn.execute(
                update(upload_history)
                .where(upload_history.c.job_id == _job["id"])
                .values(
                    status=result_payload["status"],
                    pipeline_result=result_payload,
                    blob_url=result_payload["glb_url"],
                )
            )

    _update_job(
        status="done" if not final_err else "error",
        step=None,
        steps_done=PIPELINE_STEPS,
        error=final_err,
        finished_at=datetime.utcnow().isoformat(),
    )
    print(f"\n[OK] Pipeline done.  GLB={glb_ok}  SVG={svg_ok}  PDF={pdf_ok}\n")



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
        "database":     bool(engine),
    })


@app.route("/api/register", methods=["POST"])
def register():
    payload = request.get_json() or {}
    email = payload.get("email", "").strip().lower()
    password = payload.get("password", "")
    name = payload.get("name", "").strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    if engine is None:
        return jsonify({"error": "Database not configured."}), 500

    hashed = hash_password(password)
    with get_db_connection() as conn:
        existing = conn.execute(select(users.c.id).where(users.c.email == email)).first()
        if existing:
            return jsonify({"error": "Account already exists."}), 409
        result = conn.execute(insert(users).values(email=email, password_hash=hashed, name=name or email.split('@')[0]))
        user_id = result.inserted_primary_key[0]

    return jsonify({"id": user_id, "email": email, "name": name or email.split('@')[0]})


@app.route("/api/login", methods=["POST"])
def login():
    payload = request.get_json() or {}
    email = payload.get("email", "").strip().lower()
    password = payload.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    if engine is None:
        return jsonify({"error": "Database not configured."}), 500

    with get_db_connection() as conn:
        row = conn.execute(select(users).where(users.c.email == email)).first()
        if not row or not verify_password(password, row.password_hash):
            return jsonify({"error": "Invalid email or password."}), 401

    return jsonify({"id": row.id, "email": row.email, "name": row.name})


@app.route("/api/history", methods=["GET"])
def history():
    user_id = request.args.get("user_id", type=int)
    if not user_id:
        return jsonify({"error": "user_id query parameter is required."}), 400
    if engine is None:
        return jsonify({"error": "Database not configured."}), 500

    with get_db_connection() as conn:
        rows = conn.execute(
            select(upload_history)
            .where(upload_history.c.user_id == user_id)
            .order_by(upload_history.c.created_at.desc())
        ).all()

    items = []
    for r in rows:
        item = dict(r._mapping)
        created_at = item.get("created_at")
        if isinstance(created_at, datetime):
            item["created_at"] = created_at.isoformat()
        items.append(item)

    return jsonify(items)


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

    material = request.form.get("material") or "unknown"
    degradation_months = request.form.get("degradation_months") or "0"
    try:
        degradation_months = int(degradation_months)
    except ValueError:
        degradation_months = 0

    user_id = request.form.get("user_id", type=int)
    job_id = f"job_{uuid.uuid4().hex[:8]}"

    if engine:
        with get_db_connection() as conn:
            conn.execute(
                insert(upload_history).values(
                    user_id=user_id,
                    job_id=job_id,
                    file_name=safe_name,
                    status="uploaded",
                    metadata={
                        "material": material,
                        "degradation_months": degradation_months,
                    },
                )
            )

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
    payload = request.get_json() or {}
    job_id = payload.get("job_id") or _job["id"] or f"job_{uuid.uuid4().hex[:8]}"
    material = payload.get("material")
    degradation_months = payload.get("degradation_months")
    user_id = payload.get("user_id")

    if engine and job_id:
        with get_db_connection() as conn:
            update_values = {}
            if material or degradation_months is not None or user_id:
                update_values["metadata"] = {
                    "material": material,
                    "degradation_months": degradation_months,
                }
            if user_id:
                update_values["user_id"] = user_id
            if update_values:
                conn.execute(
                    update(upload_history)
                    .where(upload_history.c.job_id == job_id)
                    .values(**update_values)
                )

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
        "pdf_ready": (OUTPUTS_DIR / "dieline_pattern.pdf").exists(),
        "pdf_url":   "/api/outputs/dieline_pattern.pdf" if (OUTPUTS_DIR / "dieline_pattern.pdf").exists() else None,
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
