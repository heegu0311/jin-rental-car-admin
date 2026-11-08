/** Fixed event names and codes only. Never pass request bodies or provider errors. */
export function operationLog(
  operation: string,
  requestId: string,
  outcome: "success" | "failure",
  code: string,
  startedAt: number,
) {
  const entry = {
    event: "operation",
    app: "admin",
    operation,
    requestId,
    outcome,
    code,
    durationMs: Math.round(performance.now() - startedAt),
  };
  if (outcome === "failure") {
    console.error(JSON.stringify(entry));
  } else {
    console.info(JSON.stringify(entry));
  }
}
