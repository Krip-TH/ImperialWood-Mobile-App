# ImperialWood MySQL backend

This is an isolated alternative to `../my-Backend`. It uses MySQL for every
`IW_*` table query and keeps the existing HTTP routes and response envelopes.
It does not replace or modify the production backend.

Supabase Auth is intentionally retained only for validating the bearer token
already produced by the unchanged Expo frontend. The new server does not read
or write application data through Supabase/PostgreSQL.

## Local setup

1. Copy `.env.example` to `.env` inside this folder.
2. Set `DB_PASSWORD` locally. Never commit `.env`.
3. Copy the existing backend's `SUPABASE_URL` and `SUPABASE_ANON_KEY` values
   into the new `.env` so existing Expo login tokens remain valid.
   Configure `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, and `GITHUB_BRANCH`.
   Use a fine-grained token with Contents read/write permission for
   `Krip-TH/ImperialWood-Mobile-App`. The token stays in this backend's ignored
   `.env` file and is never sent to the Expo application.
4. Run `npm install` and then `npm run check`.
5. To avoid competing with the existing server during local testing, set a
   temporary port such as `PORT=3118`, then run `npm start`.

Test the public endpoints:

```text
GET http://localhost:3118/api/health
GET http://localhost:3118/api/db-test
GET http://localhost:3118/api/categories
GET http://localhost:3118/api/products
GET http://localhost:3118/api/stores
```

Authenticated routes require a current Supabase access token:

```text
Authorization: Bearer YOUR_TEST_ACCESS_TOKEN
```

## Server upload and cutover

Upload only this `my-Backend-MySQL` directory to a new server directory. Create
its `.env` on the server, run `npm ci --omit=dev`, and first launch it on a
temporary port. Verify all routes before changing the process or reverse-proxy
configuration that currently owns port 3117. Stop neither the old backend nor
its process until the new backend has passed testing and you intentionally
perform the cutover.
