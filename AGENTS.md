<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 진렌트카 작업 규칙

ARCHITECTURE.md를 먼저 읽는다. web/admin은 별도 저장소이며 이 폴더 자체는 Git 루트가 아니다.

- 디자인은 Wireframe 네이비·블루. 원본 프레임을 삭제·재배치하지 않는다.
- 공통 기반을 먼저 커밋하고 번호가 같은 web/admin 기능 브랜치를 만든다. 작업 파일은 ARCHITECTURE.md의 소유권 표를 따른다.
- 공통 컴포넌트, 전역 CSS, 루트 layout, contracts, lockfile은 기능별 작업에서 동시에 수정하지 않는다.
- Next.js 16의 현재 node_modules/next/dist/docs 문서를 읽고 비동기 params/cookies 규칙을 따른다.
- 기존 컴포넌트를 재사용하고 any, 가짜 성공 메시지, 예시 운영 데이터, 하드코딩된 통계를 추가하지 않는다.
- Supabase schema/권한 SQL은 admin 소유. 계약을 변경하면 두 저장소의 lib/domain/contracts.ts를 동일하게 갱신한다.
- 관리자 권한은 서버 세션 + profiles.role + RLS에서 확인한다. service-role 키를 공개 번들에 넣지 않는다.
- forms는 서버 입력 검증, 명시적 개인정보 동의, 중복 전송 방지, 실패 복구를 제공한다.
- 새 HTML 출력에는 정제 처리를 적용한다. 업로드와 링크의 프로토콜/형식을 검증한다.
- 고객 정보·환경변수를 출력/커밋하지 않는다. 기존 변경은 덮어쓰지 않는다.
- 각 기능은 테스트/타입/빌드 결과와 변경 내용을 커밋한다. 외부 배포·push는 요청 범위에 따라 구분한다.
