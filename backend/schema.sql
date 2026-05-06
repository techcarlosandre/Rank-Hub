CREATE TABLE hub_usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL, -- Novo
    telefone VARCHAR(50),        -- Novo
    foto_perfil TEXT,            -- Novo
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hub_rankings (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,              -- Novo
    admin_id INTEGER REFERENCES hub_usuarios(id) ON DELETE CASCADE,
    cor_tema_hex VARCHAR(7) DEFAULT '#18181b', -- Updated to dark theme default
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de ligação para o Hub (Quem participa de qual ranking)
CREATE TABLE hub_membros (
    id SERIAL PRIMARY KEY,
    ranking_id INTEGER REFERENCES hub_rankings(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES hub_usuarios(id) ON DELETE CASCADE,
    permissao VARCHAR(50) DEFAULT 'membro', -- 'admin', 'membro'
    entrou_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ranking_id, usuario_id)
);

CREATE TABLE regras_pontuacao (
    id SERIAL PRIMARY KEY,
    ranking_id INTEGER REFERENCES hub_rankings(id) ON DELETE CASCADE,
    tipo_atividade VARCHAR(255) NOT NULL,
    valor_ponto INTEGER NOT NULL,
    condicao_extra VARCHAR(255),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hub_logs_atividades (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES hub_usuarios(id) ON DELETE CASCADE,
    ranking_id INTEGER REFERENCES hub_rankings(id) ON DELETE CASCADE,
    regra_id INTEGER REFERENCES regras_pontuacao(id) ON DELETE SET NULL,
    pontos_recebidos INTEGER NOT NULL,
    descricao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
