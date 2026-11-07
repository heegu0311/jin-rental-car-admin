import test from "node:test";
import assert from "node:assert/strict";
import { parseEventForm } from "../lib/domain/event-form.ts";
const event = {
  title: " 이벤트 ",
  description: "<p>내용</p>",
  image_url: "",
  start_date: null,
  end_date: null,
  is_active: true,
  is_popup: true,
  popup_order: 0,
};
test("이벤트 수정은 팝업 상태를 유지하고 별도 관리하는 순서를 덮어쓰지 않는다", () => {
  assert.equal(parseEventForm(event).data.is_popup, true);
  assert.equal(parseEventForm(event).data.title, "이벤트");
  assert.equal(
    "popup_order" in parseEventForm({ ...event, popup_order: 9999 }).data,
    false,
  );
});
test("이벤트 저장은 잘못된 ID·주소·기간·공개 상태를 거부한다", () => {
  for (const patch of [
    { id: "invalid" },
    { title: " " },
    { image_url: "javascript:alert(1)" },
    { image_url: "//other.example/image.png" },
    { is_popup: "true" },
    { is_active: 1 },
    { start_date: "2026-02-30T00:00:00.000Z" },
    {
      start_date: "2026-11-07T00:00:00.000Z",
      end_date: "2026-11-06T00:00:00.000Z",
    },
  ])
    assert.equal(parseEventForm({ ...event, ...patch }), null);
  assert.ok(
    parseEventForm({
      ...event,
      id: "01234567-89ab-cdef-0123-456789abcdef",
      image_url: "https://example.com/image.webp",
    }),
  );
});
