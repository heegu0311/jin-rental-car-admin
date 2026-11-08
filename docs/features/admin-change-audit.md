# 관리자 변경 이력

- 소유 저장소: `admin`
- 마이그레이션: `20261108083001_admin_change_audit.sql`
- 적용 환경/결과: 로컬 파일 작성 완료. 운영 DB 미적용. 연결된 Supabase 계정에 프로젝트 `daerwmqweobyeecbquuh` 실행 권한이 없어 SQL 실행·실제 트리거 검증은 진행하지 못함. 로컬 Docker도 실행 중이지 않음.

`public.admin_change_audit`는 관리자 계정으로 수행한 `vehicles`, `vehicle_categories`, `events`, `notices`, `site_content`, `reservations`, `inquiries`의 INSERT·UPDATE·DELETE를 기록한다. `actor_user_id`는 Supabase Auth 사용자 ID이며, `table_name`, `record_id`, `action`, `changed_fields`, `old_values`, `new_values`를 함께 저장한다. UPDATE에서 허용된 필드에 변화가 없으면 이력을 남기지 않는다.

고객 연락처, 상담·답변 내용, 게시물 HTML, 이미지 주소, 토큰은 복사하지 않는다. 차량 요금·특가·카테고리, 이벤트 제목·기간·노출 상태, 공지 제목·고정 여부·본문 길이, 사이트 콘텐츠 제목·공개 여부·섹션 수, 예약·문의 상태만 보관한다. 읽기 권한은 `profiles.role`이 `admin` 또는 `superadmin`인 세션에만 허용하고, 클라이언트의 직접 쓰기 권한은 없다. 익명 고객 접수는 이 관리자 변경 이력에 넣지 않는다.

운영 적용 후 Supabase SQL Editor에서 계정 이메일과 연결해 조회한다. 조회 화면이나 SQL Editor 접근 권한이 없는 관리자에게는 Auth 사용자 ID만 보인다.

```sql
SELECT a.occurred_at, u.email AS admin_email, a.table_name, a.record_id,
       a.action, a.changed_fields, a.old_values, a.new_values
FROM public.admin_change_audit AS a
LEFT JOIN auth.users AS u ON u.id = a.actor_user_id
ORDER BY a.occurred_at DESC
LIMIT 100;
```

적용 검증: 테스트 환경에서 관리자 계정으로 공지 고정 상태를 변경한 뒤 이력 1건과 `actor_user_id`, 이전·새 값이 맞는지 확인한다. 익명 고객 접수와 일반 사용자 직접 INSERT는 이력에 기록되지 않아야 한다. `anon`과 일반 `authenticated`의 SELECT·INSERT·UPDATE·DELETE가 거부되는지 확인한다. 운영 DB에는 테스트 고객 데이터를 넣지 않는다.
