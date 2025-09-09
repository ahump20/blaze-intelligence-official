export const METRICS = Object.freeze({
  accuracy: 0.946,            // rolling-12mo
  p95LatencyMs: 100,
  uptime90d: 99.9,
  datapoints: 2800000
});

export function injectBadges(el){
  if (!el) return;
  el.innerHTML = `
  <div class="badges">
    <div class="pill"><span>Prediction Accuracy</span><b>${(METRICS.accuracy*100).toFixed(1)}%</b></div>
    <div class="pill"><span>Data Points</span><b>2.8M+</b></div>
    <div class="pill"><span>p95 Analysis Latency</span><b>&lt; 100 ms</b></div>
    <div class="pill"><span>Uptime (90d)</span><b>99.9%</b></div>
  </div>`;
}