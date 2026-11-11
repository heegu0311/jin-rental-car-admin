ALTER TABLE public.reservation_consultation_results
  ADD COLUMN vehicle_options text[];

ALTER TABLE public.reservation_consultation_results
  ADD COLUMN staff_request text NOT NULL DEFAULT ''
  CHECK (length(staff_request) <= 1000);

ALTER TABLE public.reservation_consultation_results
  ADD CONSTRAINT reservation_consultation_vehicle_options_valid
  CHECK (
    cardinality(vehicle_options) <= 12 AND
    vehicle_options <@ ARRAY[
      '열선시트', '열선핸들', '블랙박스', '정품네비', '후방카메라',
      '차선유지보조 기능', '파노라마선루프', '스마트 크루즈컨트롤',
      '통풍시트', '어라운드뷰', 'HUD', '자동문'
    ]::text[]
  );
