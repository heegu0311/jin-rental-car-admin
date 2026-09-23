# admin / 32-supabase-image-storage

브랜치: `codex/32-admin-supabase-storage`

## 구현

- `site-assets` 공개 읽기 버킷, 5MB 제한, JPG/PNG/WebP 제한을 추가했다.
- 업로드·목록·수정·삭제는 로그인 사용자 중 `profiles.role`이 `admin` 또는 `superadmin`인 세션만 허용한다.
- 차량·이벤트·페이지 콘텐츠 대표 이미지, 차량/이벤트/공지 TipTap 본문 이미지 업로드가 공용 업로드 함수를 사용한다.
- 업로드 파일은 기능별 경로에 UUID 이름으로 저장하고, 기존 DB 계약의 `image_url`/HTML 이미지 URL에 public URL을 넣는다.
- 기존 `vehicles` 버킷의 파일과 레코드는 그대로 유지한다. 새 업로드는 `site-assets`에 쌓인다.

## 적용

마이그레이션: `supabase/migrations/20260923035455_admin_image_storage.sql`

코드와 migration은 준비됐지만, 이 세션에 진렌트카 Supabase 프로젝트 연결이 없어 원격 DB에는 적용하지 않았다. 해당 프로젝트에서 migration을 적용한 뒤 관리자 화면에서 업로드를 확인해야 한다.

## 검증

- `pnpm exec tsc --noEmit`: 통과
- `pnpm lint`: 오류 없음. 기존 `components/admin/Sidebar.tsx`의 미사용 `Shield` 경고 1건
- `pnpm build`: 통과
- 수동 Storage 업로드 확인: migration 미적용으로 수행하지 않음
