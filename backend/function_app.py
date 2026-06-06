"""
Morpho-Pack Backend — Azure Functions Entry Point
Flask + Azure Functions wrapper for the packaging pipeline API.
"""
import logging
import azure.functions as func
from .morpho_pipeline import router as pipeline_router

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

@app.route(route="health", methods=["GET"])
def health_check(req: func.HttpRequest) -> func.HttpResponse:
    """Liveness probe for Azure health monitoring."""
    return func.HttpResponse(
        '{"status":"healthy","service":"morpho-pack-api","version":"0.9.1"}',
        status_code=200,
        mimetype="application/json",
        headers={"Access-Control-Allow-Origin": "*"}
    )

# Register pipeline routes
app.register_functions(pipeline_router)
