import os
import json
import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
application = app
handler = app
CORS(app, resources={r"/api/*": {"origins": "*"}}) 
from google import genai
from dotenv import load_dotenv
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    psycopg2 = None
    RealDictCursor = None
from datetime import datetime
load_dotenv()
@app.route('/health')
@app.route('/api/health')
def health_check():
    db_url = os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL")
    return jsonify({
        'status': 'online',
        'database_env_found': bool(db_url),
        'flask_version': '3.0.0',
        'psycopg2_found': psycopg2 is not None
    }), 200

gemini_api_key = os.getenv("GEMINI_API_KEY")
client = None
if gemini_api_key:
    try:
        client = genai.Client(api_key=gemini_api_key, http_options={'api_version': 'v1'})
    except Exception as e:
        print(f"Erro ao inicializar o cliente Gemini: {e}")
else:
    print("Aviso: GEMINI_API_KEY não definida no arquivo .env.")
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
def send_welcome_email(destinatario, nome_usuario):
    if not EMAIL_USER or not EMAIL_PASS:
        print("Erro: Credenciais de e-mail não configuradas no .env")
        return False
    try:
        msg = MIMEMultipart()
        msg['From'] = f"Rank&Hub <{EMAIL_USER}>"
        msg['To'] = destinatario
        msg['Subject'] = "🚀 Bem-vindo ao Rank&Hub!"
        corpo_html = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: 
            <h1 style="color: 
            <p style="font-size: 18px;">Olá, <strong>{nome_usuario}</strong>!</p>
            <p>Sua conta no Rank&Hub foi criada com sucesso. Estamos muito felizes em ter você conosco!</p>
            <div style="background: 
                <p style="margin: 0;">A partir de agora você pode:</p>
                <ul style="color: 
                    <li>Criar seus próprios Rankings</li>
                    <li>Participar de competições com seus amigos</li>
                    <li>Ganhar medalhas e subir no Hub Global</li>
                </ul>
            </div>
            <a href="/" style="display: inline-block; background: 
            <p style="margin-top: 40px; color: 
        </div>
        """
        msg.attach(MIMEText(corpo_html, 'html'))
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.send_message(msg)
        print(f"E-mail de boas-vindas enviado para {destinatario}")
        return True
    except Exception as e:
        print(f"Erro ao enviar e-mail: {e}")
        return False
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
    """Helper para executar queries em ambos os bancos (ajusta ? para %s no Postgres)"""
    is_sqlite = isinstance(conn, sqlite3.Connection)
    if not is_sqlite:
        sql = sql.replace('?', '%s')
        cur = conn.cursor()
        cur.execute(sql, params)
        return cur
    else:
        return conn.execute(sql, params)
def db_insert(conn, sql, params=()):
    """Helper para INSERTS que retorna o ID gerado"""
    is_sqlite = isinstance(conn, sqlite3.Connection)
    if not is_sqlite:
        sql = sql.replace('?', '%s')
        if "RETURNING" not in sql.upper():
            sql += " RETURNING id"
        cur = conn.cursor()
        cur.execute(sql, params)
        row = cur.fetchone()
        return row['id'] if row else None
    else:
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
                if is_sqlite:
                    cursor.executescript(schema_sql)
                else:
                    db_execute(conn, schema_sql)
                if is_sqlite: conn.commit()
        pass
        try:
            db_execute(conn, "SELECT favorito FROM hub_membros LIMIT 1")
        except Exception:
            print(">>> MIGRACAO: Adicionando coluna 'favorito' em hub_membros")
            try:
                db_execute(conn, "ALTER TABLE hub_membros ADD COLUMN favorito INTEGER DEFAULT 0")
            except Exception: pass
        conn.commit()
        print("Banco de Dados SQL inicializado/verificado.")
    except Exception as e:
        print(f"Aviso init_db: {e}")
    colunas_novas = [
        ("ciclo_reset", "TEXT DEFAULT 'nunca'"),
        ("premio_atual", "TEXT"),
        ("ultimo_reset", "DATETIME"),
        ("emoji", "TEXT"),
        ("foto_url", "TEXT"),
        ("nome_membros", "TEXT DEFAULT 'Membros'"),
        ("titulo_membros", "TEXT DEFAULT 'Participantes do Ranking'"),
        ("cargo_owner", "TEXT DEFAULT 'Fundador'"),
        ("cargo_admin", "TEXT DEFAULT 'Administrador'"),
        ("cargo_membro", "TEXT DEFAULT 'Membro'")
    ]
    for nome_col, tipo_col in colunas_novas:
        try:
            db_execute(conn, f"ALTER TABLE hub_rankings ADD COLUMN {nome_col} {tipo_col}")
            conn.commit()
            print(f"Coluna '{nome_col}' adicionada com sucesso.")
        except Exception:
            pass
        except Exception:
            pass
    try:
        db_execute(conn, "ALTER TABLE hub_tarefas ADD COLUMN pontos INTEGER DEFAULT 10")
        conn.commit()
    except:
        pass
    try:
        db_execute(conn, "ALTER TABLE hub_tarefas ADD COLUMN recorrencia TEXT DEFAULT 'livre'")
        conn.commit()
    except:
        pass
    try:
        db_execute(conn, "ALTER TABLE hub_membros ADD COLUMN pontos INTEGER DEFAULT 0")
        conn.commit()
    except:
        pass
    try:
        db_execute(conn, "ALTER TABLE hub_membros ADD COLUMN apelido TEXT")
        conn.commit()
    except:
        pass
    is_sqlite = isinstance(conn, sqlite3.Connection)
    pk_type = "INTEGER PRIMARY KEY AUTOINCREMENT" if is_sqlite else "SERIAL PRIMARY KEY"
    
    db_execute(conn, f"""
        CREATE TABLE IF NOT EXISTS hub_patentes (
            id {pk_type},
            ranking_id INTEGER REFERENCES hub_rankings(id) ON DELETE CASCADE,
            nome TEXT NOT NULL,
            pontos_minimos INTEGER NOT NULL,
            cor_hex TEXT DEFAULT '#3b82f6'
        )
    """)
    conn.commit()
    
    db_execute(conn, f"""
        CREATE TABLE IF NOT EXISTS hub_convites_pendentes (
            id {pk_type},
            email TEXT NOT NULL,
            ranking_id INTEGER REFERENCES hub_rankings(id) ON DELETE CASCADE,
            data_convite DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(email, ranking_id)
        )
    """)
    conn.commit()
    conn.close()
def send_invitation_email(destinatario, nome_ranking, nome_admin):
    if not EMAIL_USER or not EMAIL_PASS:
        print("Erro: Credenciais de e-mail não configuradas")
        return False
    try:
        msg = MIMEMultipart()
        msg['From'] = f"Rank&Hub <{EMAIL_USER}>"
        msg['To'] = destinatario
        msg['Subject'] = f"⚔️ Você foi convocado para a Arena: {nome_ranking}!"
        corpo_html = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: 
            <div style="text-align: center; margin-bottom: 30px;">
                <span style="font-size: 40px;">🏆</span>
                <h1 style="color: 
            </div>
            <p style="font-size: 18px; line-height: 1.6;">Olá!</p>
            <p style="font-size: 16px; line-height: 1.6; color: 
                Você acaba de ser convidado por <strong>{nome_admin}</strong> para participar da arena <strong>"{nome_ranking}"</strong>!
            </p>
            <div style="background: 
                <p style="margin: 0; font-weight: bold; color: 
                <p style="margin: 10px 0 0 0; color: 
                    É simples! Basta criar sua conta usando este e-mail ({destinatario}) e você já entrará automaticamente na disputa.
                </p>
            </div>
            <div style="text-align: center; margin-top: 40px;">
                <a href="http://localhost:3000/register" style="display: inline-block; background: 
            </div>
            <p style="margin-top: 40px; color: 
                Prepare-se para subir no ranking e dominar o Hub.<br>
                © 2026 Rank&Hub. Onde a evolução nunca para.
            </p>
        </div>
        """
        msg.attach(MIMEText(corpo_html, 'html'))
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Erro ao enviar convite: {e}")
        return False

