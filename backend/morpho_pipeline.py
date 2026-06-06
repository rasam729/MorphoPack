"""
morpho_pipeline.py — Core packaging analysis pipeline
Wraps Fusion 360 headless calls and ESG scoring logic.
"""
import json
import logging
from dataclasses import dataclass, asdict
from typing import Literal
import azure.functions as func

logger = logging.getLogger(__name__)

MATERIAL_DB = {
    "mycelium": {
        "name": "Agricultural Mycelium",
        "co2_per_kg": 0.8,
        "degradation_days": 45,
        "tensile_mpa": 0.5,
        "density_kgm3": 50,
        "base_score": 94,
    },
    "cardboard": {
        "name": "Corrugated Cardboard",
        "co2_per_kg": 2.4,
        "degradation_days": 360,
        "tensile_mpa": 3.2,
        "density_kgm3": 80,
        "base_score": 76,
    },
    "kraft": {
        "name": "Recycled Kraft Fibers",
        "co2_per_kg": 1.6,
        "degradation_days": 180,
        "tensile_mpa": 2.1,
        "density_kgm3": 65,
        "base_score": 85,
    },
}


@dataclass
class MorphoResult:
    """Output payload returned to the frontend dashboard."""
    material_id: str
    material_name: str
    sustainability_score: float          # Ss — out of 100
    void_fill_eliminated_m3: float       # cubic metres saved per batch
    container_efficiency_pct: float      # percentage improvement
    co2_reduction_kg: float              # kg CO₂ saved vs baseline
    degradation_months: int
    svg_blueprint_url: str               # signed Azure Blob URL
    glb_preview_url: str                 # signed Azure Blob URL


def compute_morpho_score(
    material_id: str,
    volume_m3: float,
    degradation_months: int,
) -> MorphoResult:
    """
    Core morpho-fit scoring algorithm.
    In production this calls the Fusion 360 headless subprocess.
    For the hackathon demo, returns deterministic mock values.
    """
    mat = MATERIAL_DB.get(material_id)
    if not mat:
        raise ValueError(f"Unknown material: {material_id}")

    degradation_factor = min(1.0, degradation_months / 24)
    ss = round(mat["base_score"] * (0.85 + 0.15 * degradation_factor), 1)
    void_fill = round(volume_m3 * 0.31, 3)
    efficiency = round(60 + ss * 0.25, 1)
    co2_saved = round((5.2 - mat["co2_per_kg"]) * volume_m3 * 1000, 2)

    return MorphoResult(
        material_id=material_id,
        material_name=mat["name"],
        sustainability_score=ss,
        void_fill_eliminated_m3=void_fill,
        container_efficiency_pct=efficiency,
        co2_reduction_kg=co2_saved,
        degradation_months=degradation_months,
        svg_blueprint_url="https://morphopackstorage.blob.core.windows.net/outputs/demo_blueprint.svg",
        glb_preview_url="https://morphopackstorage.blob.core.windows.net/outputs/demo_pack.glb",
    )


# ── Azure Function routes ──────────────────────────────────────────────────────

router = func.Blueprint()


@router.route(route="analyze", methods=["POST"])
def analyze(req: func.HttpRequest) -> func.HttpResponse:
    """
    POST /api/analyze
    Body: { material_id, volume_m3, degradation_months }
    Returns: MorphoResult JSON
    """
    try:
        body = req.get_json()
        material_id = body.get("material_id", "mycelium")
        volume_m3 = float(body.get("volume_m3", 0.05))
        degradation_months = int(body.get("degradation_months", 6))

        result = compute_morpho_score(material_id, volume_m3, degradation_months)
        return func.HttpResponse(
            json.dumps(asdict(result)),
            status_code=200,
            mimetype="application/json",
            headers={"Access-Control-Allow-Origin": "*"},
        )
    except Exception as exc:
        logger.exception("Analysis pipeline failed")
        return func.HttpResponse(
            json.dumps({"error": str(exc)}),
            status_code=500,
            mimetype="application/json",
        )


@router.route(route="materials", methods=["GET"])
def list_materials(req: func.HttpRequest) -> func.HttpResponse:
    """GET /api/materials — returns the full material catalogue."""
    return func.HttpResponse(
        json.dumps(MATERIAL_DB),
        status_code=200,
        mimetype="application/json",
        headers={"Access-Control-Allow-Origin": "*"},
    )
