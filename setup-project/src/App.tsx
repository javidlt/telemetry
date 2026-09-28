import { useState } from 'react'
import './App.css'

const REPO_URL = 'https://github.com/javidlt/telemetry'

type TabId = 'kusto' | 'otlp' | 'logpush'

const tabs: { id: TabId; label: string; hint: string }[] = [
  { id: 'kusto', label: 'Azure Data Explorer (Kusto)', hint: 'KQL over Workers logs' },
  { id: 'otlp', label: 'OTLP collector', hint: 'Any OpenTelemetry backend' },
  { id: 'logpush', label: 'Cloudflare Logpush', hint: 'R2 / S3 / HTTP sink' },
]

const snippets: Record<TabId, string> = {
  kusto: `# 1. Create a table in your ADX database
.create table WorkerLogs (
    Timestamp: datetime,
    Level: string,
    Message: string,
    TraceId: string,
    SpanId: string,
    Attributes: dynamic
)

# 2. Point Logpush at your ADX ingestion endpoint
wrangler logpush create \\
  --dataset workers_trace_events \\
  --destination "https://<cluster>.<region>.kusto.windows.net/v1/rest/ingest/<db>/WorkerLogs?..."`,
  otlp: `// worker/otel.ts — forward invocation logs as OTLP
export async function exportSpans(spans: Span[], env: Env) {
  await fetch(env.OTLP_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-protobuf',
      authorization: \`Bearer \${env.OTLP_TOKEN}\`,
    },
    body: encodeOtlp(spans),
  })
}`,
  logpush: `# Push raw trace events to R2, then let /app read from there.
wrangler logpush create \\
  --dataset workers_trace_events \\
  --destination "r2://telemetry-logs/{DATE}"`,
}

function App() {
  const [tab, setTab] = useState<TabId>('kusto')

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <span className="dot" />
          <span className="brand-name">telemetry</span>
        </div>
        <nav className="topnav">
          <a href="#setup">Setup</a>
          <a href="#preview">Preview</a>
          <a href={REPO_URL} target="_blank" rel="noreferrer">Repo →</a>
        </nav>
      </header>

      <section className="hero">
        <p className="eyebrow">Cloudflare Workers · Observability</p>
        <h1>See what your Worker is doing.</h1>
        <p className="tagline">
          A setup guide and viewer for the traces, logs, and metrics your
          Worker emits. Wire it to Kusto, an OTLP collector, or R2 — then
          browse it from <code>/app</code>.
        </p>
        <div className="cta">
          <a className="cta-primary" href="#setup">Get started</a>
          <a className="cta-secondary" href={REPO_URL} target="_blank" rel="noreferrer">
            View on GitHub
          </a>
        </div>
      </section>

      <section id="setup" className="steps">
        <h2>Setup</h2>
        <p className="section-lede">
          Four steps from a fresh clone to queryable traces.
        </p>

        <ol className="step-list">
          <li>
            <span className="step-num">1</span>
            <div>
              <h3>Clone and install</h3>
              <pre><code>{`git clone ${REPO_URL}
cd telemetry/setup-project
npm install`}</code></pre>
            </div>
          </li>

          <li>
            <span className="step-num">2</span>
            <div>
              <h3>Turn on observability</h3>
              <p>
                Already enabled in <code>setup-project/wrangler.jsonc</code>. Flip
                <code> traces.enabled </code> to <code>true</code> once you're
                ready to ship — logs are on by default.
              </p>
              <pre><code>{`"observability": {
  "logs":   { "enabled": true, "head_sampling_rate": 1, "invocation_logs": true, "persist": true },
  "traces": { "enabled": true, "head_sampling_rate": 1, "persist": true }
}`}</code></pre>
            </div>
          </li>

          <li>
            <span className="step-num">3</span>
            <div>
              <h3>Deploy the Worker</h3>
              <pre><code>{`npm run deploy`}</code></pre>
              <p>
                Cloudflare starts collecting invocation logs and trace events
                immediately. Confirm in the dashboard under
                <em> Workers → your worker → Observability</em>.
              </p>
            </div>
          </li>

          <li>
            <span className="step-num">4</span>
            <div>
              <h3>Ship telemetry to your backend</h3>
              <p>Pick where you want to query it from:</p>
              <div className="tabs">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    className={t.id === tab ? 'tab active' : 'tab'}
                    onClick={() => setTab(t.id)}
                  >
                    <span className="tab-label">{t.label}</span>
                    <span className="tab-hint">{t.hint}</span>
                  </button>
                ))}
              </div>
              <pre><code>{snippets[tab]}</code></pre>
            </div>
          </li>
        </ol>
      </section>

      <section id="preview" className="preview">
        <h2>Preview: <code>/app</code></h2>
        <p className="section-lede">
          The viewer under <code>app/</code> is a work in progress. Here's
          what it will look like once it's reading from your backend.
        </p>

        <div className="mock">
          <div className="mock-chrome">
            <span className="mock-dot red" />
            <span className="mock-dot yellow" />
            <span className="mock-dot green" />
            <span className="mock-url">telemetry.workers.dev/app</span>
          </div>
          <div className="mock-body">
            <aside className="mock-side">
              <div className="mock-side-label">Filters</div>
              <div className="chip active">Last 15m</div>
              <div className="chip">Errors only</div>
              <div className="chip">route = /api/*</div>
            </aside>
            <div className="mock-main">
              <div className="mock-row header">
                <span>time</span>
                <span>route</span>
                <span>status</span>
                <span>latency</span>
              </div>
              <div className="mock-row"><span>19:42:07</span><span>/api/name</span><span className="ok">200</span><span>12ms</span></div>
              <div className="mock-row"><span>19:42:03</span><span>/api/name</span><span className="ok">200</span><span>9ms</span></div>
              <div className="mock-row err"><span>19:41:58</span><span>/api/name</span><span className="bad">500</span><span>84ms</span></div>
              <div className="mock-row"><span>19:41:51</span><span>/</span><span className="ok">200</span><span>4ms</span></div>
              <div className="mock-row"><span>19:41:44</span><span>/api/name</span><span className="ok">200</span><span>11ms</span></div>
              <div className="mock-trace">
                <div className="span" style={{ left: '0%', width: '100%' }}>fetch · 84ms</div>
                <div className="span child" style={{ left: '8%', width: '68%' }}>kv:get · 57ms</div>
                <div className="span child bad" style={{ left: '78%', width: '18%' }}>upstream · 15ms · 500</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="foot">
        <div>
          Built for{' '}
          <a href="https://developers.cloudflare.com/workers/observability/" target="_blank" rel="noreferrer">
            Workers Observability
          </a>
          . Source at{' '}
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            {REPO_URL.replace('https://', '')}
          </a>
          .
        </div>
      </footer>
    </>
  )
}

export default App
