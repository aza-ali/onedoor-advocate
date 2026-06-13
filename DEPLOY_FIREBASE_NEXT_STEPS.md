# Firebase deploy — READY (only the browser connect remains)

Everything scriptable is DONE for project **`onedoor-advocate`**:
- ✅ Project created + **Blaze billing linked** (freed a slot by unlinking `strovu` from billing — strovu is intact and recoverable)
- ✅ APIs enabled: App Hosting, Cloud Run, Cloud Build, Secret Manager, Developer Connect, Artifact Registry
- ✅ Secret **`anthropic-api-key`** created in Secret Manager (version 1, value never printed; length verified = 108)
- ✅ `apphosting.yaml` references it correctly; GitHub repo `aza-ali/onedoor-advocate` is ready

## The ONE step left (needs your browser, one time)
```bash
firebase apphosting:backends:create --project onedoor-advocate
```
In the flow: pick a region (e.g. `us-central1`), connect the GitHub repo **aza-ali/onedoor-advocate** on branch **main** via Developer Connect (browser OAuth), and let it do the first rollout.

## After the backend exists, run (I can do these for you):
```bash
# grant the backend's service account read access to the secret
gcloud secrets add-iam-policy-binding anthropic-api-key --project onedoor-advocate \
  --member="serviceAccount:firebase-app-hosting-compute@onedoor-advocate.iam.gserviceaccount.com" \
  --role=roles/secretmanager.secretAccessor
# future deploys: just `git push origin main`. Verify:  curl https://<backend-url>/healthz
```

---

# Firebase deploy — CURRENT STATUS (updated)

