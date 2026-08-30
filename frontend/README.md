# RazorStitch frontend

React single-page application for the RazorStitch demo theater, marketing site, research dashboard, and Razorpay Test checkout.

The canonical project README lives at the repository root: [`../README.md`](../README.md).

## Development

```bash
cp .env.example .env
# REACT_APP_BACKEND_URL=http://localhost:8000
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). The flagship demo route is `/checkout?record=1` (record mode hides navigation and speeds playback).

## Production build

```bash
npm run build
```

Deploy with Vercel from this directory. Set `REACT_APP_BACKEND_URL` in the Vercel project to your FastAPI origin (Render URL or tunnel URL for local API during demos).

```bash
../scripts/deploy-vercel.sh
```

## Main routes

| Route | Purpose |
|-------|---------|
| `/` | Landing and product overview |
| `/checkout`, `/cart`, `/subscription`, `/invoice` | Recovery theater per wedge |
| `/research` | Training narrative and benchmarks |
| `/pricing` | Plans and Razorpay Test checkout |
| `/start` | Pilot waitlist |
