export async function injectReadiness() {
  try {
    const res = await fetch("/src/data/readiness.json", { cache: "no-store" });
    if (!res.ok) return;
    const { readiness, leverage, ts } = await res.json();
    const elR = document.querySelector("[data-readiness]");
    const elL = document.querySelector("[data-leverage]");
    const elT = document.querySelector("[data-readiness-ts]");
    if (elR) elR.textContent = (readiness*100).toFixed(0) + "%";
    if (elL) elL.textContent = leverage.toFixed(2);
    if (elT) elT.textContent = new Date(ts).toLocaleString();
  } catch (_) {}
}
