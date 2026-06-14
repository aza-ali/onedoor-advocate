# Deploy · One Door Advocate

Next.js (App Router, TypeScript) app. Deploy target is **Firebase App Hosting**, which builds
the app and serves it on **Cloud Run**. The Anthropic API key is server-only: it comes from
`.env.local` locally and from **Google Secret Manager** on Firebase. It is never in the client
bundle and never in `apphosting.yaml` plaintext.

---

## 1. Run locally

```bash
npm install
```

Ensure `.env.local` (already present; do not commit it, it is gitignored) contains:

```
ANTHROPIC_API_KEY=sk-ant-...        # your key; server-only, never shipped to the browser
ANTHROPIC_MODEL=claude-opus-4-8
```

Then start the dev server and run the gradable check:

```bash
npm run dev          # serves http://localhost:3000
bash verify.sh       # must print <promise>RUBRIC_GREEN</promise>
```

`verify.sh` runs the offline, deterministic Tier-1 suite against the running app. A green run
emits `RUBRIC_GREEN` and exits 0. If it does not, do not deploy.

---

## 2. Deploy to Firebase App Hosting

App Hosting builds from your repo (or a connected GitHub branch) and runs on Cloud Run. The
secret is wired through Secret Manager, never through `apphosting.yaml` plaintext.

### 2a. Create the secret in Google Secret Manager

Paste the key value to stdin so it is never written to disk, shell history, or the repo:

```bash
# Paste the key (sk-ant-...) at the prompt, then press Enter and Ctrl-D.
gcloud secrets create anthropic-api-key --data-file=-
```

If the secret already exists, add a new version instead:

```bash
gcloud secrets versions add anthropic-api-key --data-file=-
```

### 2b. Grant the App Hosting backend service account read access

App Hosting runs as a per-backend service account
(`firebase-app-hosting-compute@<PROJECT_ID>.iam.gserviceaccount.com`). It must be able to read
the secret at runtime. Replace `<PROJECT_ID>` with your GCP project id:

```bash
gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member="serviceAccount:firebase-app-hosting-compute@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

(If your backend uses a different runtime service account, substitute its email. You can confirm
the account in the Firebase console under App Hosting -> your backend -> Settings, or with
`gcloud iam service-accounts list`. The Firebase CLI helper
`firebase apphosting:secrets:grantaccess anthropic-api-key --backend <BACKEND_ID>` does the same
binding if you prefer it.)

### 2c. Initialize and create the backend

```bash
firebase init apphosting              # links the project, detects this directory as the app root
firebase apphosting:backends:create   # creates the backend; or connect a GitHub repo for CI deploys
```

If you connect a GitHub repo, every push to the configured branch triggers a build and deploy.
Otherwise deploy on demand with the create/rollout flow shown by the CLI.

### 2d. How `apphosting.yaml` wires the secret

`apphosting.yaml` (committed in the repo root) declares:

```yaml
env:
  - variable: ANTHROPIC_API_KEY
    secret: anthropic-api-key      # Secret Manager reference, NOT a value
    availability:
      - RUNTIME
  - variable: ANTHROPIC_MODEL
    value: claude-opus-4-8         # non-secret, plaintext is fine
    availability:
      - RUNTIME
```

`secret: anthropic-api-key` tells App Hosting to fetch the latest version of that Secret Manager
secret and inject it into the **Cloud Run runtime environment** at request time. Because its
availability is **RUNTIME only**, the value is absent during the build step, so it cannot be
baked into any compiled output. At runtime `lib/anthropic.ts` reads it via
`process.env.ANTHROPIC_API_KEY` on the server. The browser never sees it.

### 2e. Voice layer (Gemini) secret

Phase-2 adds an optional **voice layer** (speech-to-text and text-to-speech) powered by Gemini.
Voice is **optional**: the text app works fully without it. If you skip this subsection, the app
deploys and runs normally; only the voice features are unavailable. The Gemini key is wired
exactly like `anthropic-api-key`, as a second server-only secret in Secret Manager.

`GEMINI_API_KEY` is **server-only**. Its scope is **STT/TTS only**. It is never placed in the
client bundle and never goes anywhere near the eligibility logic.

Create the secret from `.env.local` without printing the value to the terminal, history, or the
repo. Set `PID` to your GCP project id first:

```bash
PID=<PROJECT_ID>
printf '%s' "$(grep -oE '^GEMINI_API_KEY=.*' .env.local | cut -d= -f2- | tr -d '"'"'"'\r\n')" \
  | gcloud secrets create gemini-api-key --project "$PID" --replication-policy=automatic --data-file=-
```

If the secret already exists, add a new version instead (same no-print pattern):

```bash
printf '%s' "$(grep -oE '^GEMINI_API_KEY=.*' .env.local | cut -d= -f2- | tr -d '"'"'"'\r\n')" \
  | gcloud secrets versions add gemini-api-key --project "$PID" --data-file=-
```

Grant the same App Hosting backend service account read access (the same SA used for
`anthropic-api-key`). Replace `<PROJECT_ID>` with your GCP project id:

```bash
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:firebase-app-hosting-compute@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

`apphosting.yaml` already references `gemini-api-key` as a **RUNTIME** secret (same shape as the
`ANTHROPIC_API_KEY` block above), so once the secret and the IAM binding exist, a git push rolls
it out: App Hosting fetches the latest version and injects it into the Cloud Run runtime
environment only. Because availability is RUNTIME only, the value is absent during the build, so
it cannot be baked into any compiled output. The server reads it via
`process.env.GEMINI_API_KEY` for STT/TTS only; the browser never sees it, and it never touches
the deterministic eligibility path.

---

## 3. The key never leaks (and how to verify)

- The key is **not** in `apphosting.yaml` (only a Secret Manager reference name is).
- The key is **not** in the client bundle: it is read only in `server-only` modules
  (`lib/anthropic.ts` imports `server-only`), so importing it from a client component is a
  build error. It is exposed to the runtime, not the build, so no asset can inline it.
- `.env.local` is gitignored and is never committed.

Verify the built client assets contain no key, after a local build:

```bash
npm run build
grep -rn "sk-ant-" .next/static .next/server/app .next/server/chunks 2>/dev/null || echo "CLEAN: no key in build output"
```

Expect `CLEAN: no key in build output`. (You can also grep the whole `.next` tree; only the
server runtime ever reads the env var, and the value is not present at build time at all.)

---

## 4. Verify after deploy

Set `URL` to your live backend (for example `https://<backend>--<project>.web.app` or the
backend URL printed by the CLI):

```bash
URL=https://<your-backend-url>

# Health check (no key required)
curl -s "$URL/healthz"
# -> {"ok":true,"service":"onedoor-advocate","ruleset":"...","as_of_date":"..."}

# Eligibility screen (deterministic engine; POST a household)
curl -s -X POST "$URL/api/screen" \
  -H "Content-Type: application/json" \
  -d '{"household":{"county":"Los Angeles","household_size":3,"monthly_earned_income":2200},"lang":"en"}'
# -> JSON with program, status, monthly_benefit, citations, engine_provenance, as_of_date, disclaimer
```

A `200` from `/healthz` with `"ok":true`, and a `/api/screen` response carrying an
engine-computed `monthly_benefit` plus `citations`, confirms the deploy is live and the
grounding path is intact.