@app.route('/api/users', methods=['GET'])
def list_all_users():
    conn = get_db_connection()
    users = db_execute(conn, 'SELECT * FROM hub_usuarios').fetchall()
    conn.close()
    return jsonify([dict(u) for u in users]), 200
@app.route('/api/user', methods=['GET'])
def get_user():
    conn = get_db_connection()
    user = db_execute(conn, 'SELECT id, nome, email, telefone, foto_perfil as foto_url FROM hub_usuarios LIMIT 1').fetchone()
    conn.close()
    if user:
        return jsonify(dict(user)), 200
    return jsonify({'error': 'Nenhum usuário encontrado'}), 404
@app.route('/api/user', methods=['PATCH'])
def update_user():
    data = request.json
    conn = get_db_connection()
    user = db_execute(conn, 'SELECT * FROM hub_usuarios LIMIT 1').fetchone()
    if not user:
        conn.close()
        return jsonify({'error': 'Usuário não encontrado'}), 404
    senha_atual_enviada = data.get('senha_atual')
    if not senha_atual_enviada or senha_atual_enviada != user['senha']:
        conn.close()
        return jsonify({'error': 'Senha atual incorreta'}), 401
    db_execute(conn, """
        UPDATE hub_usuarios 
        SET nome = ?, email = ?, telefone = ?, senha = ?
        WHERE id = ?
    """, (
        data.get('nome', user['nome']),
        data.get('email', user['email']),
        data.get('telefone', user['telefone']),
        data.get('nova_senha', user['senha']) if data.get('nova_senha') else user['senha'],
        user['id']
    ))
    conn.commit()
    updated_user = db_execute(conn, 'SELECT * FROM hub_usuarios WHERE id = ?', (user['id'],)).fetchone()
    conn.close()
    u_dict = dict(updated_user)
    u_dict['foto_url'] = u_dict['foto_perfil']
    return jsonify(u_dict), 200
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    senha = data.get('senha')
    conn = get_db_connection()
    user = db_execute(conn, 'SELECT * FROM hub_usuarios WHERE email = ? AND senha = ?', (email, senha)).fetchone()
    conn.close()
    if user:
        u_dict = dict(user)
        u_dict['foto_url'] = u_dict['foto_perfil'] 
        return jsonify({
            'status': 'success',
            'user': u_dict
        }), 200
    return jsonify({'error': 'E-mail ou senha incorretos'}), 401
