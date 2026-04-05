# EvaEpic Deployment

## Vercel shape

Deploy this repo as two Vercel projects so the whole app still stays on Vercel without needing a separate container platform:

1. Frontend project
   Root directory: `frontend`
2. Backend project
   Root directory: `backend`

This repo now uses HTTP streaming for negotiation progress instead of WebSockets, which fits Vercel Functions.
It also supports a built-in demo mode, so the portfolio app remains usable even before every paid integration is configured.

## Frontend services

Create and configure:

- Clerk for authentication
- Supabase for profile/settings persistence
- PostHog for product analytics
- Sentry for frontend monitoring

Apply the SQL in `frontend/supabase/schema.sql` to your Supabase project before using the settings page.

Set the frontend environment variables from `frontend/.env.example`.

Important production value:

- `NEXT_PUBLIC_API_BASE_URL=https://<your-backend-project>.vercel.app/api`

## Backend services

Set the backend environment variables from `backend/.env.example`.

Optional but useful for the portfolio demo:

- Sentry captures backend errors
- Pinecone semantically ranks vendors before the LangGraph flow continues
- Anthropic enables live extraction and negotiation instead of deterministic demo fallbacks

If you want Pinecone ranking, create the index and sync vendors:

```powershell
.venv\Scripts\python.exe backend\scripts\sync_pinecone_vendors.py
```

## Suggested rollout

1. Deploy the backend Vercel project from `backend`
2. Copy its Vercel URL into `NEXT_PUBLIC_API_BASE_URL` in the frontend project
3. Deploy the frontend Vercel project from `frontend`
4. Test sign-in, settings save, extraction, and a full negotiation run
