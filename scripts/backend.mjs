import { spawnSync } from "node:child_process";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const backend = path.join(root, "docker/supabase");
const envFile = path.join(backend, ".env");
const appEnv = path.join(root, ".env.local");
const args = [
  "compose",
  "--project-directory",
  backend,
  "--env-file",
  envFile,
  "-f",
  path.join(backend, "docker-compose.yml"),
  "-f",
  path.join(backend, "docker-compose.override.yml"),
];
function docker(command, input) {
  const r = spawnSync("docker", [...args, ...command], {
    stdio: input === undefined ? "inherit" : ["pipe", "inherit", "inherit"],
    input,
    encoding: "utf8",
  });
  if (r.error) throw r.error;
  if (r.status !== 0)
    throw new Error("Docker command failed (" + r.status + ").");
}
function setup() {
  if (existsSync(envFile) || existsSync(appEnv))
    throw new Error(
      "Setup refuses to overwrite existing environment files. See README for manual configuration.",
    );
  const secret = randomBytes(32).toString("hex");
  const now = Math.floor(Date.now() / 1000);
  const jwt = (role) => {
    const header = Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" }),
    ).toString("base64url");
    const body = Buffer.from(
      JSON.stringify({
        role,
        iss: "supabase",
        iat: now,
        exp: now + 10 * 365 * 86400,
      }),
    ).toString("base64url");
    const data = header + "." + body;
    return (
      data + "." + createHmac("sha256", secret).update(data).digest("base64url")
    );
  };
  const anon = jwt("anon"),
    service = jwt("service_role");
  const values = {
    JWT_SECRET: secret,
    ANON_KEY: anon,
    SERVICE_ROLE_KEY: service,
    POSTGRES_PASSWORD: randomBytes(32).toString("hex"),
    DASHBOARD_USERNAME: "sonnet",
    DASHBOARD_PASSWORD: randomBytes(24).toString("hex"),
    SECRET_KEY_BASE: randomBytes(48).toString("hex"),
    REALTIME_DB_ENC_KEY: randomBytes(8).toString("hex"),
    VAULT_ENC_KEY: randomBytes(16).toString("hex"),
    PG_META_CRYPTO_KEY: randomBytes(32).toString("hex"),
    LOGFLARE_PUBLIC_ACCESS_TOKEN: randomBytes(32).toString("hex"),
    LOGFLARE_PRIVATE_ACCESS_TOKEN: randomBytes(32).toString("hex"),
    S3_PROTOCOL_ACCESS_KEY_ID: randomBytes(16).toString("hex"),
    S3_PROTOCOL_ACCESS_KEY_SECRET: randomBytes(32).toString("hex"),
    MINIO_ROOT_PASSWORD: randomBytes(24).toString("hex"),
    SUPABASE_PUBLIC_URL: "http://localhost:8000",
    API_EXTERNAL_URL: "http://localhost:8000",
    SITE_URL: "http://localhost:3000",
    ADDITIONAL_REDIRECT_URLS:
      "http://localhost:3000/auth/callback,http://localhost:3000/auth/callback?next=/reset-password",
    SMTP_HOST: "mail",
    SMTP_PORT: "1025",
    SMTP_USER: "",
    SMTP_PASS: "",
    SMTP_ADMIN_EMAIL: "hello@sonnet.local",
    SMTP_SENDER_NAME: "Sonnet",
    ENABLE_PHONE_SIGNUP: "false",
    ENABLE_PHONE_AUTOCONFIRM: "false",
    FUNCTIONS_VERIFY_JWT: "true",
    POOLER_TENANT_ID: "sonnet",
    STUDIO_DEFAULT_PROJECT: "Sonnet",
    STUDIO_DEFAULT_ORGANIZATION: "Personal",
    OPENAI_API_KEY: "",
    PGRST_DB_SCHEMAS: "public",
  };
  let env = readFileSync(path.join(backend, ".env.example"), "utf8");
  for (const [key, value] of Object.entries(values))
    env = env.replace(new RegExp("^" + key + "=.*$", "m"), key + "=" + value);
  writeFileSync(envFile, env, { mode: 0o600, flag: "wx" });
  writeFileSync(
    appEnv,
    "NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=" +
      anon +
      "\nSUPABASE_SECRET_KEY=" +
      service +
      "\n",
    { mode: 0o600, flag: "wx" },
  );
  console.log(
    "Generated environment files with unique secrets. No credentials were printed. Run npm run backend:start.",
  );
}
async function waitForApi() {
  const env = readFileSync(envFile, "utf8");
  const key = env.match(/^ANON_KEY=(.+)$/m)?.[1];
  const url = env.match(/^SUPABASE_PUBLIC_URL=(.+)$/m)?.[1];
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const response = await fetch(url + "/auth/v1/health", {
        headers: { apikey: key },
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) return;
    } catch {
      /* Gateway may still be starting. */
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Supabase API did not become ready.");
}
function migrate() {
  const dir = path.join(root, "supabase/migrations");
  for (const file of readdirSync(dir)
    .filter((f) => /^\d+.*\.sql$/.test(f))
    .sort()) {
    const sql = readFileSync(path.join(dir, file), "utf8");
    const hash = createHash("sha256").update(sql).digest("hex");
    const name = file.replaceAll("'", "''");
    const wrapped =
      "BEGIN;\nSELECT pg_advisory_xact_lock(738941);\nCREATE SCHEMA IF NOT EXISTS sonnet_migrations;\nCREATE TABLE IF NOT EXISTS sonnet_migrations.applied(name text primary key, hash text not null);\n" +
      "SELECT EXISTS(SELECT 1 FROM sonnet_migrations.applied WHERE name = '" +
      name +
      "') AS applied \\gset\n\\if :applied\n" +
      "DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM sonnet_migrations.applied WHERE name = '" +
      name +
      "' AND hash = '" +
      hash +
      "') THEN RAISE EXCEPTION 'Applied migration checksum changed'; END IF; END $$;\n" +
      "\\else\n" +
      sql +
      "\nINSERT INTO sonnet_migrations.applied VALUES ('" +
      name +
      "','" +
      hash +
      "');\n\\endif\nCOMMIT;\nNOTIFY pgrst, 'reload schema';\n";
    docker(
      [
        "exec",
        "-T",
        "db",
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-v",
        "ON_ERROR_STOP=1",
      ],
      wrapped,
    );
    console.log("Migration checked: " + file);
  }
}
try {
  const action = process.argv[2];
  if (action === "setup") setup();
  else {
    if (!existsSync(envFile))
      throw new Error("Run npm run backend:setup first.");
    if (action === "start") {
      docker(["up", "-d", "--wait", "--wait-timeout", "180"]);
      migrate();
      await waitForApi();
    } else if (action === "stop") docker(["stop"]);
    else if (action === "migrate") migrate();
    else throw new Error("Expected setup, start, stop, or migrate.");
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
