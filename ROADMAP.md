# Mercado ERP — Roadmap de Desenvolvimento

## ✅ Sprint 1 — MVP Completo
- [x] Migração Supabase/Prisma → Firestore
- [x] Dashboard com métricas em tempo real
- [x] CRUD de Produtos (criar, editar, deletar, buscar)
- [x] CRUD de Fornecedores
- [x] Upload e processamento de XML de NF-e
- [x] Histórico de vendas (somente leitura)
- [x] Validação com Zod
- [x] UI com Shadcn + Tailwind

---

## 🚀 Sprint 2 — Funcionalidades Críticas

### Prioridade Alta

#### 1. Tela de PDV (Ponto de Venda)
- [ ] Criar página `/pdv` ou `/vendas/nova`
- [ ] Componente de busca de produtos (por nome, EAN, código de barras)
- [ ] Carrinho de compras (adicionar/remover itens, ajustar quantidade)
- [ ] Cálculo automático de subtotal, desconto e total
- [ ] Seleção de forma de pagamento (Dinheiro, Débito, Crédito, PIX)
- [ ] Botão "Finalizar Venda" que chama POST `/api/vendas`
- [ ] Feedback visual (toast de sucesso, impressão de cupom opcional)
- [ ] Atalhos de teclado (F2 busca, F9 finalizar, ESC limpar)

#### 2. Tela de Mapeamento de Produtos NF-e
- [ ] Criar página `/nfe/mapeamento` ou aba na página `/nfe`
- [ ] Listar itens de NF-e com `mapeamentoStatus: "pendente"`
- [ ] Para cada item: mostrar nome/EAN do XML
- [ ] Buscar e vincular a produto existente OU criar novo produto
- [ ] Salvar mapeamento na collection `mapeamento_produtos`
- [ ] Atualizar `mapeamentoStatus` para "mapeado"

#### 3. Listagem e Gerenciamento de NF-e
- [ ] Adicionar aba "Histórico" na página `/nfe`
- [ ] Listar todas as NF-e importadas (GET `/api/nfe`)
- [ ] Filtro por status (pendente/processada)
- [ ] Botão "Confirmar Entrada" para NF-e pendentes
- [ ] Exibir detalhes da NF-e (fornecedor, itens, valores)
- [ ] Badge visual de status

#### 4. Corrigir validação `fornecedorId`
- [ ] Remover `.uuid()` do `produtoSchema` em `src/lib/validators.ts`
- [ ] Trocar por `.string().optional().nullable()` ou `.string().min(1).optional().nullable()`
- [ ] Testar criação de produto com fornecedor vinculado

---

## 📊 Sprint 3 — Melhorias de UX e Relatórios

### Prioridade Média

#### 5. Autenticação (Firebase Auth)
- [ ] Configurar Firebase Authentication
- [ ] Tela de login (`/login`)
- [ ] Proteção de rotas (middleware)
- [ ] Controle de acesso por role (admin, operador)
- [ ] Logout e gerenciamento de sessão

#### 6. Layout Responsivo
- [ ] Sidebar colapsável em mobile
- [ ] Menu hamburger para telas < 768px
- [ ] Ajustar `ml-64` para responsivo
- [ ] Testar em tablet e smartphone

#### 7. Relatórios e Gráficos
- [ ] Relatório de vendas por período (data inicial → data final)
- [ ] Produtos mais vendidos (top 10)
- [ ] Gráfico de vendas (usar `recharts`)
- [ ] Exportar relatórios em CSV/PDF

#### 8. Paginação
- [ ] Implementar paginação em `/produtos` (Firestore `startAfter`/`limit`)
- [ ] Implementar paginação em `/fornecedores`
- [ ] Implementar paginação em `/vendas`
- [ ] Implementar paginação em `/nfe`

---

## 🤖 Sprint 4 — Automação e Integrações

### Prioridade Baixa

#### 9. Integração IA para Mapeamento Automático
- [ ] Endpoint `/api/nfe/mapear-ia`
- [ ] Usar OpenAI/Anthropic para sugerir de-para
- [ ] Prompt engineering com nome, EAN, NCM do XML
- [ ] Retornar sugestões com score de confiança
- [ ] Aplicar mapeamento com confirmação do usuário

#### 10. Webhook de E-mail para NF-e
- [ ] Configurar SendGrid/Postmark inbound parsing
- [ ] Endpoint `/api/nfe/webhook-email`
- [ ] Extrair anexo XML do e-mail
- [ ] Processar automaticamente
- [ ] Notificar usuário via toast/notificação

#### 11. Dark Mode
- [ ] Toggle de tema na sidebar ou configurações
- [ ] Persistir preferência no localStorage
- [ ] Aplicar classes `dark:` do Tailwind

#### 12. Limpeza de Código
- [ ] Deletar `src/lib/prisma.ts`, `client.ts`, `server.ts`, `middleware.ts`
- [ ] Remover duplicação de `formatCurrency` (usar apenas de `utils.ts`)
- [ ] Remover imports não utilizados
- [ ] Lint e formatação (Prettier)

---

## 🐛 Bugs e Melhorias Técnicas

- [ ] Adicionar tratamento de erro global (error boundary)
- [ ] Melhorar mensagens de erro da API (mais descritivas)
- [ ] Adicionar loading states em todas as páginas
- [ ] Implementar retry logic para chamadas Firestore
- [ ] Adicionar testes unitários (Vitest)
- [ ] Adicionar testes E2E (Playwright)
- [ ] Configurar CI/CD (GitHub Actions)
- [ ] Monitoramento de erros (Sentry)

---

## 📝 Notas

- **Firestore Collections:**
  - `produtos` — Produtos cadastrados
  - `fornecedores` — Fornecedores
  - `vendas` — Vendas finalizadas (itens embutidos)
  - `entradas_nfe` — NF-e importadas (itens embutidos)
  - `mapeamento_produtos` — De-para NF-e → produto
  - `contadores` — Auto-incremento de números

- **Variáveis de Ambiente (Vercel):**
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`

- **Stack:**
  - Next.js 14 (App Router)
  - Firestore (NoSQL)
  - Shadcn UI + Tailwind CSS
  - Zod (validação)
  - Firebase Admin SDK
