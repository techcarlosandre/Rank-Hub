import os
import json
import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from dotenv import load_dotenv

app = Flask(__name__)
application = app
handler = app
from flask import Blueprint

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    psycopg2 = None
    RealDictCursor = None

load_dotenv()

# Gemini Config
from google import genai
gemini_api_key = os.getenv("GEMINI_API_KEY")
client = None
if gemini_api_key:
    try:
        # v1beta is often required for the latest models in some SDK versions
        client = genai.Client(api_key=gemini_api_key, http_options={'api_version': 'v1beta'})
    except Exception as e:
        print(f"Erro Gemini: {e}")

# Criamos um Blueprint para gerenciar o prefixo da Vercel
api_bp = Blueprint('api_bp', __name__, url_prefix='/_/backend/api')

@api_bp.route('/health')
@app.route('/health') # Mantemos uma rota na raiz para teste direto
def health_check():
    db_url = os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL")
    return jsonify({
        'status': 'online',
        'db_found': bool(db_url),
        'psycopg2': psycopg2 is not None
    }), 200

# Vamos registrar o blueprint no app mais tarde

def get_db_connection():
    db_url = os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL")
    if db_url:
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
        conn.autocommit = True
        return conn
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(base_dir, 'rankhub.db')
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        return conn

def db_execute(conn, sql, params=()):
    is_sqlite = isinstance(conn, sqlite3.Connection)
    if not is_sqlite:
        sql = sql.replace('?', '%s')
        cur = conn.cursor()
        cur.execute(sql, params)
        return cur
    return conn.execute(sql, params)

def db_insert(conn, sql, params=()):
    is_sqlite = isinstance(conn, sqlite3.Connection)
    if not is_sqlite:
        sql = sql.replace('?', '%s')
        if "RETURNING" not in sql.upper(): sql += " RETURNING id"
        cur = conn.cursor()
        cur.execute(sql, params)
        row = cur.fetchone()
        return row['id'] if row else None
    cur = conn.execute(sql, params)
    return cur.lastrowid

def init_db():
    conn = get_db_connection()
    is_sqlite = isinstance(conn, sqlite3.Connection)
    cursor = conn.cursor()
    base_dir = os.path.dirname(os.path.abspath(__file__))
    schema_path = os.path.join(base_dir, 'schema.sql')
    try:
        if os.path.exists(schema_path):
            with open(schema_path, 'r', encoding='utf-8') as f:
                schema_sql = f.read()
                if is_sqlite:
                    schema_sql = schema_sql.replace('SERIAL PRIMARY KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT')
                    schema_sql = schema_sql.replace('TIMESTAMP DEFAULT CURRENT_TIMESTAMP', 'DATETIME DEFAULT CURRENT_TIMESTAMP')
                if is_sqlite: cursor.executescript(schema_sql)
                else: db_execute(conn, schema_sql)
        
        # Migrações rápidas
        try: db_execute(conn, "ALTER TABLE hub_membros ADD COLUMN favorito INTEGER DEFAULT 0")
        except: pass
        conn.commit()
    except Exception as e:
        print(f"Init DB Error: {e}")
    finally:
        conn.close()

_db_initialized = False
@app.before_request
def auto_init():
    if request.path in ['/health', '/api/health']: return
    global _db_initialized
    if not _db_initialized:
        try:
            init_db()
            _db_initialized = True
        except: pass

# --- Rotas Originais ---

@api_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    conn = get_db_connection()
    user = db_execute(conn, 'SELECT * FROM hub_usuarios WHERE email = ? AND senha = ?', (data.get('email'), data.get('senha'))).fetchone()
    conn.close()
    if user:
        u = dict(user)
        u['foto_url'] = u.get('foto_perfil')
        return jsonify({'status': 'success', 'user': u}), 200
    return jsonify({'error': 'Credenciais inválidas'}), 401

@api_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    conn = get_db_connection()
    try:
        exists = db_execute(conn, 'SELECT id FROM hub_usuarios WHERE email = ?', (data.get('email'),)).fetchone()
        if exists: return jsonify({'error': 'E-mail já existe'}), 400
        
        foto = f"https://api.dicebear.com/7.x/avataaars/svg?seed={data.get('nome')}"
        uid = db_insert(conn, "INSERT INTO hub_usuarios (nome, email, senha, foto_perfil) VALUES (?,?,?,?)", 
                        (data.get('nome'), data.get('email'), data.get('senha'), foto))
        conn.commit()
        return jsonify({'status': 'success', 'user_id': uid}), 201
    except Exception as e: return jsonify({'error': str(e)}), 500
    finally: conn.close()

@api_bp.route('/rankings', methods=['GET', 'POST'])
def handle_rankings():
    conn = get_db_connection()
    if request.method == 'POST':
        data = request.json
        rid = db_insert(conn, "INSERT INTO hub_rankings (nome, descricao, admin_id) VALUES (?,?,?)",
                        (data['nome'], data.get('descricao', ''), data.get('admin_id', 1)))
        
        # Adicionar regras se existirem
        regras = data.get('regras', [])
        for regra in regras:
            tipo = regra.get('tipo_atividade') or regra.get('atividade') or regra.get('nome')
            valor = regra.get('valor_ponto') or regra.get('pontos') or 10
            condicao = regra.get('condicao_extra') or regra.get('descricao') or ''
            db_execute(conn, """
                INSERT INTO regras_pontuacao (ranking_id, tipo_atividade, valor_ponto, condicao_extra)
                VALUES (?, ?, ?, ?)
            """, (rid, tipo, valor, condicao))

        db_execute(conn, "INSERT INTO hub_membros (ranking_id, usuario_id, permissao) VALUES (?,?,'admin')", (rid, data.get('admin_id', 1)))
        conn.commit()
        conn.close()
        return jsonify({'id': rid}), 201
    
    uid = request.args.get('usuario_id')
    if uid:
        ranks = db_execute(conn, """
            SELECT r.* FROM hub_rankings r 
            JOIN hub_membros m ON r.id = m.ranking_id 
            WHERE m.usuario_id = ?
        """, (uid,)).fetchall()
    else:
        ranks = db_execute(conn, "SELECT * FROM hub_rankings").fetchall()
    conn.close()
    return jsonify([dict(r) for r in ranks]), 200

