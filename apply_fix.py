#!/usr/bin/env python3
"""Apply YaarJam root-layout fix files from this bundle to a repository checkout."""
from pathlib import Path
import sys

bundle = Path(__file__).resolve().parent
repo = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
required = ["App.tsx", "package.json", "index.html", "tsconfig.app.json", "vite.config.ts"]
missing = [name for name in required if not (repo / name).exists()]
if missing:
    raise SystemExit("Repo root not recognized; missing: " + ", ".join(missing))

for name in ["index.html", "tsconfig.app.json", "vite.config.ts"]:
    (repo / name).write_bytes((bundle / name).read_bytes())

workflow_src = bundle / ".github" / "workflows" / "deploy.yml"
workflow_dst = repo / ".github" / "workflows" / "deploy.yml"
workflow_dst.parent.mkdir(parents=True, exist_ok=True)
workflow_dst.write_bytes(workflow_src.read_bytes())

app_path = repo / "App.tsx"
app = app_path.read_text(encoding="utf-8")
for name in ["supabase", "rooms", "tic-tac-toe", "tic-tac-toe-online", "truth-or-dare", "truth-or-dare-online"]:
    app = app.replace(f"from './lib/{name}'", f"from './{name}'")
app_path.write_text(app, encoding="utf-8")

still_wrong = [f"./lib/{name}" for name in ["supabase", "rooms", "tic-tac-toe", "tic-tac-toe-online", "truth-or-dare", "truth-or-dare-online"] if f"from './lib/{name}'" in app]
if still_wrong:
    raise SystemExit("Some import paths were not updated: " + ", ".join(still_wrong))
print("Applied layout fixes. Next run: npm install && npm test && npm run build")
