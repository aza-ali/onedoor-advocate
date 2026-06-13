# Session logs — One Door (Team: One Door Fully Stacked)

These are the raw Claude Code / Claude.ai session transcripts behind the build, exported as
`.jsonl` (one JSON message per line — the authentic, verifiable record). They are the evidence
for how Claude (Opus 4.8) was orchestrated, how it verified its own work, and how the product
direction was steered by the humans in the loop.

| File | What it is |
|---|---|
| **`build-log-2-build-verification.jsonl`** | **Build + verification — the main session log.** Claude executes the build using the research docs as the spec, builds the deterministic CalFresh eligibility engine, validates it against the oracle, catches and fixes errors, reaches the green check, and then starts the conversational Next.js version. |
| `build-log-1-research-orchestration.jsonl` | Research + orchestration design. How the team used Claude to run a parallel research loop, evaluate ideas against the hackathon rubric, incorporate judge strategy, and write the final build prompt. |
| `planning-chat-product-direction.jsonl` | Product direction + session-log logistics. The human-in-the-loop steering: pushing the app toward a mobile conversational advocate, asking what was missing, and figuring out how to package/export the logs for submission. |

**For judging:** `build-log-2` is the primary session log (it shows the actual build and the
self-verification). `build-log-1` is included as the evidence of the orchestration/research
strategy.

## Reading a `.jsonl` log

Each line is a JSON object (a message). To skim it as text:

```bash
# pretty-print, or extract just the human/assistant text turns:
python3 - logs/build-log-2-build-verification.jsonl <<'PY'
import json, sys
for line in open(sys.argv[1]):
    try: m = json.loads(line)
    except: continue
    role = m.get("type") or m.get("role")
    c = (m.get("message") or {}).get("content") if isinstance(m.get("message"), dict) else m.get("content")
    if isinstance(c, str): text = c
    elif isinstance(c, list): text = " ".join(b.get("text","") for b in c if isinstance(b, dict) and b.get("type")=="text")
    else: text = ""
    if text.strip(): print(f"\n### {role}\n{text}")
PY
```

## Security note

`planning-chat-product-direction.jsonl` was **redacted**: the Anthropic API key that appeared in
that transcript has been replaced with `sk-ant-api03-REDACTED`. All three files were scanned and
contain **no live API keys or tokens**. (The engine + app never embed the key; it is read only on
the server from an environment variable / Secret Manager — see the repo `README.md` security
section.)

Other machine-checkable evidence lives at the repo root: `session_log.md` (the `verify.sh` run),
`trace.jsonl` (the orchestration + self-catch trace, with verifier agent ids distinct from
producer ids), and `EVAL_REPORT.md` (the accuracy report).
