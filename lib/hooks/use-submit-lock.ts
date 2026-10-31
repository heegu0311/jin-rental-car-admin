"use client";
import { useCallback, useRef, useState } from "react";

/**
 * 중복 제출 방지. run()은 이미 실행 중이면 무시하고, 끝나면(성공·실패 모두) 잠금을 푼다.
 * busy는 버튼·fieldset 비활성화 표시에, 잠금은 같은 렌더 안의 연속 클릭 차단에 쓴다.
 */
export function useSubmitLock() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (task: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await task();
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }, []);
  return { busy, run };
}
