-- 관리자 세션과 기존 RLS를 유지하면서 전체 팝업 순서를 원자적으로 갱신한다.
CREATE OR REPLACE FUNCTION public.reorder_event_popups(event_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'superadmin')
  ) THEN RAISE EXCEPTION 'Administrator required' USING ERRCODE = '42501'; END IF;

  IF event_ids IS NULL OR cardinality(event_ids) NOT BETWEEN 1 AND 10000 OR
    cardinality(event_ids) <> (SELECT count(DISTINCT id) FROM unnest(event_ids) AS t(id))
  THEN RAISE EXCEPTION 'Invalid popup list' USING ERRCODE = '22023'; END IF;

  LOCK TABLE public.events IN SHARE ROW EXCLUSIVE MODE;
  IF cardinality(event_ids) <> (SELECT count(*) FROM public.events WHERE is_popup) OR
    EXISTS (SELECT 1 FROM unnest(event_ids) AS t(id)
      WHERE NOT EXISTS (SELECT 1 FROM public.events e WHERE e.id = t.id AND e.is_popup))
  THEN RAISE EXCEPTION 'Popup list changed; reload before saving' USING ERRCODE = '22023'; END IF;

  UPDATE public.events e SET popup_order = ordered.position - 1
  FROM unnest(event_ids) WITH ORDINALITY AS ordered(id, position)
  WHERE e.id = ordered.id;
END;
$$;
REVOKE ALL ON FUNCTION public.reorder_event_popups(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reorder_event_popups(uuid[]) TO authenticated;
