# Pathways Waitlist

Pathways is currently focused on a single conversion flow: collecting early-access waitlist signups for the basketball hardware launch.

## Tech

- Next.js App Router
- Supabase (waitlist storage)
- Tailwind CSS

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## API

### `POST /api/waitlist`

Accepts JSON:

```json
{
  "email": "user@example.com",
  "user_type": "athlete"
}
```

- `email` is required.
- `user_type` is optional (`athlete`, `coach`, `parent`).
