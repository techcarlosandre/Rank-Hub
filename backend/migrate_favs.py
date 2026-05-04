import sqlite3

def migrate():
    conn = sqlite3.connect('rankhub.db')
    cursor = conn.cursor()
    
    # Verifica se a coluna favorito existe na tabela hub_membros
    try:
        cursor.execute("SELECT favorito FROM hub_membros LIMIT 1")
        print("Coluna 'favorito' já existe.")
    except sqlite3.OperationalError:
        print("Adicionando coluna 'favorito' em hub_membros...")
        cursor.execute("ALTER TABLE hub_membros ADD COLUMN favorito INTEGER DEFAULT 0")
        conn.commit()
        print("Coluna adicionada com sucesso!")

    conn.close()

if __name__ == "__main__":
    migrate()
