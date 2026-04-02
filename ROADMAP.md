# SLAX Analytics — Roteiro de Desenvolvimento - MVP

---

## Stack completa

### Frontend

| Tecnologia                            | Papel                                        |
| ------------------------------------- | -------------------------------------------- |
| Next.js 16 (App Router)               | Framework React — SSR/SSG/SEO                |
| TypeScript                            | Tipagem forte                                |
| Tailwind CSS                          | Estilização                                  |
| shadcn/ui                             | Componentes de UI                            |
| Zod                                   | Validação de schemas da API                  |
| TanStack Query                        | Fetching e cache de dados do servidor        |
| Zustand                               | Estado global do cliente (UI state, filtros) |
| React Hook Form + @hookform/resolvers | Formulários com validação via Zod            |
| Vitest + Testing Library              | Testes unitários — API idêntica ao Jest      |

### Backend

| Tecnologia      | Papel                                               |
| --------------- | --------------------------------------------------- |
| FastAPI         | Alta performance — Swagger automático               |
| SQLAlchemy      | ORM robusto                                         |
| Pydantic        | Modelos de API                                      |
| Alembic         | Migrations                                          |
| python-dotenv   | Variáveis de ambiente                               |
| passlib[bcrypt] | Hash de senhas                                      |
| python-jose     | Tokens JWT                                          |
| pytest + httpx  | Testes unitários e de integração                    |
| Ruff            | Linter + formatter (substitui black, isort, flake8) |

### Infraestrutura

| Tecnologia       | Papel                            |
| ---------------- | -------------------------------- |
| PostgreSQL       | Banco relacional                 |
| Docker + Compose | Reprodutibilidade — zero fricção |
| GitHub Actions   | CI/CD — lint + test a cada push  |

---

## Convenções obrigatórias (Frontend)

- **TanStack Query** para todo fetching de dados do servidor — nunca `useEffect` + `fetch` direto
- **Zod** para validar a resposta de cada endpoint (`lib/api/*.ts`)
- **Zustand** para estado global de cliente (não use Context API para estado global)
- **Custom hooks** (`hooks/`) isolam lógica da UI — componentes só consomem hooks
- Estrutura padrão: `lib/api/<recurso>.ts` (schema Zod + fetcher) → `hooks/use<Recurso>.ts` (useQuery/useMutation) → `components/`

---

## Visão geral do que será construído

- Sidebar de navegação (Dashboard, Reports, Users, API Logs, Settings)
- 4 cards de métricas: Total Users, API Requests, Database Health, Revenue
- Gráfico de linha: "Performance Over Time (Last 30 Days)" — Requests + Latency
- Tabela "Recent Activity" com ações por linha (editar/deletar)
- Botão "Add User"

---

## Passo 1 — Backend: modelos e banco de dados

**Arquivos:** `backend/app/models.py`, `backend/app/database.py`

- Definir modelo `User` (id, name, avatar_url, created_at)
- Definir modelo `APILog` (id, user_id, action, status, timestamp)
- Definir modelo `RevenueMetric` (id, value, recorded_at)
- Garantir que `database.py` cria as tabelas via SQLModel `create_db_and_tables()`

---

## Passo 2 — Backend: endpoints da API

**Arquivo:** `backend/app/main.py`

Criar os seguintes endpoints:

| Método | Rota           | Descrição                                                                     |
| ------ | -------------- | ----------------------------------------------------------------------------- |
| GET    | `/stats`       | Retorna total_users, api_requests, db_health, revenue + variações percentuais |
| GET    | `/performance` | Retorna array de 30 pontos com requests e latency por dia                     |
| GET    | `/activity`    | Retorna últimas atividades (user, action, timestamp, status)                  |
| POST   | `/users`       | Cria novo usuário                                                             |
| DELETE | `/users/{id}`  | Remove usuário                                                                |
| PUT    | `/users/{id}`  | Edita usuário                                                                 |

Ativar CORS para `http://localhost:3000`.

---

## Passo 3 — Backend: seed de dados

**Arquivo:** `backend/app/seed.py` (novo)

- Popular o banco com dados fictícios para visualizar o dashboard logo de início
- Executado uma vez via `python -m app.seed`

---

## Passo 4 — Frontend: instalar dependências

**No terminal (dentro de `frontend/`):**

```bash
npm install recharts
npm install @radix-ui/react-avatar @radix-ui/react-dialog
npx shadcn@latest add card table badge avatar dialog
```

Bibliotecas necessárias:

- `recharts` — gráfico de performance
- Componentes shadcn: `card`, `table`, `badge`, `avatar`, `dialog`

---

## Passo 5 — Frontend: layout com sidebar

**Arquivo:** `frontend/app/layout.tsx`

- Criar componente `Sidebar` com links: Dashboard, Reports, Users, API Logs, Settings
- Ícones via `lucide-react` (já instalado)
- Layout em duas colunas: sidebar fixa à esquerda + área de conteúdo
- Header com nome do usuário admin, data e ícone de notificação

---

## Passo 6 — Frontend: cards de métricas

**Arquivo:** `frontend/components/dashboard/StatsCards.tsx` (novo)

- 4 cards usando o componente `Card` do shadcn
- Cada card: ícone + label + valor + badge de variação percentual + mini sparkline
- Cores: verde para positivo, vermelho para negativo, cinza para neutro ("Stable")
- Buscar dados de `GET /stats`

---

## Passo 7 — Frontend: gráfico de performance

**Arquivo:** `frontend/components/dashboard/PerformanceChart.tsx` (novo)

- `LineChart` do recharts com duas linhas: Requests (eixo Y esquerdo) e Latency (eixo Y direito)
- Eixo X: dias 1–30
- Legenda embaixo
- Buscar dados de `GET /performance`

---

## Passo 8 — Frontend: tabela de atividade recente

**Arquivo:** `frontend/components/dashboard/RecentActivity.tsx` (novo)

- Tabela com colunas: User (avatar + nome), Action, Timestamp, Status
- Coluna Status: badge verde para "Success", ícones de editar/deletar para ações pendentes
- Botão "Add User" no cabeçalho — abre modal
- Buscar dados de `GET /activity`

---

## Passo 9 — Frontend: modal "Add User"

**Arquivo:** `frontend/components/dashboard/AddUserDialog.tsx` (novo)

- Dialog do shadcn
- Campos: nome, e-mail
- Submit chama `POST /users`
- Atualiza a tabela ao fechar

---

## Passo 10 — Frontend: página principal

**Arquivo:** `frontend/app/page.tsx`

- Montar todos os componentes criados nos passos anteriores
- Título "Dashboard / Overview" no topo

---

## Passo 11 — Validação e ajustes visuais

- Conferir responsividade do layout
- Ajustar cores para corresponder ao design
- Testar fluxo completo: criar usuário → aparece na tabela

---

## Passo 12 — Docker: verificação final

- Confirmar que `docker compose up --build` sobe tudo sem erros
- Confirmar que o seed roda automaticamente (ou via script)
- Confirmar que hot reload funciona no desenvolvimento

---
