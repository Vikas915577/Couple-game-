#!/usr/bin/env bash
set -euo pipefail

BUNDLE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$BUNDLE_DIR/project"
REPO_DIR="${1:-$(pwd)}"
ZIP_IN_REPO="${2:-$REPO_DIR/YaarJam_GitHub_Pages_Fixed_Bundle.zip}"

if [[ ! -f "$PROJECT_DIR/package.json" || ! -f "$PROJECT_DIR/src/main.tsx" || ! -f "$PROJECT_DIR/.github/workflows/deploy.yml" ]]; then
  echo "ERROR: Bundle incomplete: required project files are missing."
  exit 1
fi
if ! git -C "$REPO_DIR" rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "ERROR: The supplied folder is not a Git repository: $REPO_DIR"
  exit 1
fi

REPO_DIR="$(cd "$REPO_DIR" && pwd)"
echo "Installing complete YaarJam V1 source into: $REPO_DIR"
cp -a "$PROJECT_DIR"/. "$REPO_DIR"/

# Remove only the duplicate files from the broken flat upload. The correct
# copies are now under src/, src/lib/, docs/, and supabase/ respectively.
legacy_files=(
  App.tsx catalog.ts catalog.test.ts main.tsx styles.css
  rooms.ts supabase.ts tic-tac-toe.ts tic-tac-toe.test.ts
  tic-tac-toe-online.ts truth-or-dare.ts truth-or-dare.test.ts
  truth-or-dare-online.ts truth-or-dare-online.test.ts vite-env.d.ts
  phase_03_tic_tac_toe.sql phase_05_truth_or_dare.sql phase_05_verification.sql
  schema.sql v1_hardening.sql v1_verification.sql deploy.yml
  APP_IMPORT_FIXES.txt PHONE_STEPS.txt README_HINGLISH.txt apply_fix.py
  PHASE_01_NOTE.md PHASE_02_NOTE.md PHASE_03_NOTE.md PHASE_04_NOTE.md
  PHASE_05_NOTE.md QA_REPORT_V1.md
  YaarJam_V1_Root_Layout_Hotfix.zip
)
for f in "${legacy_files[@]}"; do rm -f "$REPO_DIR/$f"; done
if [[ -n "$ZIP_IN_REPO" ]]; then rm -f "$ZIP_IN_REPO"; fi

cd "$REPO_DIR"
echo
echo "Installing packages (needs network access in Codespaces)..."
npm install --no-audit --no-fund
echo
echo "Running unit tests..."
npm test
echo
echo "Running production build..."
npm run build
echo
echo "Tests and build passed. Committing and pushing to main..."
git add -A
if git diff --cached --quiet; then
  echo "No changes to commit."
else
  git commit -m "Restore YaarJam V1 source structure and Pages deployment"
fi
git push origin HEAD:main

echo
echo "Pushed! Open GitHub Actions, wait for the new workflow run, and make sure it is green."
echo "Then check Settings > Pages > Source = GitHub Actions."
