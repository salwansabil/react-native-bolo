FROM python:3.13-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY agent.py ./
COPY prompts ./prompts

ENV PORT=8080
ENV UV_LINK_MODE=copy

EXPOSE 8080

CMD ["sh", "-c", "uv run --no-sync agent.py serve --host 0.0.0.0 --port ${PORT}"]
