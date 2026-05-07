from flask import Flask, jsonify, request
import os

app = Flask(__name__)

# Rota de saúde que aceita qualquer um dos caminhos possíveis
@app.route('/health')
@app.route('/api/health')
@app.route('/_/backend/health')
@app.route('/_/backend/api/health')
def health():
    return jsonify({
        "status": "online",
        "path_received": request.path,
        "env": os.getenv('VERCEL_ENV', 'local')
    }), 200

# Rota de teste para ver o que o Flask está enxergando
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    return jsonify({
        "message": "Caminho capturado",
        "path": path,
        "full_path": request.path
    }), 200

handler = app
