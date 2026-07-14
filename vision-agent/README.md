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
