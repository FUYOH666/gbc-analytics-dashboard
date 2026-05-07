export async function GET() {
  return Response.json({
    status: "ok",
    service: "retail-crm-analytics-demo",
    timestamp: new Date().toISOString(),
  });
}
