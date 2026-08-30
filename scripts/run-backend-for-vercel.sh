#!/usr/bin/env bash
# Run FastAPI locally + Cloudflare quick tunnel so Vercel frontend can reach it.
# Keeps the Mac awake while this script runs (Ctrl+C to stop).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
PORT="${PORT:-8000}"
LOG_DIR="$ROOT/.local-dev"
mkdir -p "$LOG_DIR"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "Install cloudflared: brew install cloudflared"
  exit 1
fi

cleanup() {
  echo ""
  echo "Stopping backend and tunnel…"
  [[ -n "${UVICORN_PID:-}" ]] && kill "$UVICORN_PID" 2>/dev/null || true
  [[ -n "${TUNNEL_PID:-}" ]] && kill "$TUNNEL_PID" 2>/dev/null || true
  [[ -n "${CAFFEINATE_PID:-}" ]] && kill "$CAFFEINATE_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Free port if something else is bound (e.g. old uvicorn)
if lsof -t -i:"$PORT" >/dev/null 2>&1; then
  echo "Stopping process on port $PORT…"
  kill "$(lsof -t -i:"$PORT")" 2>/dev/null || true
  sleep 1
fi

# Prevent display / idle sleep while demo backend is live
caffeinate -dims &
CAFFEINATE_PID=$!
echo "caffeinate running (pid $CAFFEINATE_PID) — Mac stays awake until you Ctrl+C"

cd "$BACKEND"
if [[ -f "$ROOT/.venv/bin/activate" ]]; then
  # shellcheck disable=SC1091
  source "$ROOT/.venv/bin/activate"
fi

python -m uvicorn server:app --host 0.0.0.0 --port "$PORT" >"$LOG_DIR/uvicorn.log" 2>&1 &
UVICORN_PID=$!

for _ in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:$PORT/api/agents" >/dev/null; then
    break
  fi
  sleep 0.5
done

if ! curl -sf "http://127.0.0.1:$PORT/api/agents" >/dev/null; then
  echo "Backend failed to start. See $LOG_DIR/uvicorn.log"
  tail -20 "$LOG_DIR/uvicorn.log"
  exit 1
fi
echo "Backend OK → http://127.0.0.1:$PORT"

cloudflared tunnel --url "http://127.0.0.1:$PORT" >"$LOG_DIR/tunnel.log" 2>&1 &
TUNNEL_PID=$!

PUBLIC_URL=""
for _ in $(seq 1 60); do
  PUBLIC_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG_DIR/tunnel.log" | head -1 || true)
  [[ -n "$PUBLIC_URL" ]] && break
  sleep 0.5
done

if [[ -z "$PUBLIC_URL" ]]; then
  echo "Tunnel failed. See $LOG_DIR/tunnel.log"
  tail -20 "$LOG_DIR/tunnel.log"
  exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Public API:  $PUBLIC_URL"
echo "  Local API:   http://127.0.0.1:$PORT"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Point Vercel at the tunnel (one-time per tunnel URL):"
echo "  cd frontend"
echo "  printf '%s' '$PUBLIC_URL' | vercel env add REACT_APP_BACKEND_URL production"
echo "  vercel deploy --prod"
echo ""
echo "Smoke: ./scripts/deploy-check.sh $PUBLIC_URL https://razorstitch.vercel.app"
echo ""
echo "Logs: $LOG_DIR/{uvicorn,tunnel}.log — press Ctrl+C to stop."
echo ""

wait "$UVICORN_PID"
