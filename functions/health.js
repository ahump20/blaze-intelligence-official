export const onRequestGet = async () => {
  try {
    const r = await fetch("https://"+location.host+"/src/data/readiness.json", { cf: { cacheTtl: 0 }});
    const j = await r.json();
    return new Response(JSON.stringify({ status: "healthy", readiness: j.readiness, leverage: j.leverage }), { headers: { "content-type": "application/json" }});
  } catch (e) {
    return new Response(JSON.stringify({ status: "degraded", error: String(e) }), { status: 200, headers: { "content-type": "application/json" }});
  }
};
