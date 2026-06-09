"""
Simple Flask server for serving MorphoPack outputs
"""
from pathlib import Path
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

OUTPUTS_DIR = Path(__file__).parent / "outputs"

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "service": "morpho-simple"})

@app.route("/api/outputs/<path:filename>")
def serve_file(filename):
    """Serve any file from outputs directory"""
    try:
        return send_from_directory(str(OUTPUTS_DIR), filename)
    except Exception as e:
        return jsonify({"error": str(e)}), 404

if __name__ == "__main__":
    print(f"Serving files from: {OUTPUTS_DIR}")
    print("Available endpoints:")
    print("  GET /api/health")
    print("  GET /api/outputs/<filename>")
    app.run(host="0.0.0.0", port=5051, debug=False)
