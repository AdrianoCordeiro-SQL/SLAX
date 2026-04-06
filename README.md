# SLAX Pay (Portfólio)

Projeto de demonstração de uma plataforma SaaS de pagamentos, pensado para avaliação técnica de recrutadores.

## Modo Portfólio (2-3 minutos)

### 1) Subir a stack

```bash
docker compose up -d --build
```

### 2) Popular dados demo

```bash
docker compose exec backend python -m app.seed
```

### 3) Acessar a aplicação

- Frontend: `http://localhost:3000`
- Backend (docs): `http://localhost:8000/docs`

## Credenciais de demonstração

- Email: `admin@slax.com`
- Senha: `admin123`

Essas credenciais também são usadas pelo endpoint `POST /auth/demo` (botão "Entrar como visitante").

## Variáveis úteis

Arquivo raiz `.env.example`:

- `DEMO_LOGIN_EMAIL`
- `DEMO_LOGIN_PASSWORD`
- `ALLOWED_ORIGINS`
- `JWT_SECRET`
- `NEXT_PUBLIC_ENABLE_DEMO_LOGIN`

Arquivo `frontend/.env.example`:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_ENABLE_DEMO_LOGIN`

## Roteiro rápido para avaliação

1. Entrar com o botão "Entrar como visitante (dados de demonstração)".
2. Verificar indicadores e gráficos no dashboard.
3. Abrir `Users` e criar um usuário (opcionalmente com atividade demo).
4. Abrir `Reports` para validar logs, ranking e volume de eventos.

## Observações

- O seed é idempotente para massa de usuários: se já houver usuários no banco, a massa demo não é duplicada.
- A conta demo é criada automaticamente pelo seed se ainda não existir.
