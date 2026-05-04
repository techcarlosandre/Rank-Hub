import sqlite3
import os

def init_db():
    db_path = 'rankhub.db'
    # Conecta (ou cria) o arquivo do banco
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Lê o arquivo schema.sql
    # Nota: Vou ajustar SERIAL para INTEGER PRIMARY KEY AUTOINCREMENT que é o padrão SQLite
    schema_path = '../database/schema.sql'
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema_sql = f.read()
        
    # Ajustes rápidos de PostgreSQL para SQLite
    schema_sql = schema_sql.replace('SERIAL PRIMARY KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT')
    schema_sql = schema_sql.replace('TIMESTAMP DEFAULT CURRENT_TIMESTAMP', 'DATETIME DEFAULT CURRENT_TIMESTAMP')
    
    try:
        cursor.executescript(schema_sql)
        print("Banco de Dados SQL inicializado com sucesso!")
        
        # Cria um usuário padrão se não existir
        cursor.execute("SELECT id FROM hub_usuarios WHERE email = ?", ('carlos@rankhub.com',))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO hub_usuarios (nome, email, senha, telefone, foto_perfil)
                VALUES (?, ?, ?, ?, ?)
            """, ("Carlos André", "carlos@rankhub.com", "123", "(11) 98888-7777", "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos"))
            conn.commit()
            print("Usuário padrão 'Carlos' adicionado ao SQL.")
            
    except Exception as e:
        print(f"Erro ao inicializar banco: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    init_db()
