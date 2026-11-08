/** Fixed event names and codes only. Never pass request bodies or provider errors. */
export function operationLog(
  operation: string,
  requestId: string,
  outcome: "success" | "failure",
  code: string,
  startedAt: number,
  details?: Record<string, string | number | boolean | null>,
) {
  const entry = {
    event: "operation",
    app: "admin",
    operation,
    requestId,
    outcome,
    code,
    durationMs: Math.round(performance.now() - startedAt),
    ...(details ? { details } : {}),
  };
  if (outcome === "failure") {
    console.error(JSON.stringify(entry));
  } else {
    console.info(JSON.stringify(entry));
  }
}
