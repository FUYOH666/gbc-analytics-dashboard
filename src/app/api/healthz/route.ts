export async function GET() {
  return Response.json({
    status: "ok",
    service: "gbc-analytics-dashboard",
    timestamp: new Date().toISOString(),
  });
}
