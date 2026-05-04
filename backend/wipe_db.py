import sqlite3
import os

def wipe_database():
    db_path = 'rankhub.db'
    if not os.path.exists(db_path):
        print(f"Erro: O arquivo {db_path} não foi encontrado.")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print(">>> Iniciando limpeza profunda do RankHub...")
        
        # Ordem correta para evitar erros de chave estrangeira
        tabelas = [
            "hub_logs_atividades",
            "hub_tarefas",
            "hub_membros",
            "hub_rankings",
            "hub_usuarios"
        ]

        for tabela in tabelas:
            try:
                cursor.execute(f"DELETE FROM {tabela}")
                print(f" [OK] Tabela '{tabela}' zerada.")
            except sqlite3.OperationalError as e:
                print(f" [!] Aviso na tabela '{tabela}': {e}")

        # Reinicia os contadores de ID
        cursor.execute("DELETE FROM sqlite_sequence")
        
        conn.commit()
        conn.close()
        print("\n>>> SUCESSO: O Banco de Dados está 100% limpo e pronto para produção! 🚀")

    except Exception as e:
        print(f"Erro crítico durante a limpeza: {e}")

if __name__ == "__main__":
    confirm = input("ATENÇÃO: Isso apagará TODOS os usuários e rankings. Tem certeza? (s/n): ")
    if confirm.lower() == 's':
        wipe_database()
    else:
        print("Operação cancelada.")