@app.route('/api/register', methods=['POST'])
def register():
    conn = get_db_connection()
    try:
        data = request.json
        nome = data.get('nome')
        email = data.get('email')
        senha = data.get('senha')
        
        if not email or not nome or not senha:
            return jsonify({'error': 'Todos os campos são obrigatórios'}), 400

        user_exists = db_execute(conn, 'SELECT id FROM hub_usuarios WHERE email = ?', (email,)).fetchone()
        if user_exists:
            return jsonify({'error': 'Este e-mail já está cadastrado'}), 400
            
        foto_perfil = f"https://api.dicebear.com/7.x/avataaars/svg?seed={nome}"
        usuario_id = db_insert(conn, """
            INSERT INTO hub_usuarios (nome, email, senha, foto_perfil)
            VALUES (?, ?, ?, ?)
        """, (nome, email, senha, foto_perfil))

        convites = db_execute(conn, "SELECT ranking_id FROM hub_convites_pendentes WHERE email = ?", (email,)).fetchall()
        for convite in convites:
            try:
                db_execute(conn, "INSERT INTO hub_membros (ranking_id, usuario_id) VALUES (?, ?)", (convite['ranking_id'], usuario_id))
            except Exception: pass 
            
        db_execute(conn, "DELETE FROM hub_convites_pendentes WHERE email = ?", (email,))
        conn.commit()
        
        try:
            send_welcome_email(email, nome)
        except Exception: pass

        return jsonify({'message': 'Usuário cadastrado com sucesso!', 'user_id': usuario_id}), 201
    except Exception as e:
        return jsonify({'error': f'Erro no Servidor: {str(e)}'}), 500
    finally:
        conn.close()
