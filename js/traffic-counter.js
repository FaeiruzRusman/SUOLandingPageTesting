(() => {
  const el = document.getElementById("suoTrafficCount");
  if (!el) return;

  // Persistent anonymous visit counter for the SUO landing page.
  // One increment per browser tab session; reloads within the same session do not inflate the count.
  const namespace = "selangor-urban-observatory";
  const key = "portal-home";
  const base = "https://abacus.jasoncameron.dev";
  const sessionKey = "suo-portal-home-counted";

  const endpoint = sessionStorage.getItem(sessionKey)
    ? `${base}/get/${namespace}/${key}`
    : `${base}/hit/${namespace}/${key}`;

  const format = value => {
    const n = Number(value);
    return Number.isFinite(n) ? new Intl.NumberFormat("ms-MY").format(n) : "—";
  };

  fetch(endpoint, { method:"GET", mode:"cors", cache:"no-store" })
    .then(r => {
      if (!r.ok) throw new Error("Counter HTTP " + r.status);
      return r.json();
    })
    .then(data => {
      const value = data?.value ?? data?.count ?? data?.data;
      el.textContent = format(value);
      sessionStorage.setItem(sessionKey,"1");
    })
    .catch(() => {
      // Counter failure must never affect the portal.
      el.textContent = "—";
      el.closest(".v7-traffic-counter")?.setAttribute(
        "title",
        "Kiraan kunjungan tidak tersedia buat sementara"
      );
    });
})();