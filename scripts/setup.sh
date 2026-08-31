#!/usr/bin/env bash
# Vibex iPad 앱 로컬 개발 환경 설정
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
IPAD_DIR="$ROOT/ipad-app"
XCCONFIG="$IPAD_DIR/Local.xcconfig"

if [ ! -d "$IPAD_DIR" ]; then
  echo "오류: $IPAD_DIR 폴더가 없습니다."
  echo "Vibex 저장소의 scripts/setup.sh로 실행했는지 확인하세요."
  exit 1
fi

echo "Vibex iPad 앱 경로: $IPAD_DIR"

# Apple Development 인증서에서 Team ID 검색
TEAM="$(
  security find-identity -v -p codesigning 2>/dev/null |
    sed -n 's/.*"Apple Develop.*(\([A-Z0-9]\{10\}\))".*/\1/p' |
    head -1 || true
)"

if [ -n "$TEAM" ]; then
  printf '%s\n%s\n' \
    '// 이 머신 전용 설정 — Git에 커밋하지 않는다.' \
    "VIBEX_DEVELOPMENT_TEAM = $TEAM" > "$XCCONFIG"

  echo "설정 완료: Apple Development Team ID = $TEAM"
else
  printf '%s\n%s\n' \
    '// Xcode에서 Apple ID 로그인 후 Team ID를 설정하세요.' \
    'VIBEX_DEVELOPMENT_TEAM =' > "$XCCONFIG"

  echo "주의: Apple Development 인증서를 찾지 못했습니다."
  echo "Xcode > Settings > Accounts에서 Apple ID에 로그인하세요."
  echo "로그인 후 이 스크립트를 다시 실행하세요."
fi

# XcodeGen이 있으면 현재 기기의 설정을 반영하여 프로젝트를 재생성
if [ -f "$IPAD_DIR/project.yml" ]; then
  if command -v xcodegen >/dev/null 2>&1; then
    (
      cd "$IPAD_DIR"
      xcodegen generate
    )
    echo "생성 완료: $IPAD_DIR/Vibex.xcodeproj"
  else
    echo "안내: xcodegen이 설치되어 있지 않아 프로젝트 재생성을 건너뜁니다."
    echo "필요하면 설치: brew install xcodegen"
  fi
else
  echo "주의: $IPAD_DIR/project.yml 파일이 없습니다."
fi

echo
echo "iPad 앱 설정이 완료되었습니다."
echo "Xcode 프로젝트: $IPAD_DIR/Vibex.xcodeproj"
open "$IPAD_DIR/Vibex.xcodeproj"