# app/

Placeholder for the telemetry viewer. This directory will hold the app that
queries the configured telemetry backend (Kusto / Azure Data Explorer, OTLP
collector, Grafana Loki, etc.) and renders traces, logs, and metrics for the
Worker deployed from [`../setup-project`](../setup-project).

## Planned scope

- Read connection settings from a local config or `.dev.vars` (cluster URI,
  database, table, auth mode).
- Query the backend using its native client (e.g. `azure-kusto-data` for Kusto)
  behind the Cloudflare Worker so credentials never leave the server side.
- Render three views:
  - **Traces** — flame graph for a single invocation.
  - **Logs** — filterable stream tied to a trace id.
  - **Metrics** — request count, error rate, p50/p95/p99 latency.

## Status

Not implemented yet. The current landing page under `../setup-project` links
here and shows a static preview of what this app will look like once built.
