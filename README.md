# SCOPEFORGE

Quote-to-scope operating system for agencies and service businesses. Turns messy inbound client requests into structured briefs, scoped deliverables, margin-guarded pricing, polished proposals, onboarding flows, and scope-control change orders.

This is a high-fidelity product prototype: every screen is real and interactive, driven by a rich demo workspace ("Atelier North", a 14-person Copenhagen agency) pinned to a fixed demo clock (10 June 2026). No external services are required to run it.

## Stack

- Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS v4 (custom semantic tokens, no default palette)
- framer-motion for the motion system · zustand for client state · cmdk for the ⌘K palette
- Custom design system — dark "petrol control room" default theme, light theme supported

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 — the marketing site is at `/`, the app at `/dashboard` (or "Explore the live demo" from the hero).

### Golden demo paths

1. **Intake analysis** — `/leads/ld-harborfern` → Intake tab → "Run intake analysis"
2. **Gmail import (sandbox)** — `/leads` → "Import from Gmail" → the Bryggen Padel thread → import → a new lead with full provenance
3. **Connection ritual** — `/integrations` → Connect Microsoft 365 → the three-stage guided consent flow

## Integrations layer

Two deliberately separated halves:

- **Production-shaped server architecture** in `src/server/**` and `src/app/api/integrations/**`: OAuth 2.0 + PKCE, HMAC-signed state, AES-256-GCM token vault, least-privilege Google/Microsoft adapters over raw REST, ingestion pipeline, redacted audit logging. With no provider env vars configured it reports sandbox mode instead of failing.
- **Sandbox client experience** in `src/lib/integrations*.ts`: every UX state (consent, partial grant, token expiry, admin block, import, disconnect) is exercisable in the prototype, clearly labeled as simulation. Provider consent UIs are never imitated.

Architecture document: [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md) · Postgres/Supabase schema: [`supabase/migrations/0001_integrations.sql`](supabase/migrations/0001_integrations.sql) · Design contract: [`DESIGN_SPEC.md`](DESIGN_SPEC.md)

## Deploy

Standard Next.js build — imports cleanly into Vercel with no environment variables required (the app runs fully in sandbox mode). To later activate live OAuth: set `SCOPEFORGE_VAULT_KEY`, `SCOPEFORGE_STATE_SECRET`, `APP_ORIGIN`, and the `GOOGLE_CLIENT_ID/SECRET` / `MS_CLIENT_ID/SECRET` pairs as described in `docs/INTEGRATIONS.md`.
