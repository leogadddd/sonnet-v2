# Sonnet

A local-first writing app built with Next.js, React, Novel, IndexedDB, and self-hosted
Supabase. Accounts use email/password; Supabase handles cloud documents and private
image storage. No hosted auth, upload, Redis, or Convex account is required.

## Start locally

Requirements: Node 22.22.2 (see `.nvmrc`), npm, Docker Engine and Docker Compose
2.24.4 or newer. The complete Supabase stack needs approximately 4 GB RAM minimum;
8 GB is preferable. Ports 3000, 8000, and 8025 must be available.

```bash
nvm use
npm ci
npm run backend:setup
npm run backend:start
npm run dev
```

Open http://localhost:3000. Register, then open http://localhost:8025 to read the
confirmation email. Open its link in the same browser used for registration.
The mail viewer is for local development; it does not send external email.

Supabase Studio is at http://localhost:8000. Its generated username and password
are in `docker/supabase/.env` under `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD`.
Do not share that file.

Setup generates unique database, JWT, dashboard, and storage secrets and writes
`.env.local` and `docker/supabase/.env` with owner-only permissions. It refuses to
overwrite either file. If you already have environment files, configure them manually
using `.env.example`; keep the app's URL and keys consistent with the backend.
The public application key uses the generated anon JWT; only `SUPABASE_SECRET_KEY`
uses the service-role JWT. The latter is used exclusively in server-only upload code.

`backend:start` waits for service health and applies pending migrations.
`backend:migrate` applies/checks migrations separately; applied files are verified by
checksum and must never be edited. Add a new numbered SQL migration instead.
`backend:stop` stops services without removing volumes. Starting again retains data.
Neither command resets an existing database.

## Writing and accounts

Drafts save automatically on this device. Use Sonnet Sync (Ctrl+I) to synchronize
across devices. Publish (Ctrl+P) writes the current draft and taxonomy to the cloud;
unpublishing immediately removes anonymous access to the post and its images.
Covers and inline images are uploaded to Supabase; writing text works offline after
sign-in. Uploading and publishing require a connection.

Each account has a separate `SonnetDB:<auth UUID>` IndexedDB database. Signing out
closes the active database and clears account state without deleting unsynced drafts.
Signing back in restores that account's drafts. The old shared `SonnetDB` and legacy
user storage are not imported or deleted. This is a fresh setup, not a migration of
existing hosted accounts, blogs, or files.

Account settings support profile names, username, avatar, confirmed email changes,
password changes, and logout. Passwords require at least 12 characters. Confirmation
and recovery links use PKCE and should be opened in the browser that requested them.
Email changes require confirmation at both the old and new addresses.

The latest timestamp wins during sync. Equal timestamps with different content
raise an explicit conflict and preserve the local draft instead of merging document
structures incorrectly. Deletion markers remain in the cloud so other devices can
learn about deletions.

## Security and verification

Database policies enforce ownership independently of the UI. Public author data
contains only display fields. Account email, flags, privileges, and counts are private.
Ordinary users cannot assign another owner or modify account plans and engagement
counters. Likes run atomically in a database function.

Images are stored in a private bucket. Uploads require a session, same-origin requests,
valid image signatures, and a maximum size of 20 MB (PNG/JPEG/GIF/WebP). Images are
served through `/api/images/:id` with authorization and no caching; publishing grants
public read access, and unpublishing revokes it. Avatars become public only when
selected as the account's current avatar. Storage service keys never enter browser code.

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit
```

For browser tests, start the local backend and app first:

```bash
npx playwright install chromium
npx playwright test
```

To verify database and image persistence across a local backend restart:

```bash
node tests/persistence.mjs
```

This check briefly stops the backend, so run it separately from browser tests.

Tests use temporary accounts and the local mail viewer. They must only run against
the disposable local backend, never a production instance. They cover registration,
confirmation, recovery, profile changes, draft persistence, publishing, uploads,
and cross-account authorization. Failure screenshots/traces may contain test account
sessions and are ignored by Git.

The dependency refresh fixes the React 19 / cmdk 1.0.0 install conflict and removes
high/critical npm findings. See [SECURITY.md](SECURITY.md) for the remaining Tiptap
advisory and the tested backport. ESLint is pinned to patched 9.39.5 because the
Next.js React/import/accessibility lint plugins do not yet support ESLint 10.

## Backups and a future server deployment

The base Docker configuration is vendored from Supabase `self-hosted/v0.8.0`.
[Upstream provenance](docker/supabase/UPSTREAM.md) records the source.
Application data lives in Docker volumes `sonnet_sonnet-db-data`,
`sonnet_sonnet-storage`, and `sonnet_db-config`. Back up the environment files,
Postgres, image storage, and database encryption configuration together. Preserve
the original keys; generating replacements does not recover encrypted data.

For a logical database backup while services are running:

```bash
docker exec supabase-db pg_dump -U postgres -d postgres --format=custom > sonnet-postgres.dump
```

Store the dump securely. For a coordinated full-volume backup, stop Sonnet's
application and backend, then snapshot all three named volumes through your
Docker/host backup tooling. Start the backend again after the snapshot completes.

Restore volume snapshots into an isolated Docker host with the same Compose release
and original environment files, then verify login, posts, and image downloads before
switching traffic. For logical restores, use `pg_restore` against a fresh matching
Supabase instance and restore the corresponding storage files and keys. Never run
a destructive restore over the only copy of a working database.

Local overrides bind backend endpoints to loopback and leave the database pooler
unpublished. For a real server, configure a TLS reverse proxy, the public Supabase
and application URLs, exact Auth callback allowlists, and a real SMTP service.
Remove the local mail service and development email rate-limit override, protect
Studio, configure firewall rules, and back up regularly. Rebuild the app after
changing public environment variables. No live deployment is performed by this repo's
setup scripts.
