#!/usr/bin/env bash
# VIBEX 머신 부트스트랩.
#
# 새 맥에서 저장소를 clone/pull 한 뒤 한 번 실행하면, 그 머신에만 해당하는
# 값(서명 팀 ID, 기기 토큰)을 자동으로 만들어 준다. 경로는 어떤 것도 묻지
# 않는다 — 모든 경로는 이 스크립트가 있는 체크아웃 위치에서 파생된다.
#
#   bash scripts/setup.sh
#
# 여러 번 실행해도 안전하다(이미 있는 값은 건드리지 않는다).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$ROOT"
echo "체크아웃 위치: $ROOT"

# ── 1. 백엔드 비밀값 ────────────────────────────────────────────────
ENV_FILE="backend/.env"
if [ ! -f "$ENV_FILE" ]; then
  # 파이프 + head 조합은 SIGPIPE 로 pipefail 을 건드린다. 단일 명령으로 뽑는다.
  TOKEN="$(openssl rand -hex 24 2>/dev/null || python3 -c 'import secrets;print(secrets.token_hex(24))')"
  printf 'BRIDGE_DEVICE_TOKEN=%s\n' "$TOKEN" > "$ENV_FILE"
  echo "생성: $ENV_FILE (기기 토큰 새로 발급)"
else
  echo "유지: $ENV_FILE"
fi
# 작업공간 경로는 사람이 적지 않는다. 이 체크아웃 기준으로 매번 다시 쓴다 —
# 저장소를 다른 폴더/다른 맥으로 옮긴 뒤 이 스크립트만 실행하면 알아서 맞는다.
# (.env 는 gitignore 되므로 절대경로가 들어가도 다른 머신에 전파되지 않는다.)
if [ -d "$ROOT/test-projects" ]; then
  WS="$ROOT/test-projects"
  TMP="$(mktemp)"
  grep -v '^BRIDGE_WORKSPACE_ROOT=' "$ENV_FILE" > "$TMP" 2>/dev/null || true
  printf 'BRIDGE_WORKSPACE_ROOT=%s\n' "$WS" >> "$TMP"
  mv "$TMP" "$ENV_FILE"
  echo "설정: BRIDGE_WORKSPACE_ROOT=$WS"
else
  echo "건너뜀: test-projects 폴더가 없어 작업공간을 설정하지 않음"
fi

# ── 2. 백엔드 가상환경 ──────────────────────────────────────────────
if [ ! -x "backend/.venv/bin/python" ]; then
  echo "생성: backend/.venv"
  python3 -m venv backend/.venv
  backend/.venv/bin/pip install --quiet --upgrade pip
  [ -f requirements.txt ] && backend/.venv/bin/pip install --quiet -r requirements.txt
else
  echo "유지: backend/.venv"
fi

# ── 3. iPad 앱 서명 팀 (머신/계정마다 다름) ─────────────────────────
XCCONFIG="ipad-app/Local.xcconfig"
if [ ! -f "$XCCONFIG" ]; then
  TEAM="$(security find-identity -v -p codesigning 2>/dev/null \
    | sed -n 's/.*"Apple Develop.*(\([A-Z0-9]\{10\}\))".*/\1/p' | head -1)"
  if [ -n "$TEAM" ]; then
    printf '// 이 머신 전용 — 커밋하지 않는다 (scripts/setup.sh 가 생성)\nVIBEX_DEVELOPMENT_TEAM = %s\n' "$TEAM" > "$XCCONFIG"
    echo "생성: $XCCONFIG (팀 $TEAM)"
  else
    printf '// 서명 인증서를 찾지 못했습니다.\n// Xcode > Settings > Accounts 에서 Apple ID 로그인 후 이 스크립트를 다시 실행하세요.\nVIBEX_DEVELOPMENT_TEAM =\n' > "$XCCONFIG"
    echo "생성: $XCCONFIG (팀 미검출 — Xcode에 Apple ID 로그인 후 재실행)"
  fi
else
  echo "유지: $XCCONFIG"
fi

# ── 4. Xcode 프로젝트 재생성 ────────────────────────────────────────
if command -v xcodegen >/dev/null 2>&1; then
  (cd ipad-app && xcodegen generate >/dev/null) && echo "생성: ipad-app/Vibex.xcodeproj"
else
  echo "건너뜀: xcodegen 미설치 (brew install xcodegen)"
fi

# ── 5. VS Code 확장 빌드 ────────────────────────────────────────────
if [ -d vibex-extension ] && command -v npx >/dev/null 2>&1; then
  (cd vibex-extension && npx --yes esbuild src/extension.js --bundle --platform=node \
      --format=cjs --external:vscode --outfile=dist/extension.js >/dev/null 2>&1) \
    && echo "빌드: vibex-extension/dist/extension.js" || echo "건너뜀: 확장 빌드 실패"
fi

echo
echo "완료. 백엔드 실행:"
echo "  backend/.venv/bin/python -m uvicorn src.main:app --host 127.0.0.1 --port 8787 --app-dir backend"