@api_bp.route('/generate-rules', methods=['POST'])
def generate_rules():
    data = request.json
    if not data:
        return jsonify({'error': 'JSON payload is missing.'}), 400
    prompt_usuario = data.get('prompt', '')
    if not prompt_usuario:
        return jsonify({'error': 'O campo prompt é obrigatório.'}), 400
    try:
        if not client:
            return jsonify({'error': 'A chave da API do Gemini não está configurada no Vercel.'}), 500
        
        system_prompt = (
            "Você é o Assistente de IA do Rank&Hub, uma inteligência de elite que gerencia rankings.\n"
            "Sua tarefa é criar ou atualizar um ranking estruturado baseado no desejo do usuário.\n\n"
            "Você DEVE retornar ESTRITAMENTE um JSON no formato:\n"
            "{\n"
            "    \"nome_ranking\": \"Nome criativo para o ranking\",\n"
            "    \"descricao\": \"Uma descrição envolvente\",\n"
            "    \"resumo\": \"Um resumo curto do que foi feito\",\n"
            "    \"regras\": [\n"
            "        { \"tipo_atividade\": \"Nome da Atividade\", \"valor_ponto\": 10, \"condicao_extra\": \"Opcional\" }\n"
            "    ],\n"
            "    \"acoes\": [\n"
            "        { \"tipo\": \"ALTERAR\", \"dados\": { \"nome\": \"Novo Nome\", \"cor_tema_hex\": \"#hex\" } },\n"
            "        { \"tipo\": \"REGRA\", \"dados\": { \"tipo_atividade\": \"Nome\", \"valor_ponto\": 10, \"condicao_extra\": \"...\" } },\n"
            "        { \"tipo\": \"CONVIDAR\", \"dados\": { \"email\": \"exemplo@email.com\" } }\n"
            "    ]\n"
            "}\n"
            "Importante: 'regras' é para novos rankings. 'acoes' é para atualizar rankings existentes. Preencha ambos de forma coerente."
        )
        
        full_prompt = f"{system_prompt}\n\nEntrada do usuário:\n{prompt_usuario}"
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=full_prompt
        )
        result_text = response.text.strip()
        
        # Limpeza básica do markdown se a IA retornar
        if result_text.startswith("```json"):
            result_text = result_text[7:]
        elif result_text.startswith("```"):
            result_text = result_text[3:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]
            
        json_result = json.loads(result_text.strip())
        return jsonify(json_result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/rankings/<int:ranking_id>', methods=['GET'])
def get_ranking(ranking_id):
    conn = get_db_connection()
    ranking = db_execute(conn, 'SELECT * FROM hub_rankings WHERE id = ?', (ranking_id,)).fetchone()
    conn.close()
    if ranking: return jsonify(dict(ranking)), 200
    return jsonify({'error': 'Ranking não encontrado'}), 404

@api_bp.route('/rankings/<int:ranking_id>/tasks', methods=['GET', 'POST'])
def handle_tasks(ranking_id):
    conn = get_db_connection()
    if request.method == 'POST':
        data = request.json
        db_execute(conn, "INSERT INTO hub_tarefas (ranking_id, nome, descricao, pontos) VALUES (?,?,?,?)",
                    (ranking_id, data['nome'], data.get('descricao'), data.get('pontos', 10)))
        conn.commit()
        conn.close()
        return jsonify({'status': 'success'}), 201
    tasks = db_execute(conn, "SELECT * FROM hub_tarefas WHERE ranking_id = ?", (ranking_id,)).fetchall()
    conn.close()
    return jsonify([dict(t) for t in tasks]), 200

@api_bp.route('/rankings/<int:ranking_id>/members', methods=['GET', 'POST'])
def handle_members(ranking_id):
    conn = get_db_connection()
    if request.method == 'POST':
        data = request.json
        db_execute(conn, "INSERT INTO hub_membros (ranking_id, usuario_id, permissao) VALUES (?,?,'membro')", (ranking_id, data['usuario_id']))
        conn.commit()
        conn.close()
        return jsonify({'status': 'success'}), 201
    members = db_execute(conn, """
        SELECT u.id, u.nome, u.email, u.foto_perfil as foto_url, m.permissao as role, m.pontos
        FROM hub_membros m
        JOIN hub_usuarios u ON m.usuario_id = u.id
        WHERE m.ranking_id = ?
    """, (ranking_id,)).fetchall()
    conn.close()
    return jsonify([dict(m) for m in members]), 200

@api_bp.route('/rankings/<int:ranking_id>/leaderboard', methods=['GET'])
def get_leaderboard(ranking_id):
    conn = get_db_connection()
    members = db_execute(conn, """
        SELECT u.id, u.nome, m.pontos, u.foto_perfil as foto_url
        FROM hub_membros m
        JOIN hub_usuarios u ON m.usuario_id = u.id
        WHERE m.ranking_id = ?
        ORDER BY m.pontos DESC
    """, (ranking_id,)).fetchall()
    conn.close()
    return jsonify([dict(m) for m in members]), 200

app.register_blueprint(api_bp)

if __name__ == '__main__':
    app.run(debug=True)