@app.route('/api/user/avatar', methods=['POST'])
def upload_avatar():
    if 'foto' not in request.files:
        return jsonify({'error': 'Nenhuma foto enviada'}), 400
    file = request.files['foto']
    if file.filename == '':
        return jsonify({'error': 'Nome de arquivo vazio'}), 400
    filename = f"avatar_user_{os.urandom(4).hex()}.png"
    filepath = os.path.join('static', 'avatars', filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    file.save(filepath)
    foto_url = f"http://127.0.0.1:5000/static/avatars/{filename}"
    conn = get_db_connection()
    db_execute(conn, "UPDATE hub_usuarios SET foto_perfil = ? WHERE id = (SELECT id FROM hub_usuarios LIMIT 1)", (foto_url,))
    conn.commit()
    conn.close()
    return jsonify({'foto_url': foto_url, 'foto_perfil': foto_url}), 200
@app.route('/api/rankings/<int:ranking_id>/upload-icon', methods=['POST'])
def upload_ranking_icon(ranking_id):
    file = request.files.get('file') or request.files.get('foto')
    if not file:
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400
    if file.filename == '':
        return jsonify({'error': 'Arquivo sem nome'}), 400
    filename = f"icon_ranking_{ranking_id}_{os.urandom(2).hex()}.png"
    filepath = os.path.join('static', 'icons', filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    file.save(filepath)
    foto_url = f"http://127.0.0.1:5000/static/icons/{filename}"
    conn = get_db_connection()
    db_execute(conn, "UPDATE hub_rankings SET foto_url = ?, emoji = NULL WHERE id = ?", (foto_url, ranking_id))
    conn.commit()
    conn.close()
    return jsonify({'url': foto_url}), 200
@app.route('/api/rankings', methods=['GET'])
def get_rankings():
    usuario_id = request.args.get('usuario_id')
    conn = get_db_connection()
    if usuario_id:
        try:
            rankings = db_execute(conn, """
                SELECT r.*, m.favorito 
                FROM hub_rankings r
                JOIN hub_membros m ON r.id = m.ranking_id
                WHERE m.usuario_id = ?
                ORDER BY m.favorito DESC, r.criado_em DESC
            """, (usuario_id,)).fetchall()
        except Exception:
            rankings = db_execute(conn, """
                SELECT r.*, 0 as favorito 
                FROM hub_rankings r
                JOIN hub_membros m ON r.id = m.ranking_id
                WHERE m.usuario_id = ?
                ORDER BY r.criado_em DESC
            """, (usuario_id,)).fetchall()
    else:
        rankings = db_execute(conn, 'SELECT *, 0 as favorito FROM hub_rankings').fetchall()
    conn.close()
    return jsonify([dict(r) for r in rankings]), 200
def check_and_reset_ranking(ranking_id):
    conn = get_db_connection()
    ranking = db_execute(conn, 'SELECT * FROM hub_rankings WHERE id = ?', (ranking_id,)).fetchone()
    if not ranking or ranking['ciclo_reset'] == 'nunca':
        conn.close()
        return
    agora = datetime.now()
    deve_zerar = False
    ultimo_reset_str = ranking['ultimo_reset']
    if ranking['ciclo_reset'] == 'semanal' and agora.weekday() == 0:
        if not ultimo_reset_str or datetime.fromisoformat(ultimo_reset_str).date() < agora.date():
            deve_zerar = True
    if deve_zerar:
        cursor = conn.cursor()
        vencedor = db_execute(conn, """
            SELECT usuario_id, SUM(pontos_recebidos) as total
            FROM hub_logs_atividades
            WHERE ranking_id = ?
            GROUP BY usuario_id
            ORDER BY total DESC
            LIMIT 1
        """, (ranking_id,)).fetchone()
        if vencedor and vencedor['total'] > 0:
            db_execute(conn, """
                INSERT INTO hub_vencedores (ranking_id, usuario_id, pontos_finais, premio_ganho)
                VALUES (?, ?, ?, ?)
            """, (ranking_id, vencedor['usuario_id'], vencedor['total'], ranking['premio_atual']))
        db_execute(conn, "DELETE FROM hub_logs_atividades WHERE ranking_id = ?",(ranking_id,))
        db_execute(conn, "UPDATE hub_rankings SET ultimo_reset = ? WHERE id = ?", (agora.isoformat(), ranking_id))
        conn.commit()
    conn.close()
@app.route('/api/rankings/<int:ranking_id>', methods=['GET', 'DELETE', 'PATCH'])
def get_ranking_by_id(ranking_id):
    if request.method == 'PATCH':
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        nome = data.get('nome')
        descricao = data.get('descricao')
        ciclo_reset = data.get('ciclo_reset')
        premio_atual = data.get('premio_atual')
        emoji = data.get('emoji')
        foto_url = data.get('foto_url')
        cor_tema_hex = data.get('cor_tema_hex')
        nome_membros = data.get('nome_membros')
        titulo_membros = data.get('titulo_membros')
        cargo_owner = data.get('cargo_owner')
        cargo_admin = data.get('cargo_admin')
        cargo_membro = data.get('cargo_membro')
        updates = []
        params = []
        if nome: updates.append("nome = ?"); params.append(nome)
        if descricao is not None: updates.append("descricao = ?"); params.append(descricao)
        if ciclo_reset: updates.append("ciclo_reset = ?"); params.append(ciclo_reset)
        if premio_atual is not None: updates.append("premio_atual = ?"); params.append(premio_atual)
        if emoji is not None: updates.append("emoji = ?"); params.append(emoji)
        if foto_url is not None: updates.append("foto_url = ?"); params.append(foto_url)
        if cor_tema_hex: updates.append("cor_tema_hex = ?"); params.append(cor_tema_hex)
        if nome_membros: updates.append("nome_membros = ?"); params.append(nome_membros)
        if titulo_membros: updates.append("titulo_membros = ?"); params.append(titulo_membros)
        if cargo_owner: updates.append("cargo_owner = ?"); params.append(cargo_owner)
        if cargo_admin: updates.append("cargo_admin = ?"); params.append(cargo_admin)
        if cargo_membro: updates.append("cargo_membro = ?"); params.append(cargo_membro)
        if updates:
            params.append(ranking_id)
            db_execute(conn, f"UPDATE hub_rankings SET {', '.join(updates)} WHERE id = ?", params)
            conn.commit()
        conn.close()
        return jsonify({"status": "success", "message": "Ranking atualizado"}), 200
    if request.method == 'DELETE':
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            db_execute(conn, "DELETE FROM hub_logs_atividades WHERE ranking_id = ?", (ranking_id,))
            db_execute(conn, "DELETE FROM hub_membros WHERE ranking_id = ?", (ranking_id,))
            db_execute(conn, "DELETE FROM regras_pontuacao WHERE ranking_id = ?", (ranking_id,))
            db_execute(conn, "DELETE FROM hub_rankings WHERE id = ?", (ranking_id,))
            conn.commit()
            conn.close()
            return jsonify({"message": "Ranking excluído"}), 200
        except Exception as e:
            conn.close()
            return jsonify({"error": str(e)}), 500
    check_and_reset_ranking(ranking_id)
    conn = get_db_connection()
    ranking = db_execute(conn, 'SELECT * FROM hub_rankings WHERE id = ?', (ranking_id,)).fetchone()
    conn.close()
    if ranking:
        return jsonify(dict(ranking)), 200
    return jsonify({'error': 'Ranking não encontrado'}), 404
@app.route('/api/rankings/<int:ranking_id>/favorite', methods=['POST'])
def toggle_favorite(ranking_id):
    conn = get_db_connection()
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Payload JSON ausente"}), 400
        usuario_id = data.get('usuario_id')
        if not usuario_id:
            return jsonify({"error": "Usuário não identificado"}), 400
        usuario_id = int(usuario_id)
        ranking_id = int(ranking_id)
        try:
            db_execute(conn, "SELECT favorito FROM hub_membros LIMIT 1")
        except Exception:
            print(">>> MIGRACAO: Adicionando coluna 'favorito' em hub_membros")
            db_execute(conn, "ALTER TABLE hub_membros ADD COLUMN favorito INTEGER DEFAULT 0")
            conn.commit()
        membro = db_execute(conn, "SELECT * FROM hub_membros WHERE ranking_id = ? AND usuario_id = ?", (ranking_id, usuario_id)).fetchone()
        if not membro:
            db_execute(conn, "INSERT INTO hub_membros (ranking_id, usuario_id, permissao, favorito) VALUES (?, ?, 'membro', 1)", (ranking_id, usuario_id))
        else:
            db_execute(conn, """
                UPDATE hub_membros 
                SET favorito = CASE WHEN favorito = 1 THEN 0 ELSE 1 END 
                WHERE ranking_id = ? AND usuario_id = ?
            """, (ranking_id, usuario_id))
        conn.commit()
        new_status = db_execute(conn, "SELECT favorito FROM hub_membros WHERE ranking_id = ? AND usuario_id = ?", (ranking_id, usuario_id)).fetchone()
        is_fav = bool(new_status['favorito']) if new_status else False
        return jsonify({"status": "success", "favorito": is_fav}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
@app.route('/api/rankings', methods=['POST'])
def create_ranking():
    data = request.json
    if not data or 'nome' not in data:
        return jsonify({'error': 'Dados incompletos'}), 400
    admin_id = data.get('admin_id', 1)
    conn = get_db_connection()
    try:
        ranking_id = db_insert(conn, """
            INSERT INTO hub_rankings (nome, descricao, cor_tema_hex, admin_id)
            VALUES (?, ?, ?, ?)
        """, (
            data['nome'],
            data.get('descricao', ''),
            data.get('cor_tema_hex', '#3b82f6'),
            admin_id
        ))
        db_execute(conn, """
            INSERT INTO hub_membros (ranking_id, usuario_id, permissao)
            VALUES (?, ?, 'admin')
        """, (ranking_id, admin_id))
        regras = data.get('regras', [])
        print(f"--- Processando {len(regras)} regras para o ranking {ranking_id}")
        for regra in regras:
            tipo = regra.get('tipo_atividade') or regra.get('atividade') or regra.get('nome') or 'Atividade Genérica'
            valor = regra.get('valor_ponto') or regra.get('pontos') or regra.get('valor') or 10
            condicao = regra.get('condicao_extra') or regra.get('descricao') or regra.get('condicao')
            db_execute(conn, """
                INSERT INTO regras_pontuacao (ranking_id, tipo_atividade, valor_ponto, condicao_extra)
                VALUES (?, ?, ?, ?)
            """, (ranking_id, tipo, valor, condicao))
            print(f"    [Regra Salva]: {tipo} = {valor} pts")
        conn.commit()
        return jsonify({"id": ranking_id, "nome": data['nome']}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
@app.route('/api/rankings/<int:ranking_id>/tasks', methods=['GET', 'POST'])
def handle_tasks(ranking_id):
    print(f">>> ACESSANDO TAREFAS DO RANKING: {ranking_id} (Método: {request.method})")
    conn = get_db_connection()
    try:
        db_execute(conn, """
            CREATE TABLE IF NOT EXISTS hub_tarefas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ranking_id INTEGER REFERENCES hub_rankings(id) ON DELETE CASCADE,
                nome TEXT NOT NULL,
                descricao TEXT,
                pontos INTEGER DEFAULT 10,
                recorrencia TEXT DEFAULT 'livre'
            )
        """)
        columns = [c['name'] for c in db_execute(conn, "PRAGMA table_info(hub_tarefas)").fetchall()]
        if 'pontos' not in columns:
            db_execute(conn, "ALTER TABLE hub_tarefas ADD COLUMN pontos INTEGER DEFAULT 10")
        if 'recorrencia' not in columns:
            db_execute(conn, "ALTER TABLE hub_tarefas ADD COLUMN recorrencia TEXT DEFAULT 'livre'")
        conn.commit()
        if request.method == 'POST':
            data = request.json
            usuario_id = data.get('usuario_id')
            if usuario_id:
                member = db_execute(conn, "SELECT permissao FROM hub_membros WHERE ranking_id = ? AND usuario_id = ?", (ranking_id, usuario_id)).fetchone()
                if not member or member['permissao'] not in ['owner', 'admin']:
                    return jsonify({'error': 'Acesso negado: Somente o Fundador ou Admins podem criar tarefas.'}), 403
            print(f"--- Criando tarefa: {data.get('nome')} para Ranking: {ranking_id}")
            db_execute(conn, """
                INSERT INTO hub_tarefas (ranking_id, nome, descricao, pontos, recorrencia)
                VALUES (?, ?, ?, ?, ?)
            """, (ranking_id, data['nome'], data.get('descricao'), data.get('pontos', 10), data.get('recorrencia', 'livre')))
            conn.commit()
            return jsonify({'status': 'success'}), 201
        cur = db_execute(conn, "SELECT * FROM hub_tarefas WHERE ranking_id = ?", (ranking_id,))
        tasks = cur.fetchall()
        print(f"--- Tarefas encontradas para ID {ranking_id}: {len(tasks)}")
        return jsonify([dict(t) for t in tasks]), 200
    except Exception as e:
        print(f"!!! ERRO CRÍTICO EM TASKS: {e}")
        return jsonify([]), 200
    finally:
        conn.close()
@app.route('/api/rankings/<int:ranking_id>/role', methods=['GET'])
def get_user_role(ranking_id):
    usuario_id = request.args.get('usuario_id')
    if not usuario_id:
        return jsonify({'role': 'Convidado'}), 200
    conn = get_db_connection()
    rank = db_execute(conn, "SELECT admin_id FROM hub_rankings WHERE id = ?", (ranking_id,)).fetchone()
    if rank and str(rank['admin_id']) == str(usuario_id):
        conn.close()
        return jsonify({'role': 'Fundador'}), 200
    member = db_execute(conn, "SELECT permissao FROM hub_membros WHERE ranking_id = ? AND usuario_id = ?", (ranking_id, usuario_id)).fetchone()
    conn.close()
    if member:
        if member['permissao'] == 'admin':
            return jsonify({'role': 'Admin Promovido'}), 200
        return jsonify({'role': 'Membro'}), 200
    return jsonify({'role': 'Membro'}), 200
@app.route('/api/rankings/<int:ranking_id>/register', methods=['POST'])
def register_points(ranking_id):
    data = request.json
    usuario_id = data.get('usuario_id')
    tarefa_id = data.get('tarefa_id')
    conn = get_db_connection()
    try:
        tarefa = db_execute(conn, "SELECT * FROM hub_tarefas WHERE id = ?", (tarefa_id,)).fetchone()
        if not tarefa:
            return jsonify({"error": "Tarefa não encontrada"}), 404
        recorrencia = tarefa['recorrencia']
        if recorrencia != 'livre':
            query = "SELECT data FROM hub_historico WHERE usuario_id = ? AND tarefa_id = ? ORDER BY data DESC LIMIT 1"
            ultimo_registro = db_execute(conn, query, (usuario_id, tarefa_id)).fetchone()
            if ultimo_registro:
                from datetime import datetime, timedelta
                data_ultimo = datetime.fromisoformat(ultimo_registro['data'])
                agora = datetime.now()
                if recorrencia == 'diaria' and data_ultimo.date() == agora.date():
                    return jsonify({"error": "Esta tarefa só pode ser feita uma vez por dia."}), 400
                if recorrencia == 'unica':
                    return jsonify({"error": "Esta tarefa só pode ser feita uma única vez."}), 400
                if recorrencia == 'semanal':
                    if agora - data_ultimo < timedelta(days=7):
                        return jsonify({"error": "Esta tarefa só pode ser feita uma vez por semana."}), 400
        db_execute(conn, """
            INSERT INTO hub_historico (ranking_id, usuario_id, tarefa_id, pontos)
            VALUES (?, ?, ?, ?)
        """, (ranking_id, usuario_id, tarefa_id, tarefa['pontos']))
        db_execute(conn, """
            UPDATE hub_membros 
            SET pontos = pontos + ? 
            WHERE ranking_id = ? AND usuario_id = ?
        """, (tarefa['pontos'], ranking_id, usuario_id))
        conn.commit()
        return jsonify({"status": "success", "pontos_ganhos": tarefa['pontos']}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
@app.route('/api/rankings/<int:ranking_id>/logs', methods=['GET'])
def get_ranking_logs(ranking_id):
    conn = get_db_connection()
    logs = db_execute(conn, """
        SELECT l.*, COALESCE(NULLIF(m.apelido, ''), u.nome) as usuario 
        FROM hub_logs_atividades l
        JOIN hub_usuarios u ON l.usuario_id = u.id
        LEFT JOIN hub_membros m ON l.usuario_id = m.usuario_id AND l.ranking_id = m.ranking_id
        WHERE l.ranking_id = ?
        ORDER BY l.criado_em DESC
    """, (ranking_id,)).fetchall()
    conn.close()
    return jsonify([dict(l) for l in logs]), 200
@app.route('/api/rankings/<int:ranking_id>/members', methods=['GET', 'POST'])
def handle_members(ranking_id):
    conn = get_db_connection()
    if request.method == 'POST':
        data = request.json
        email = data.get('email')
        ranking = db_execute(conn, "SELECT nome, admin_id FROM hub_rankings WHERE id = ?", (ranking_id,)).fetchone()
        admin = db_execute(conn, "SELECT nome FROM hub_usuarios WHERE id = ?", (ranking['admin_id'],)).fetchone()
        try:
            user = db_execute(conn, "SELECT id FROM hub_usuarios WHERE email = ?", (email,)).fetchone()
            if user:
                is_member = db_execute(conn, "SELECT 1 FROM hub_membros WHERE ranking_id = ? AND usuario_id = ?", (ranking_id, user['id'])).fetchone()
                if is_member:
                    return jsonify({'error': 'Este usuário já é membro desta arena'}), 400
            db_execute(conn, "INSERT INTO hub_convites_pendentes (email, ranking_id) VALUES (?, ?)", (email, ranking_id))
            conn.commit()
            send_invitation_email(email, ranking['nome'], admin['nome'])
            return jsonify({'message': 'Convite enviado com sucesso!'}), 201
        except sqlite3.IntegrityError:
            return jsonify({'error': 'Já existe um convite pendente para este e-mail'}), 400
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    members = db_execute(conn, """
        SELECT u.id, u.nome, u.email, u.foto_perfil as foto_url, m.permissao as role, m.apelido, m.pontos
        FROM hub_membros m
        JOIN hub_usuarios u ON m.usuario_id = u.id
        WHERE m.ranking_id = ?
    """, (ranking_id,)).fetchall()
    conn.close()
    return jsonify([dict(m) for m in members]), 200
@app.route('/api/user/<int:user_id>/invites', methods=['GET'])
def get_user_invites(user_id):
    conn = get_db_connection()
    user = db_execute(conn, "SELECT email FROM hub_usuarios WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        return jsonify([]), 200
    invites = db_execute(conn, """
        SELECT c.id, r.nome as ranking_nome, r.emoji, r.foto_url, u.nome as admin_nome
        FROM hub_convites_pendentes c
        JOIN hub_rankings r ON c.ranking_id = r.id
        JOIN hub_usuarios u ON r.admin_id = u.id
        WHERE c.email = ?
    """, (user['email'],)).fetchall()
    conn.close()
    return jsonify([dict(i) for i in invites]), 200
@app.route('/api/invites/<int:invite_id>/accept', methods=['POST'])
def accept_invite(invite_id):
    data = request.json
    usuario_id = data.get('usuario_id')
    conn = get_db_connection()
    try:
        invite = db_execute(conn, "SELECT ranking_id, email FROM hub_convites_pendentes WHERE id = ?", (invite_id,)).fetchone()
        if not invite:
            return jsonify({'error': 'Convite expirado ou não encontrado'}), 404
        db_execute(conn, "INSERT INTO hub_membros (ranking_id, usuario_id) VALUES (?, ?)", (invite['ranking_id'], usuario_id))
        db_execute(conn, "DELETE FROM hub_convites_pendentes WHERE id = ?", (invite_id,))
        conn.commit()
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
@app.route('/api/invites/<int:invite_id>/refuse', methods=['POST'])
def refuse_invite(invite_id):
    conn = get_db_connection()
    try:
        db_execute(conn, "DELETE FROM hub_convites_pendentes WHERE id = ?", (invite_id,))
        conn.commit()
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
@app.route('/api/rankings/<int:ranking_id>/members/<int:usuario_id>', methods=['PATCH'])
def update_member_data(ranking_id, usuario_id):
    data = request.json
    apelido = data.get('apelido')
    role = data.get('role')
    conn = get_db_connection()
    try:
        if apelido is not None:
            db_execute(conn, "UPDATE hub_membros SET apelido = ? WHERE ranking_id = ? AND usuario_id = ?", (apelido, ranking_id, usuario_id))
        if role is not None:
            db_execute(conn, "UPDATE hub_membros SET permissao = ? WHERE ranking_id = ? AND usuario_id = ?", (role, ranking_id, usuario_id))
        conn.commit()
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
@app.route('/api/rankings/<int:ranking_id>/patents', methods=['GET', 'POST'])
def handle_patents(ranking_id):
    conn = get_db_connection()
    if request.method == 'POST':
        data = request.json
        try:
            db_execute(conn, """
                INSERT INTO hub_patentes (ranking_id, nome, pontos_minimos, cor_hex)
                VALUES (?, ?, ?, ?)
            """, (ranking_id, data['nome'], data['pontos_minimos'], data.get('cor_hex', '#3b82f6')))
            conn.commit()
            return jsonify({'status': 'success'}), 201
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        finally:
            conn.close()
    patents = db_execute(conn, "SELECT * FROM hub_patentes WHERE ranking_id = ? ORDER BY pontos_minimos ASC", (ranking_id,)).fetchall()
    conn.close()
    return jsonify([dict(p) for p in patents]), 200
@app.route('/api/patents/<int:patent_id>', methods=['DELETE'])
def delete_patent(patent_id):
    conn = get_db_connection()
    try:
        db_execute(conn, "DELETE FROM hub_patentes WHERE id = ?", (patent_id,))
        conn.commit()
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
@app.route('/api/rankings/<int:ranking_id>/rules', methods=['GET'])
def get_rules(ranking_id):
    conn = get_db_connection()
    rules = db_execute(conn, "SELECT * FROM regras_pontuacao WHERE ranking_id = ?", (ranking_id,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rules]), 200
@app.route('/api/rules/<int:rule_id>', methods=['DELETE'])
def delete_rule(rule_id):
    conn = get_db_connection()
    try:
        db_execute(conn, "DELETE FROM regras_pontuacao WHERE id = ?", (rule_id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Regra excluída com sucesso"}), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500
@app.route('/api/rankings/<int:ranking_id>/activities', methods=['POST'])
def log_activity(ranking_id):
    data = request.json
    usuario_id = data.get('usuario_id')
    regra_id = data.get('regra_id')
    conn = get_db_connection()
    try:
        regra = db_execute(conn, "SELECT * FROM regras_pontuacao WHERE id = ?", (regra_id,)).fetchone()
        if not regra:
            return jsonify({'error': 'Regra não encontrada'}), 404
        db_execute(conn, """
            INSERT INTO hub_logs_atividades (usuario_id, ranking_id, regra_id, pontos_recebidos, descricao)
            VALUES (?, ?, ?, ?, ?)
        """, (usuario_id, ranking_id, regra_id, regra['valor_ponto'], regra['tipo_atividade']))
        conn.commit()
        return jsonify({'message': 'Atividade registrada!', 'pontos': regra['valor_ponto']}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
@app.route('/api/rankings/<int:ranking_id>/members/<int:usuario_id>', methods=['DELETE'])
def remove_member(ranking_id, usuario_id):
    requester_id = request.args.get('requester_id')
    if not requester_id:
        return jsonify({'error': 'ID do solicitante necessário'}), 400
    conn = get_db_connection()
    requester = db_execute(conn, "SELECT permissao FROM hub_membros WHERE ranking_id = ? AND usuario_id = ?", (ranking_id, requester_id)).fetchone()
    rank_info = db_execute(conn, "SELECT admin_id FROM hub_rankings WHERE id = ?", (ranking_id,)).fetchone()
    is_founder = str(rank_info['admin_id']) == str(requester_id)
    target = db_execute(conn, "SELECT permissao FROM hub_membros WHERE ranking_id = ? AND usuario_id = ?", (ranking_id, usuario_id)).fetchone()
    if not target:
        conn.close()
        return jsonify({'error': 'Membro não encontrado'}), 404
    if str(requester_id) == str(usuario_id):
        if is_founder:
            conn.close()
            return jsonify({'error': 'O Fundador não pode sair. Exclua o ranking se desejar encerrar.'}), 403
        db_execute(conn, "DELETE FROM hub_membros WHERE ranking_id = ? AND usuario_id = ?", (ranking_id, usuario_id))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Você saiu do ranking'}), 200
    if is_founder:
        db_execute(conn, "DELETE FROM hub_membros WHERE ranking_id = ? AND usuario_id = ?", (ranking_id, usuario_id))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Membro removido pelo Fundador'}), 200
    if requester and requester['permissao'] == 'admin':
        if target['permissao'] == 'Membro':
            db_execute(conn, "DELETE FROM hub_membros WHERE ranking_id = ? AND usuario_id = ?", (ranking_id, usuario_id))
            conn.commit()
            conn.close()
            return jsonify({'message': 'Membro removido pelo Administrador'}), 200
        else:
            conn.close()
            return jsonify({'error': 'Admins só podem remover membros comuns.'}), 403
    conn.close()
    return jsonify({'error': 'Você não tem permissão para esta ação.'}), 403
@app.route('/api/rankings/<int:ranking_id>/leaderboard', methods=['GET'])
def get_leaderboard(ranking_id):
    conn = get_db_connection()
    try:
        members = db_execute(conn, """
            SELECT 
                u.id, 
                COALESCE(NULLIF(m.apelido, ''), u.nome) as nome_personalizado, 
                COALESCE(NULLIF(m.permissao, ''), 'Membro') as cargo_personalizado, 
                m.pontos, 
                u.foto_perfil,
                u.foto_perfil as foto_url
            FROM hub_membros m
            JOIN hub_usuarios u ON m.usuario_id = u.id
            WHERE m.ranking_id = ?
            ORDER BY m.pontos DESC
        """, (ranking_id,)).fetchall()
        return jsonify([dict(m) for m in members]), 200
    except Exception as e:
        print(f"Erro no leaderboard: {e}")
        return jsonify([]), 200
    finally:
        conn.close()
@app.route('/api/rankings/<int:ranking_id>/winners', methods=['GET'])
def get_winners(ranking_id):
    conn = get_db_connection()
    winners = db_execute(conn, """
        SELECT v.*, u.nome, u.foto_perfil as foto_url
        FROM hub_vencedores v
        JOIN hub_usuarios u ON v.usuario_id = u.id
        WHERE v.ranking_id = ?
        ORDER BY v.data_vitoria DESC
    """, (ranking_id,)).fetchall()
    conn.close()
    return jsonify([dict(w) for w in winners]), 200
@app.route('/api/generate-rules', methods=['POST'])
def generate_rules():
    data = request.json
    if not data:
        return jsonify({'error': 'JSON payload is missing.'}), 400
    prompt_usuario = data.get('prompt', '')
    if not prompt_usuario:
        return jsonify({'error': 'O campo prompt é obrigatório.'}), 400
    try:
        if not client:
             return jsonify({'error': 'A chave da API do Gemini não está configurada ou cliente não inicializado.'}), 500
        system_prompt = """
        Você é o Assistente de IA do Rank&Hub, uma inteligência de elite que gerencia rankings.
        Sua tarefa é interpretar o desejo do usuário e transformá-lo em AÇÕES estruturadas.
        Você pode realizar 3 tipos de ações:
        1. "ALTERAR": Para mudar configurações do ranking. 
           Campos aceitos: nome, descricao, cor_tema_hex, nome_membros (ex: 'Alunos'), titulo_membros (ex: 'Mural de Honra'), cargo_owner (ex: 'Mestre'), cargo_admin, cargo_membro.
        2. "REGRA": Para adicionar novas regras de pontuação (tarefas).
        3. "CONVIDAR": Para convidar novos membros por e-mail.
        Você DEVE retornar ESTRITAMENTE um JSON no formato:
        {
            "resumo": "Breve explicação das mudanças sociais e técnicas (ex: Vou transformar os membros em Samurais e mudar o título)",
            "acoes": [
                { "tipo": "ALTERAR", "dados": { "nome_membros": "Samurais", "cargo_owner": "Shogun", "titulo_membros": "Dojo de Elite" } },
                { "tipo": "REGRA", "dados": { "tipo_atividade": "Treino", "valor_ponto": 10, "condicao_extra": "null" } },
                { "tipo": "CONVIDAR", "dados": { "email": "aluno@dojo.com" } }
            ]
        }
        Regras de Ouro:
        - Se o usuário falar sobre "como chamar os membros" ou "mudar cargos", use a ação ALTERAR.
        - Se o usuário pedir para mudar o título da aba/página de membros, use 'titulo_membros'.
        - Retorne apenas o JSON, sem explicações extras.
        """
        full_prompt = f"{system_prompt}\n\nEntrada do usuário:\n{prompt_usuario}"
        response = client.models.generate_content(
            model='gemini-2.5-flash-lite',
            contents=full_prompt
        )
        result_text = response.text.strip()
        if result_text.startswith("```json"):
            result_text = result_text[7:]
        elif result_text.startswith("```"):
            result_text = result_text[3:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]
        json_result = json.loads(result_text.strip())
        return jsonify(json_result), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

_db_initialized = False

@app.before_request
def auto_init_db():
    if request.path in ['/health', '/api/health', '/_/backend/health', '/_/backend/api/health']:
        return
    global _db_initialized
    if not _db_initialized:
        try:
            init_db()
            _db_initialized = True
        except Exception as e:
            print(f"Erro na inicialização automática: {e}")

if __name__ == '__main__':
    app.run(debug=True, port=5000)
