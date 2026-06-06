"""
morpho_fit_core.py — Fusion 360 headless automation script
Runs inside the Autodesk Fusion 360 Python environment.

Usage (headless):
    fusion360 --headless --script CAD-automation/morpho_fit_core.py \
              --args input.step mycelium 6

Pipeline:
  1. Import STEP/OBJ geometry
  2. Compute bounding box + convex hull
  3. Apply material rules from material_rules/<material>.json
  4. Generate tight-fit shell geometry
  5. Export flattened SVG blueprint + GLB preview
"""
import adsk.core
import adsk.fusion
import adsk.cam
import json
import os
import sys
import traceback
from pathlib import Path


# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).parent
RULES_DIR    = SCRIPT_DIR / "material_rules"
OUTPUT_DIR   = SCRIPT_DIR / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ── Material rule loader ───────────────────────────────────────────────────────
def load_material_rules(material_id: str) -> dict:
    rule_file = RULES_DIR / f"{material_id}.json"
    if not rule_file.exists():
        raise FileNotFoundError(f"No material rules found for: {material_id}")
    with open(rule_file) as f:
        return json.load(f)


# ── Geometry helpers ───────────────────────────────────────────────────────────
def get_bounding_box(component: adsk.fusion.Component) -> dict:
    """Return axis-aligned bounding box dimensions in mm."""
    bb = component.boundingBox
    return {
        "x_mm": round((bb.maxPoint.x - bb.minPoint.x) * 10, 2),
        "y_mm": round((bb.maxPoint.y - bb.minPoint.y) * 10, 2),
        "z_mm": round((bb.maxPoint.z - bb.minPoint.z) * 10, 2),
        "volume_cm3": round(
            (bb.maxPoint.x - bb.minPoint.x) *
            (bb.maxPoint.y - bb.minPoint.y) *
            (bb.maxPoint.z - bb.minPoint.z) * 1000, 3
        ),
    }


def apply_wall_offsets(bbox: dict, rules: dict) -> dict:
    """Add material-specific wall thickness and buffer offsets."""
    wall = rules["wall_thickness_mm"]
    buffer = rules["buffer_clearance_mm"]
    return {
        "shell_x_mm": bbox["x_mm"] + 2 * (wall + buffer),
        "shell_y_mm": bbox["y_mm"] + 2 * (wall + buffer),
        "shell_z_mm": bbox["z_mm"] + 2 * (wall + buffer),
        "wall_thickness_mm": wall,
    }


# ── SVG blueprint generator ────────────────────────────────────────────────────
SVG_TEMPLATE = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 {total_w} {total_h}"
     width="{total_w}mm" height="{total_h}mm">
  <title>Morpho-Pack Blueprint — {material_name}</title>
  <style>
    .cut  {{ fill:none; stroke:#047857; stroke-width:0.5; }}
    .fold {{ fill:none; stroke:#34d399; stroke-width:0.3; stroke-dasharray:4,3; }}
    .dim  {{ font:5px JetBrains Mono,monospace; fill:#64748b; }}
    .bg   {{ fill:#f8fafc; }}
  </style>

  <!-- Background -->
  <rect class="bg" width="{total_w}" height="{total_h}" />

  <!-- Outer cut boundary -->
  <rect class="cut" x="10" y="10" width="{w}" height="{h}" rx="1"/>

  <!-- Fold lines -->
  <line class="fold" x1="{x1}" y1="10" x2="{x1}" y2="{h10}"/>
  <line class="fold" x1="{x2}" y1="10" x2="{x2}" y2="{h10}"/>
  <line class="fold" x1="10"   y1="{y1}" x2="{w10}" y2="{y1}"/>

  <!-- Dimensions -->
  <text class="dim" x="{cx}" y="{total_h}" text-anchor="middle">{shell_x:.1f} mm</text>
  <text class="dim" x="5" y="{cy}" text-anchor="middle"
        transform="rotate(-90,5,{cy})">{shell_z:.1f} mm</text>

  <!-- Material label -->
  <text font-size="6" font-family="JetBrains Mono,monospace"
        fill="#065f46" font-weight="600"
        x="{cx}" y="{cy}" text-anchor="middle">{material_name}</text>
</svg>"""


def generate_svg(shell: dict, rules: dict, output_path: Path) -> str:
    x, y, z = shell["shell_x_mm"], shell["shell_y_mm"], shell["shell_z_mm"]
    w = x + z + 20         # face + depth + margins
    h = z + y + 20
    params = dict(
        total_w=w + 20, total_h=h + 20,
        w=w, h=h,
        x1=round(z + 10, 1), x2=round(z + x + 10, 1),
        y1=round(z + 10, 1),
        h10=round(h + 10, 1), w10=round(w + 10, 1),
        cx=round(w / 2 + 10, 1), cy=round(h / 2 + 10, 1),
        shell_x=x, shell_z=z,
        material_name=rules["display_name"],
    )
    svg = SVG_TEMPLATE.format(**params)
    output_path.write_text(svg, encoding="utf-8")
    return str(output_path)


# ── Main entrypoint ────────────────────────────────────────────────────────────
def run(context):
    ui = None
    try:
        app = adsk.core.Application.get()
        ui  = app.userInterface

        args = context.get("arguments", {})
        step_path    = args.get("input_file", "")
        material_id  = args.get("material_id", "mycelium")
        degrad_months = int(args.get("degradation_months", 6))

        rules = load_material_rules(material_id)

        # Import geometry
        import_mgr = app.importManager
        step_opts  = import_mgr.createSTEPImportOptions(step_path)
        doc        = import_mgr.importToNewDocument(step_opts)
        design     = adsk.fusion.Design.cast(doc.products.itemByProductType("DesignProductType"))
        root       = design.rootComponent

        bbox  = get_bounding_box(root)
        shell = apply_wall_offsets(bbox, rules)

        svg_path = OUTPUT_DIR / f"blueprint_{material_id}.svg"
        generate_svg(shell, rules, svg_path)

        result = {
            "status": "success",
            "material_id": material_id,
            "degradation_months": degrad_months,
            "bounding_box": bbox,
            "shell_dimensions": shell,
            "svg_path": str(svg_path),
            "void_fill_m3": round(bbox["volume_cm3"] * rules["void_fill_factor"] / 1e6, 4),
        }

        result_path = OUTPUT_DIR / "last_result.json"
        result_path.write_text(json.dumps(result, indent=2))
        print(json.dumps(result))

    except Exception:
        print(f"ERROR: {traceback.format_exc()}", file=sys.stderr)
        if ui:
            ui.messageBox(f"Morpho-Pack error:\n{traceback.format_exc()}")
