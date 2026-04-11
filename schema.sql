-- ============================================
-- MERCADO ERP - Schema do Banco de Dados
-- Supabase / PostgreSQL
-- ============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- FORNECEDORES
-- ============================================
CREATE TABLE fornecedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    inscricao_estadual VARCHAR(20),
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT,
    cidade VARCHAR(100),
    uf VARCHAR(2),
    cep VARCHAR(10),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PRODUTOS
-- ============================================
CREATE TABLE produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    codigo_barras VARCHAR(14),
    ean VARCHAR(14),
    ncm VARCHAR(10),
    unidade VARCHAR(10) DEFAULT 'UN',
    preco_custo DECIMAL(10, 2) DEFAULT 0,
    preco_venda DECIMAL(10, 2) DEFAULT 0,
    margem_lucro DECIMAL(5, 2) DEFAULT 0,
    estoque_atual DECIMAL(10, 3) DEFAULT 0,
    estoque_minimo DECIMAL(10, 3) DEFAULT 0,
    fornecedor_id UUID REFERENCES fornecedores(id),
    categoria VARCHAR(100),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_produtos_ean ON produtos(ean);
CREATE INDEX idx_produtos_codigo_barras ON produtos(codigo_barras);
CREATE INDEX idx_produtos_nome ON produtos(nome);

-- ============================================
-- ENTRADAS DE NF-e
-- ============================================
CREATE TABLE entradas_nfe (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_nfe VARCHAR(20) NOT NULL,
    serie VARCHAR(5),
    chave_acesso VARCHAR(44) UNIQUE,
    fornecedor_id UUID REFERENCES fornecedores(id),
    data_emissao DATE,
    data_entrada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valor_total DECIMAL(12, 2) DEFAULT 0,
    valor_icms DECIMAL(12, 2) DEFAULT 0,
    valor_ipi DECIMAL(12, 2) DEFAULT 0,
    xml_url TEXT,
    status VARCHAR(20) DEFAULT 'pendente',
    processado_por VARCHAR(100),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ITENS DA NF-e (de-para com produtos)
-- ============================================
CREATE TABLE itens_nfe (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entrada_nfe_id UUID REFERENCES entradas_nfe(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES produtos(id),
    nome_xml VARCHAR(255) NOT NULL,
    codigo_xml VARCHAR(60),
    ean_xml VARCHAR(14),
    ncm_xml VARCHAR(10),
    quantidade DECIMAL(10, 3) NOT NULL,
    unidade_xml VARCHAR(10),
    valor_unitario DECIMAL(10, 4),
    valor_total DECIMAL(12, 2),
    mapeamento_status VARCHAR(20) DEFAULT 'pendente',
    confianca_ia DECIMAL(5, 2),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_itens_nfe_entrada ON itens_nfe(entrada_nfe_id);

-- ============================================
-- MAPEAMENTO DE PRODUTOS (De-Para IA)
-- ============================================
CREATE TABLE mapeamento_produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_fornecedor VARCHAR(255) NOT NULL,
    codigo_fornecedor VARCHAR(60),
    fornecedor_id UUID REFERENCES fornecedores(id),
    produto_id UUID REFERENCES produtos(id),
    confianca DECIMAL(5, 2) DEFAULT 0,
    confirmado BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mapeamento_fornecedor ON mapeamento_produtos(nome_fornecedor, fornecedor_id);

-- ============================================
-- VENDAS
-- ============================================
CREATE TABLE vendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_venda SERIAL,
    data_venda TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valor_total DECIMAL(12, 2) DEFAULT 0,
    valor_desconto DECIMAL(12, 2) DEFAULT 0,
    valor_final DECIMAL(12, 2) DEFAULT 0,
    forma_pagamento VARCHAR(50),
    status VARCHAR(20) DEFAULT 'finalizada',
    observacoes TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ITENS DA VENDA
-- ============================================
CREATE TABLE itens_venda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venda_id UUID REFERENCES vendas(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES produtos(id),
    quantidade DECIMAL(10, 3) NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    desconto DECIMAL(10, 2) DEFAULT 0,
    subtotal DECIMAL(12, 2) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_itens_venda_venda ON itens_venda(venda_id);

-- ============================================
-- FUNCTION: Atualizar timestamp
-- ============================================
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de atualização automática
CREATE TRIGGER trg_produtos_atualizado BEFORE UPDATE ON produtos FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();
CREATE TRIGGER trg_fornecedores_atualizado BEFORE UPDATE ON fornecedores FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();
CREATE TRIGGER trg_entradas_nfe_atualizado BEFORE UPDATE ON entradas_nfe FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();
CREATE TRIGGER trg_mapeamento_atualizado BEFORE UPDATE ON mapeamento_produtos FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();
