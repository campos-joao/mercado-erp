# Mercado ERP — Sistema de Gestão de Mercado

Sistema de Gestão de Mercado (ERP de Varejo) com entrada automática de estoque via processamento de XML de NF-e, preparado para integração com IA.

## Stack Tecnológica

- **Framework:** Next.js 14+ (App Router)
- **UI/UX:** Shadcn UI, Tailwind CSS, Lucide React
- **Backend/Banco:** Supabase (Auth, PostgreSQL, Storage)
- **ORM:** Prisma
- **Validação:** Zod
- **IA (futuro):** OpenAI/Anthropic via Vercel AI SDK

## Como Rodar

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.local.example .env.local
# Editar .env.local com suas credenciais do Supabase

# Gerar cliente Prisma
npx prisma generate

# Rodar em desenvolvimento
npm run dev
```

## Estrutura de Pastas

```
src/
├── app/
│   ├── page.tsx                      # Dashboard (dados reais)
│   ├── layout.tsx                    # Layout com Sidebar + Toaster
│   ├── globals.css                   # Tema Shadcn (light/dark)
│   ├── produtos/page.tsx             # CRUD de Produtos
│   ├── nfe/page.tsx                  # Entrada de NF-e (upload XML + salvar)
│   ├── vendas/page.tsx               # Histórico de Vendas
│   ├── fornecedores/page.tsx         # CRUD de Fornecedores
│   ├── configuracoes/page.tsx        # Configurações (placeholder)
│   └── api/
│       ├── dashboard/route.ts        # GET stats do dashboard
│       ├── produtos/route.ts         # GET (busca) / POST
│       ├── produtos/[id]/route.ts    # GET / PUT / DELETE
│       ├── fornecedores/route.ts     # GET (busca) / POST
│       ├── fornecedores/[id]/route.ts# GET / PUT / DELETE
│       ├── vendas/route.ts           # GET / POST (com transação de estoque)
│       ├── nfe/route.ts              # GET / POST (importar XML + salvar)
│       └── nfe/[id]/confirmar/route.ts # POST (confirmar entrada)
├── components/
│   ├── ui/                           # Shadcn UI (Badge, Button, Card, Dialog, Input, Label, Select)
│   ├── sidebar.tsx                   # Sidebar de navegação
│   ├── produto-form-dialog.tsx       # Modal de cadastro/edição de produto
│   ├── fornecedor-form-dialog.tsx    # Modal de cadastro/edição de fornecedor
│   └── confirm-dialog.tsx            # Modal de confirmação de exclusão
└── lib/
    ├── utils.ts                      # cn, formatCurrency, formatDate, formatCNPJ
    ├── prisma.ts                     # Cliente Prisma (singleton)
    ├── validators.ts                 # Schemas Zod (produto, fornecedor)
    └── nfe-parser.ts                 # Parser de XML de NF-e (fast-xml-parser)
```

## Banco de Dados

O arquivo `schema.sql` contém toda a estrutura do banco. Execute no Supabase SQL Editor ou use Prisma:

```bash
npx prisma db push
```

## Funcionalidades do MVP (Sprint 1)

- [x] Dashboard com resumo de vendas e alertas de estoque
- [x] Módulo de Inventário com busca rápida por EAN/código de barras
- [x] Entrada de NF-e via upload de XML com parser automático
- [x] Tabela de-para preparada para mapeamento por IA
- [x] Histórico de vendas
- [x] Cadastro de fornecedores
- [x] Validações com Zod
- [x] Feedback visual com Toasts (Sonner)
