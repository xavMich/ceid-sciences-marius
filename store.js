/* Stockage central des commandes Chimsco — utilisé aux pages commande & achats */
(function (global) {
  const STORE = {
    base: "https://mantledb.sh/v2",
    namespace: "chimsco-vetements-2026-f6fa",
    key: "dafb08c26cbcef0c1407a058fb0c51059834c9fac1f92f040af4916639599013",
    /** PIN responsable des achats (changeable dans admin) */
    defaultPin: "achats2026",
    achatsEmail: "xavier@chimsco.be"
  };

  function headers() {
    return {
      "Content-Type": "application/json",
      "X-Mantle-Key": STORE.key,
      Accept: "application/json"
    };
  }

  function url(path) {
    const p = String(path || "").replace(/^\/+/, "");
    return `${STORE.base}/${STORE.namespace}/${p}`;
  }

  async function saveOrder(order) {
    const id = order.id || crypto.randomUUID();
    const payload = { ...order, id, createdAt: order.createdAt || new Date().toISOString() };
    const res = await fetch(url(`orders/${id}`), {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Enregistrement impossible (" + res.status + ")");
    return payload;
  }

  async function listOrders() {
    const res = await fetch(`${STORE.base}/export/${STORE.namespace}`, { headers: headers() });
    if (!res.ok) throw new Error("Lecture impossible (" + res.status + ")");
    const data = await res.json();
    const entries = data.entries || {};
    const orders = Object.keys(entries)
      .filter((k) => k.startsWith("orders/") && k !== "orders")
      .map((k) => entries[k])
      .filter((o) => o && o.id);
    orders.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    return orders;
  }

  async function deleteOrder(id) {
    const res = await fetch(url(`orders/${id}`), { method: "DELETE", headers: headers() });
    if (!res.ok) throw new Error("Suppression impossible (" + res.status + ")");
  }

  function pinHash(pin) {
    // Hash simple non crypto — barre l’accès UI, pas une auth serveur
    let h = 0;
    const s = "chimsco|" + String(pin);
    for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return "p" + (h >>> 0).toString(16);
  }

  function checkPin(pin) {
    const custom = localStorage.getItem("chimsco-achats-pin-hash");
    const expected = custom || pinHash(STORE.defaultPin);
    return pinHash(pin) === expected;
  }

  function setPin(newPin) {
    localStorage.setItem("chimsco-achats-pin-hash", pinHash(newPin));
  }

  global.ChimscoStore = {
    STORE,
    saveOrder,
    listOrders,
    deleteOrder,
    checkPin,
    setPin,
    pinHash
  };
})(window);
