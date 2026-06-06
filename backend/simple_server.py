"""
Simple Flask server for local development (alternative to Azure Functions)
Run with: python simple_server.py
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from morpho_pipeline import compute_morpho_score, MATERIAL_DB

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'morpho-pack-api',
        'version': '0.9.1'
    })

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    POST /api/analyze
    Body: { material_id, volume_m3, degradation_months }
    Returns: MorphoResult JSON
    """
    try:
        body = request.get_json()
        material_id = body.get('material_id', 'mycelium')
        volume_m3 = float(body.get('volume_m3', 0.05))
        degradation_months = int(body.get('degradation_months', 6))

        result = compute_morpho_score(material_id, volume_m3, degradation_months)
        
        # Convert dataclass to dict
        from dataclasses import asdict
        return jsonify(asdict(result))
    except Exception as exc:
        return jsonify({'error': str(exc)}), 500

@app.route('/api/materials', methods=['GET'])
def list_materials():
    """GET /api/materials — returns the full material catalogue."""
    return jsonify(MATERIAL_DB)

if __name__ == '__main__':
    print('\n🌿 Morpho-Pack Backend API Starting...')
    print('📍 Health check: http://localhost:7071/api/health')
    print('📍 Analyze endpoint: http://localhost:7071/api/analyze')
    print('📍 Materials endpoint: http://localhost:7071/api/materials\n')
    app.run(host='0.0.0.0', port=7071, debug=True)