## Done automatically
- ✅ Dedicated Firebase project created: **`onedoor-advocate`** (console: https://console.firebase.google.com/project/onedoor-advocate/overview)
- ✅ GitHub repo pushed + ready: **aza-ali/onedoor-advocate** (private, branch `main`)
- ✅ `apphosting.yaml` verified (key is a Secret Manager reference, RUNTIME, not plaintext)

## Blocked on ONE thing: billing quota
App Hosting needs the **Blaze** plan, but your only OPEN billing account
`01AA17-DF3664-9977E1` is **at its project quota** (already billing 5 projects:
soya-499205, workspaceapihelper, intentional-app-faebe, strovu, github-growth-bot).
Linking billing to `onedoor-advocate` returns `Cloud billing quota exceeded`, so the
APIs can't enable yet. (The other 2 billing accounts are closed.)

### Pick ONE to unblock, then run "Resume" below:
- **A. Free a slot** (fastest): unlink billing from an unused project, e.g.
  `gcloud billing projects unlink strovu`   (or soya-499205 / github-growth-bot — YOUR call; only if that project is not live)
- **B. Raise the quota**: request an increase at
  https://support.google.com/code/contact/billing_quota_increase (takes a bit)
- **C. Reuse an already-billed project** instead of the dedicated one (e.g. set PROJECT_ID=intentional-app-faebe), at the cost of mixing products.

## Resume (after a billing slot is free) — I can run steps 1-3 for you, you do step 4
```bash
PID=onedoor-advocate
gcloud billing projects link $PID --billing-account=01AA17-DF3664-9977E1
# 1) enable APIs
gcloud services enable firebaseapphosting.googleapis.com run.googleapis.com cloudbuild.googleapis.com \
  secretmanager.googleapis.com developerconnect.googleapis.com artifactregistry.googleapis.com --project $PID
# 2) create the secret from .env.local WITHOUT printing it
printf '%s' "$(grep -oE '^ANTHROPIC_API_KEY=.*' .env.local | cut -d= -f2- | tr -d '\"'\''\r\n')" \
  | gcloud secrets create anthropic-api-key --project $PID --replication-policy=automatic --data-file=-
# 3) (browser, one time) connect the GitHub repo + create the backend:
firebase apphosting:backends:create --project $PID
#    -> choose region, connect aza-ali/onedoor-advocate @ main via Developer Connect
# 4) grant the backend service account access to the secret (SA exists only after step 3):
gcloud secrets add-iam-policy-binding anthropic-api-key --project $PID \
  --member="serviceAccount:firebase-app-hosting-compute@$PID.iam.gserviceaccount.com" \
  --role=roles/secretmanager.secretAccessor
# then: git push origin main  -> triggers the rollout. Verify: curl https://<backend-url>/healthz
```

---

# Deploy to Firebase App Hosting — remaining steps (user handoff)

**Status at handoff (2026-06-13):** The automated, non-interactive setup could **not** safely
pick a target Firebase project, because **no existing Firebase project is dedicated to One Door
Advocate**, and the only "spare" project (`workspaceapihelper`) is your Google Workspace API
helper, not an app host. The remaining work below requires either creating a project or making a
choice only you can make, plus a browser OAuth step (Developer Connect) that cannot run headless.

Everything that is safe to verify ahead of time has been verified:

- `apphosting.yaml` is correct: `ANTHROPIC_API_KEY` is a **Secret Manager reference**
  (`secret: anthropic-api-key`, `availability: RUNTIME`), not a plaintext value;
  `ANTHROPIC_MODEL=claude-opus-4-8` is plaintext. No change needed.
- `.env.local` contains a real `ANTHROPIC_API_KEY` (108 chars, `sk-ant-` prefix). **Its value was
  never printed, echoed, or logged by the automation.**
- GitHub repo `aza-ali/onedoor-advocate` exists and is this directory's `origin` remote, branch
  `main`. App Hosting can connect to it for push-to-deploy.
- An OPEN billing account exists (`01AA17-DF3664-9977E1`), so the Blaze plan App Hosting needs is
  available.
- Logged in: `firebase` and `gcloud` both as `aza.a.ali@gmail.com`.

You do **not** have to use the same project for everything; just pick one app project and use its
id consistently as `PROJECT_ID` below.

---

## Existing projects (for reference)

Firebase projects on this account: `blend-pixel`, `feedbackflow-f3394`, `intentional-app-faebe`,
`kovamotion-com`, `portfolio-site-aza`, `retina-video-editor`. Each belongs to a **different
product**. None is for One Door Advocate. `workspaceapihelper` is your Workspace API helper and
should **not** host this public app.

**Recommendation: create a new, dedicated project** so this app's Cloud Run, Secret Manager, and
billing are isolated. Steps below assume that. If you'd rather reuse one of the above, skip step 0
and set `PROJECT_ID` to that project's id.

---

## Step 0 — Create a dedicated Firebase project (recommended)

```bash
# Creates a GCP project AND adds Firebase resources. Choose a globally-unique id.
firebase projects:create onedoor-advocate --display-name "One Door Advocate"
# If "onedoor-advocate" is taken, append a suffix, e.g. onedoor-advocate-app.

export PROJECT_ID=onedoor-advocate     # <-- set to whatever id you actually created/chose
```

App Hosting requires the **Blaze (pay-as-you-go)** plan. Attach billing (one-time, in console):
- https://console.firebase.google.com/project/onedoor-advocate/usage/details
  → "Modify plan" → Blaze → pick billing account `01AA17-DF3664-9977E1`.
  (Or via gcloud: `gcloud billing projects link $PROJECT_ID --billing-account=01AA17-DF3664-9977E1`)

---

## Step 1 — Enable the required APIs (non-interactive, ~1–2 min)

```bash
gcloud services enable \
  firebaseapphosting.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  developerconnect.googleapis.com \
  artifactregistry.googleapis.com \
  --project "$PROJECT_ID"
```

---

## Step 2 — Create the Secret Manager secret (does NOT print the key)

The key is piped from `.env.local` straight to `gcloud` via stdin, so it never lands in shell
history, a variable, or the terminal. Run from the repo root
(`/Users/azaali/CascadeProjects/hackathon/onedoor`).

```bash
cd /Users/azaali/CascadeProjects/hackathon/onedoor

# Create it (first time):
grep -E '^ANTHROPIC_API_KEY=' .env.local | head -1 | cut -d= -f2- | tr -d '\r\n' \
  | gcloud secrets create anthropic-api-key \
      --project "$PROJECT_ID" --replication-policy=automatic --data-file=-

# If it already exists, add a new version instead:
grep -E '^ANTHROPIC_API_KEY=' .env.local | head -1 | cut -d= -f2- | tr -d '\r\n' \
  | gcloud secrets versions add anthropic-api-key --project "$PROJECT_ID" --data-file=-

# Verify (this prints metadata only, never the value):
gcloud secrets describe anthropic-api-key --project "$PROJECT_ID"
```

> `cut -d= -f2-` takes everything after the first `=` (the raw key, which has no surrounding
> quotes); `tr -d '\r\n'` strips any trailing newline / CR so the stored secret is exactly the
> key. Validated against this repo's `.env.local`: yields a 108-char `sk-ant-` value.

---

## Step 3 — Create the App Hosting backend (INTERACTIVE — browser OAuth)

This is the step that cannot be automated. It opens a browser for **Developer Connect** OAuth to
authorize Firebase to read your GitHub repo, and asks you to pick a region and the repo/branch.

```bash
firebase apphosting:backends:create --project "$PROJECT_ID"
```

When prompted:
- **Region:** pick one close to your users, e.g. `us-central1` (Iowa) or `us-west1` (Oregon).
- **Connect a GitHub repository** → authorize Developer Connect in the browser → choose
  **`aza-ali/onedoor-advocate`** → branch **`main`** → root directory **`/`** (repo root; the
  `apphosting.yaml` lives there).
- Give the backend an id, e.g. **`onedoor`**.

The CLI links this directory's project (writes `.firebaserc`). After creation, every push to
`main` triggers a Cloud Build → Cloud Run rollout automatically.

> Non-interactive alternative (only works once a Developer Connect GitHub link already exists in
> the project, so generally **not** usable on the very first run):
> `firebase apphosting:backends:create --project "$PROJECT_ID" --backend onedoor \
>   --primary-region us-central1 --non-interactive` (still needs `--app <webAppId>` and a
> pre-existing repo connection). Use the interactive form above for the first deploy.

---

## Step 4 — Grant the backend service account read access to the secret

The backend's runtime service account exists **only after step 3** completes. Default account:
`firebase-app-hosting-compute@$PROJECT_ID.iam.gserviceaccount.com`. Confirm the exact email in the
Firebase console (App Hosting → your backend → Settings) or with
`gcloud iam service-accounts list --project "$PROJECT_ID"`.

```bash
gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member="serviceAccount:firebase-app-hosting-compute@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project "$PROJECT_ID"
```

Equivalent Firebase CLI helper (does the same binding, and auto-detects the SA):

```bash
firebase apphosting:secrets:grantaccess anthropic-api-key --backend onedoor --project "$PROJECT_ID"
```

---

## Step 5 — Trigger / confirm the first rollout

Backend creation kicks off the first build from the connected branch. To deploy a new version
afterward, just push:

```bash
git push origin main      # push-to-deploy: triggers Cloud Build → Cloud Run rollout
```

Watch progress in the console:
- https://console.firebase.google.com/project/PROJECT_ID/apphosting
  (replace `PROJECT_ID`; the live URL is shown there once the rollout is `DEPLOYED`).

List backends / rollouts from the CLI:

```bash
firebase apphosting:backends:list --project "$PROJECT_ID"
firebase apphosting:rollouts:list --backend onedoor --project "$PROJECT_ID"
```

---

## Step 6 — Verify the live deploy

```bash
URL=https://<your-backend-url>      # from the console or backends:list

curl -s "$URL/healthz"
# -> {"ok":true,"service":"onedoor-advocate",...}

curl -s -X POST "$URL/api/screen" -H "Content-Type: application/json" \
  -d '{"household":{"county":"Los Angeles","household_size":3,"monthly_earned_income":2200},"lang":"en"}'
# -> JSON with monthly_benefit, citations, engine_provenance, as_of_date, disclaimer
```

A `200`/`"ok":true` from `/healthz` and an engine-computed `monthly_benefit` with `citations` from
`/api/screen` confirm the deploy is live and the grounding path is intact.

---

## Firebase console quick links (replace PROJECT_ID)

- App Hosting: https://console.firebase.google.com/project/PROJECT_ID/apphosting
- Secret Manager: https://console.cloud.google.com/security/secret-manager?project=PROJECT_ID
- Billing/plan: https://console.firebase.google.com/project/PROJECT_ID/usage/details
