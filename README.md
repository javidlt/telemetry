# telemetry

A setup guide and (soon) viewer for Cloudflare Workers observability. Deploy
a Worker with logs/traces on, forward the data to your favourite backend
(Azure Data Explorer, an OTLP collector, R2), then browse it.

## Repo layout

```
telemetry/
├── setup-project/   # Landing page + setup guide (React + Vite + Cloudflare Worker)
│                    # All frontend/worker config lives here — deploy from this dir.
└── app/             # (Planned) Telemetry viewer that queries your backend.
```

- **`setup-project/`** — deployable today. Renders the landing page you see
  in production and hosts the Worker under `/api/*`. All Cloudflare config
  (`wrangler.jsonc`, tsconfigs, `vite.config.ts`) lives inside this
  directory, so it's self-contained.
- **`app/`** — not implemented yet. Will hold the trace/log/metric viewer.
  See [`app/README.md`](./app/README.md) for the plan.

## Quick start

```bash
git clone https://github.com/javidlt/telemetry
cd telemetry/setup-project
npm install
npm run dev        # local dev on http://localhost:5173
npm run deploy     # build + wrangler deploy
```

Observability is enabled by default in
[`setup-project/wrangler.jsonc`](./setup-project/wrangler.jsonc):

- **Logs** — on, 100% sampling, invocation logs + persistence.
- **Traces** — currently `enabled: false`. Flip it on once you have a
  trace-collection backend ready.

## Sending telemetry to a backend

The landing page in `setup-project/` walks through three routes:

1. **Azure Data Explorer (Kusto)** — Logpush → ADX ingestion endpoint,
   query with KQL.
2. **OTLP collector** — forward spans from the Worker to any
   OpenTelemetry backend (Grafana Tempo, Honeycomb, Datadog, …).
3. **Cloudflare Logpush → R2** — dump raw trace events; the future
   `app/` will read from there.

See the running site for the specific commands.

## Deployment

The site is designed to deploy as a single Cloudflare Worker with static
assets (SPA mode). From `setup-project/`:

```bash
npm run deploy
```

That runs `vite build` and `wrangler deploy`. The Worker serves `/api/*`
and Cloudflare's asset pipeline serves everything else from the built
`dist/`.

## License

MIT (or your preferred license — update as needed).
