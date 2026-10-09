# Dependency security notes

Verified dependency baseline: Next.js 16.3.4, React 19.2.8, cmdk 1.1.1,
Supabase SSR 0.12.6, Supabase JS 2.115.0, and Tiptap core 2.27.3.

## Tiptap advisory GHSA-cp6q-959q-f8rh

npm currently reports this moderate advisory against the entire Tiptap 2 line and
therefore also flags Novel and its dependent extensions. These are dependency-chain
reports for one underlying issue, not 37 separate vulnerabilities.

The installed Tiptap 2.27.3 implementation contains a backport: `mergeAttributes`
defines an own data property for `__proto__` instead of invoking the legacy setter.
Inspection confirmed this in both ESM and CommonJS builds. The regression test in
`tests/security.test.ts` executes both versions with the advisory's attack shape
and checks that no attacker-controlled `src` or `onerror` property is inherited.
No local patch or forced major-version override is used.

The audit finding is intentionally not hidden. Recheck it on dependency updates;
the regression test must keep passing. Upgrade Novel when it supports a compatible,
officially unflagged editor release.

Advisory: https://github.com/advisories/GHSA-cp6q-959q-f8rh

## Runtime boundaries

Do not expose the service-role key or the Docker environment file. The browser uses
only the public anon key and per-user sessions. Database RLS enforces document
ownership, and storage changes go through authenticated server endpoints.

Local development binds backend ports to loopback and captures email in Mailpit.
Before an internet deployment, replace local email settings, configure HTTPS and exact
redirect URLs, protect Studio, and set up database/storage backups. Self-hosting
does not automatically apply future Supabase image security updates.
