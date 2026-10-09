# Supabase Docker source

Vendored from https://github.com/supabase/supabase/tree/self-hosted/v0.8.0/docker
(tag self-hosted/v0.8.0). Base Compose and referenced configuration files are unmodified.
Sonnet's local overrides are in docker-compose.override.yml. The backend script always
passes both files explicitly. See the repository README for startup and backup instructions.

The local stack uses the upstream-supported symmetric JWT configuration with freshly
generated keys, not the upstream example credentials. The application variable named
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY accepts the generated anon JWT in this configuration.
