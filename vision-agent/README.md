# Vision Agent

Voice-only AI language teacher for this Expo teaching project.

## Environment

The service loads credentials from the parent `.env` / `.env.local`, then
optionally from `vision-agent/.env` / `vision-agent/.env.local` for local
overrides:

```bash
STREAM_API_KEY=...
STREAM_API_SECRET=...
OPENAI_API_KEY=...
VISION_AGENT_SERVICE_TOKEN=...
```

Optional settings:

```bash
TEACHER_TARGET_LANGUAGE=Spanish
OPENAI_REALTIME_MODEL=gpt-realtime-2
OPENAI_REALTIME_VOICE=marin
```

## Run

Use Python 3.10+ through `uv`:

```bash
cd vision-agent
uv run agent.py run
```

Serve the HTTP API:

```bash
cd vision-agent
uv run agent.py serve --host 0.0.0.0 --port 8080
```

The built-in API starts an agent session with:

```bash
POST /calls/{call_id}/sessions
```

## Production container

Build the CPU image from this directory:

```bash
docker build --platform linux/amd64 -t bolo-vision-agent .
```

Run it locally with the same secrets used by the app backend:

```bash
docker run --env-file .env -p 8080:8080 bolo-vision-agent
```

For cloud deployment, set the service root directory to `vision-agent` and
deploy its `Dockerfile`. Configure `STREAM_API_KEY`, `STREAM_API_SECRET`,
`OPENAI_API_KEY`, and `VISION_AGENT_SERVICE_TOKEN` in the hosting provider; do
not commit them or copy them into the image. Use the same randomly generated
`VISION_AGENT_SERVICE_TOKEN` in the Expo API backend. The container respects
the provider's `PORT` environment variable and otherwise listens on port
`8080`.
