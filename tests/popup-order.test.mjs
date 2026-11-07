import test from "node:test";
import assert from "node:assert/strict";
import { movePopup, parsePopupOrderIds } from "../lib/domain/popup-order.ts";
const ids = [1, 2, 3].map((n) => `00000000-0000-0000-0000-00000000000${n}`);
test("드래그와 위아래 이동은 나머지 순서를 보존하고 원본을 수정하지 않는다", () => {
  const rows = ids.map((id) => ({ id }));
  assert.deepEqual(
    movePopup(rows, ids[0], ids[2]).map((x) => x.id),
    [ids[1], ids[2], ids[0]],
  );
  assert.deepEqual(
    movePopup(rows, ids[2], ids[0]).map((x) => x.id),
    [ids[2], ids[0], ids[1]],
  );
  assert.deepEqual(
    rows.map((x) => x.id),
    ids,
  );
  assert.equal(movePopup(rows, "foreign", ids[0]), rows);
  assert.equal(movePopup(rows, ids[0], ids[0]), rows);
});
test("순서 저장은 UUID 목록·중복·장수 제한을 서버에서 검증한다", () => {
  assert.deepEqual(parsePopupOrderIds(ids), ids);
  for (const value of [
    null,
    {},
    "bad",
    [],
    ["bad"],
    [ids[0], ids[0]],
    [null],
    Array(10001).fill(ids[0]),
  ])
    assert.equal(parsePopupOrderIds(value), null);
});
