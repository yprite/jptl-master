# Pull Request 워크플로우

이 문서는 PR 생성 및 관리 프로세스를 설명합니다.

## PR 생성 규칙

### 필수 규칙
1. **모든 feature/bugfix/docs/refactor/test 브랜치는 작업 완료 시 반드시 PR 생성**
2. PR 생성 없이는 작업을 완료한 것으로 간주하지 않음
3. PR은 기본적으로 `develop` 브랜치로 향함

### 작업 완료 기준
작업 완료 선언 전 다음 항목을 모두 확인:
- [ ] 기능 구현 완료
- [ ] 테스트 작성 및 통과
- [ ] 커버리지 요구사항 충족 (백엔드 80%, 프론트엔드 80%)
- [ ] 모든 변경사항 커밋 및 푸시
- [ ] **Pull Request 생성 완료** ← 필수
- [ ] PR URL 사용자에게 전달

## PR 생성 방법

### 방법 1: 스크립트 사용 (권장)
```bash
./scripts/create_pr.sh
```

### 방법 2: GitHub CLI 직접 사용
```bash
gh pr create \
  --base develop \
  --head <브랜치명> \
  --title "type(scope): subject" \
  --body "작업 설명 및 변경사항"
```

### 방법 3: GitHub 웹 UI
1. GitHub 저장소로 이동
2. "Compare & pull request" 버튼 클릭
3. PR 제목과 본문 작성
4. "Create pull request" 클릭

## PR 제목 형식

커밋 메시지 형식을 따릅니다:
```
type(scope): subject
```

예시:
- `feat(infrastructure): Question Repository 구현`
- `fix(api): 사용자 인증 오류 수정`
- `docs(api): API 문서 업데이트`

## PR 본문 템플릿

```markdown
## 작업 내용

- 작업 1
- 작업 2

## 주요 변경사항

- 변경사항 1
- 변경사항 2

## 테스트 결과

- 테스트 실행: `pytest tests/`
- 커버리지: 93%
- 통과한 테스트: 151개

## 체크리스트

- [ ] 코드 리뷰 완료
- [ ] 테스트 통과
- [ ] 커버리지 요구사항 충족
- [ ] 문서 업데이트 (필요시)
```

## PR 확인

### 이미 PR이 있는지 확인
```bash
gh pr list --head <브랜치명>
```

### PR 상세 정보 확인
```bash
gh pr view <PR번호>
```

## PR 생성 실패 시

1. GitHub CLI 인증 확인: `gh auth status`
2. 브랜치가 원격에 푸시되었는지 확인: `git push -u origin <브랜치명>`
3. 수동으로 PR 생성 (GitHub 웹 UI 사용)

## 참고

- PR 생성 스크립트: `scripts/create_pr.sh`
- PR 규칙: `.cursorrules` 섹션 14-1, 21, 22
- 개발 가이드라인: `DEVELOPMENT_GUIDELINES.md`

