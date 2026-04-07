# SLAX

Monorepo com API (FastAPI) em `backend/` e app web (Next.js) em `frontend/`.

## CI (GitHub Actions)

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda em push e pull requests para `main` e `all`:

| Job       | Comandos (equivalente local) |
|-----------|------------------------------|
| `backend` | `pip install -r backend/requirements-dev.txt`, `ruff check .`, `pytest` (em `backend/`) |
| `frontend`| `npm ci`, `npm run lint`, `npm run test:run`, `npm run build` (em `frontend/`) |

Variável usada no build do Next: `NEXT_PUBLIC_API_URL` (no CI: `http://localhost:8000`).

### Reproduzir localmente

```bash
# Backend
cd backend
pip install -r requirements-dev.txt
ruff check .
pytest
```

```bash
# Frontend
cd frontend
npm ci
npm run lint
npm run test:run
export NEXT_PUBLIC_API_URL=http://localhost:8000  # bash/zsh
# PowerShell: $env:NEXT_PUBLIC_API_URL="http://localhost:8000"
npm run build
```

### Branch protection (recomendado)

No GitHub: **Settings → Rules → Branch rules** para o branch principal — exigir que o status do workflow **CI** passe antes do merge.
