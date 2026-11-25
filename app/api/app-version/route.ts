export function GET() {
  return Response.json(
    { buildId: process.env.ADMIN_BUILD_ID },
    { headers: { "Cache-Control": "no-store" } },
  );
}
