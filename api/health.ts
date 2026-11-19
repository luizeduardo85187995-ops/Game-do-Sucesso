// Public liveness probe: no configuration details (database ids, providers, secrets status) are exposed.
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
}
