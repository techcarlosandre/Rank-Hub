def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    schema_path = '../database/schema.sql'
    
    try:
        if os.path.exists(schema_path):
            with open(schema_path, 'r', encoding='utf-8') as f:
                schema_sql = f.read()
                # Ajustes para SQLite
                schema_sql = schema_sql.replace('SERIAL PRIMARY KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT')
                schema_sql = schema_sql.replace('TIMESTAMP DEFAULT CURRENT_TIMESTAMP', 'DATETIME DEFAULT CURRENT_TIMESTAMP')
                cursor.executescript(schema_sql)
                conn.commit()
                
        # Adiciona Rankings Iniciais se estiver vazio
        cursor.execute("SELECT count(*) FROM hub_rankings")
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                INSERT INTO hub_rankings (nome, descricao, cor_tema_hex, admin_id)
                VALUES 
                ('Code & Gym', 'Foco em programação e treinos físicos', '#FF4D00', 1),
                ('Leitura da Família', 'Ranking de livros lidos no mês', '#3b82f6', 1)
            """)
        
        # Migração: Adiciona coluna favorito se não existir
        try:
            cursor.execute("SELECT favorito FROM hub_membros LIMIT 1")
        except sqlite3.OperationalError:
            print(">>> MIGRACAO: Adicionando coluna 'favorito' em hub_membros")
            cursor.execute("ALTER TABLE hub_membros ADD COLUMN favorito INTEGER DEFAULT 0")
            
        conn.commit()
        print("Banco de Dados SQL inicializado/verificado.")
    except Exception as e:
        print(f"Aviso init_db: {e}")
    finally:
        conn.close()
