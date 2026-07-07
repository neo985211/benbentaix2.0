const ORDER_KEY = "latest-order";

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers,
  });

const getStore = (env) => env.BUNBUN_ORDERS;

const readOrder = async (store) => {
  const raw = await store.get(ORDER_KEY);
  return raw ? JSON.parse(raw) : null;
};

export async function onRequestGet({ env }) {
  const store = getStore(env);
  if (!store) {
    return json({ order: null, error: "Missing BUNBUN_ORDERS KV binding" }, 503);
  }

  return json({ order: await readOrder(store), mode: "cloudflare-kv" });
}

export async function onRequestPost({ request, env }) {
  const store = getStore(env);
  if (!store) {
    return json({ order: null, error: "Missing BUNBUN_ORDERS KV binding" }, 503);
  }

  const payload = await request.json();
  const now = new Date().toISOString();
  const order = {
    ...payload,
    id: payload.id || `${Date.now()}`,
    createdAt: payload.createdAt || now,
    updatedAt: now,
  };

  await store.put(ORDER_KEY, JSON.stringify(order));
  return json({ order, mode: "cloudflare-kv" });
}

export async function onRequestPatch({ request, env }) {
  const store = getStore(env);
  if (!store) {
    return json({ order: null, error: "Missing BUNBUN_ORDERS KV binding" }, 503);
  }

  const payload = await request.json();
  const current = await readOrder(store);
  if (!current) {
    return json({ order: null, mode: "cloudflare-kv" });
  }

  const order = {
    ...current,
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  await store.put(ORDER_KEY, JSON.stringify(order));
  return json({ order, mode: "cloudflare-kv" });
}

export async function onRequestDelete({ env }) {
  const store = getStore(env);
  if (!store) {
    return json({ order: null, error: "Missing BUNBUN_ORDERS KV binding" }, 503);
  }

  await store.delete(ORDER_KEY);
  return json({ order: null, mode: "cloudflare-kv" });
}