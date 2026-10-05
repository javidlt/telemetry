import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('<App />', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the hero and all top-level sections', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: /see what your worker is doing\./i, level: 1 })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^setup$/i, level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /on-call roster/i, level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /preview:/i, level: 2 })).toBeInTheDocument()
  })

  it('shows the Kusto snippet by default and switches when you pick a backend', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    const code = container.querySelector('.step-list li:nth-of-type(4) pre code')
    expect(code).not.toBeNull()
    expect(code!.textContent).toMatch(/Create a table in your ADX database/)

    await user.click(screen.getByRole('button', { name: /OTLP collector/i }))
    expect(code!.textContent).toMatch(/exportSpans/)

    await user.click(screen.getByRole('button', { name: /Cloudflare Logpush/i }))
    expect(code!.textContent).toMatch(/Push raw trace events to R2/)
  })

  it('marks the active backend tab with the active class', async () => {
    const user = userEvent.setup()
    render(<App />)
    const otlpBtn = screen.getByRole('button', { name: /OTLP collector/i })
    expect(otlpBtn).not.toHaveClass('active')
    await user.click(otlpBtn)
    expect(otlpBtn).toHaveClass('active')
  })

  it('shows idle hint before any fetch', () => {
    render(<App />)
    expect(screen.getByText(/click/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /fetch members/i })).toBeInTheDocument()
  })

  it('renders members in a table when the API responds ok', async () => {
    const user = userEvent.setup()
    const members = [
      { id: 1, email: 'a@example.com', name: 'Ana', available: 1 },
      { id: 2, email: 'b@example.com', name: 'Beto', available: 0 },
    ]
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ members }), { status: 200 }))

    render(<App />)
    await user.click(screen.getByRole('button', { name: /fetch members/i }))

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
    const table = screen.getByRole('table')
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(3)
    expect(within(table).getByText('Ana')).toBeInTheDocument()
    expect(within(table).getByText('Beto')).toBeInTheDocument()
    const okPill = within(table).getByText('available', { selector: '.pill' })
    expect(okPill).toHaveClass('ok')
    const offPill = within(table).getByText('off', { selector: '.pill' })
    expect(offPill).toHaveClass('bad')
    expect(fetchMock).toHaveBeenCalledWith('/api/members')
  })

  it('shows the empty-state hint when the API returns no members', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ members: [] }), { status: 200 })
    )
    render(<App />)
    await user.click(screen.getByRole('button', { name: /fetch members/i }))
    await waitFor(() =>
      expect(screen.getByText(/table is empty/i)).toBeInTheDocument()
    )
  })

  it('shows an error hint when the request fails with non-ok status', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 500 }))
    render(<App />)
    await user.click(screen.getByRole('button', { name: /fetch members/i }))
    await waitFor(() =>
      expect(screen.getByText(/request failed: http 500/i)).toBeInTheDocument()
    )
  })

  it('shows an error hint when fetch itself rejects', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))
    render(<App />)
    await user.click(screen.getByRole('button', { name: /fetch members/i }))
    await waitFor(() =>
      expect(screen.getByText(/request failed: offline/i)).toBeInTheDocument()
    )
  })

  it('disables the fetch button while loading', async () => {
    const user = userEvent.setup()
    let resolveFetch: (v: Response) => void = () => {}
    const pending = new Promise<Response>((resolve) => {
      resolveFetch = resolve
    })
    vi.spyOn(globalThis, 'fetch').mockReturnValue(pending)

    render(<App />)
    const btn = screen.getByRole('button', { name: /fetch members/i })
    await user.click(btn)
    expect(screen.getByRole('button', { name: /loading…/i })).toBeDisabled()

    resolveFetch(new Response(JSON.stringify({ members: [] }), { status: 200 }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /fetch members/i })).not.toBeDisabled()
    )
  })
})
