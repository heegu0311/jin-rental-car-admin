-- 기존 이벤트는 0으로 유지해 동일 순서 내 최신 등록순을 보존한다.
ALTER TABLE public.events
  ADD COLUMN popup_order integer NOT NULL DEFAULT 0
  CONSTRAINT events_popup_order_range CHECK (popup_order BETWEEN 0 AND 9999);

COMMENT ON COLUMN public.events.popup_order IS
  '홈 이벤트 팝업 표시 순서. 작은 숫자부터, 동일 순서는 최신 등록순.';
