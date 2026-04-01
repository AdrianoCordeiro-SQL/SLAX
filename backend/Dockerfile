# Estágio 1: instalação com ferramentas de compilação
FROM python:3.11-alpine AS builder

RUN apk add --no-cache gcc musl-dev libffi-dev postgresql-dev

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Estágio 2: imagem final mínima
FROM python:3.11-alpine AS runner

RUN apk add --no-cache libpq

WORKDIR /app
COPY --from=builder /install /usr/local
COPY . .

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
