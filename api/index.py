from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/health')
@app.route('/api/health')
@app.route('/_/backend/api/health')
def health():
    return jsonify({
        "status": "online",
        "message": "Servidor ultra-leve ativo",
        "env": os.getenv('VERCEL_ENV', 'local')
    }), 200

# O resto do código será adicionado após confirmarmos que este liga.
handler = app
