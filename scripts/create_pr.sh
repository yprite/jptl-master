#!/bin/bash
# PR 자동 생성 스크립트
# 사용법: ./scripts/create_pr.sh

set -e

# 현재 브랜치 확인
BRANCH_NAME=$(git branch --show-current)

if [ -z "$BRANCH_NAME" ]; then
    echo "❌ 브랜치를 찾을 수 없습니다."
    exit 1
fi

# develop 브랜치인 경우 PR 생성 불가
if [ "$BRANCH_NAME" = "develop" ] || [ "$BRANCH_NAME" = "main" ]; then
    echo "❌ develop 또는 main 브랜치에서는 PR을 생성할 수 없습니다."
    exit 1
fi

# GitHub CLI 설치 확인
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh)가 설치되어 있지 않습니다."
    echo "설치 방법: brew install gh"
    exit 1
fi

# GitHub CLI 인증 확인
if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI 인증이 필요합니다."
    echo "인증 방법: gh auth login"
    exit 1
fi

# 이미 PR이 있는지 확인
EXISTING_PR=$(gh pr list --head "$BRANCH_NAME" --json number --jq '.[0].number' 2>/dev/null || echo "")
if [ -n "$EXISTING_PR" ]; then
    PR_URL=$(gh pr view "$EXISTING_PR" --json url --jq '.url')
    echo "ℹ️  이미 PR이 존재합니다: $PR_URL"
    exit 0
fi

# 마지막 커밋 메시지 가져오기
LAST_COMMIT_MSG=$(git log -1 --pretty=%B)
PR_TITLE=$(echo "$LAST_COMMIT_MSG" | head -n 1)

# 커밋 목록 가져오기 (develop과의 차이)
COMMITS=$(git log origin/develop..HEAD --oneline 2>/dev/null || git log --oneline -5)

# 변경된 파일 목록
CHANGED_FILES=$(git diff origin/develop...HEAD --stat 2>/dev/null || git diff --stat HEAD~1..HEAD)

# PR 본문 생성
PR_BODY="## 작업 내용

$(echo "$COMMITS" | sed 's/^/- /')

## 주요 변경사항

\`\`\`
$CHANGED_FILES
\`\`\`

## 테스트 결과

- 테스트 실행: \`pytest tests/\`
- 커버리지: 확인 필요

## 체크리스트

- [ ] 코드 리뷰 완료
- [ ] 테스트 통과
- [ ] 커버리지 요구사항 충족
- [ ] 문서 업데이트 (필요시)"

# PR 생성
echo "📝 PR 생성 중..."
PR_OUTPUT=$(gh pr create \
  --base develop \
  --head "$BRANCH_NAME" \
  --title "$PR_TITLE" \
  --body "$PR_BODY" 2>&1)

if [ $? -eq 0 ]; then
    echo "✅ PR 생성 완료!"
    echo "$PR_OUTPUT"
    # URL 추출 (출력에서 URL 찾기)
    PR_URL=$(echo "$PR_OUTPUT" | grep -o 'https://github.com/[^ ]*' | head -1)
    if [ -n "$PR_URL" ]; then
        echo "🔗 PR URL: $PR_URL"
    fi
    exit 0
else
    echo "❌ PR 생성 실패"
    echo "$PR_OUTPUT"
    exit 1
fi

