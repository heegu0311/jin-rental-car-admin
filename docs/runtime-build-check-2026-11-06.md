# 관리자 빌드 오류 수정 (2026-11-06)

## 원인·수정

pnpm build가 PasswordRecoveryForm.tsx의 setSignOutFailed 호출에서 실패했다. 서버 액션의 반환형에 선택 속성이 있어 기존 표현식이 boolean | undefined로 추론되었고 boolean 상태에 전달할 수 없었다.

속성 존재 검사에 이어 result.signOutFailed === true를 비교해 항상 boolean을 전달한다. 로그아웃 실패 안내·서버의 세션/role 검증·RLS·메일 발송 동작은 변경하지 않는다.

## 검증

- pnpm exec tsc --noEmit: 통과.
- pnpm lint: 오류·경고 없음.
- pnpm test: 25개 통과. 기존 비밀번호 복구 테스트가 세션/관리자 권한 거부, 저장 성공·실패, 로그아웃 실패를 확인한다.
- pnpm build: 통과, 정적 페이지 22개 생성.
- 네트워크 제한 실행에서 Google Fonts 다운로드 실패도 발생했다. 네트워크 접근을 허용한 동일 소스 빌드는 통과했다.
- 로컬 3102 /login/forgot-password: 1440px·390px에서 폼 표시, 페이지 예외·가로 넘침 없음. 실제 계정 메일 발송·비밀번호 변경은 하지 않았다.
- 고객 웹은 별도 web 저장소에서 타입·린트·34개 테스트·빌드를 확인했다. 제보된 TimeoutError는 최신 로컬 브라우저 확인에서 재현되지 않았으며 원인은 확정하지 않았다.

현재 main에서 작업했다. 외부 push·배포는 수행하지 않았고 원격 배포 로그는 확인하지 않았다.
