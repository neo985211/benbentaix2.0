const ORDER_KEY = "latest-order";
const DO_OBJECT_NAME = "bunbun-latest-order";

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers,
  });

const getDurableOrder = async (request, env) => {
  if (!env.BUNBUN_ORDER_DO) {
    return null;
  }

  const id = env.BUNBUN_ORDER_DO.idFromName(DO_OBJECT_NAME);
  const stub = env.BUNBUN_ORDER_DO.get(id);
  return stub.fetch(request);
};

const getKvStore = (env) => env.BUNBUN_ORDERS;

const readKvOrder = async (store) => {
  const raw = await store.get(ORDER_KEY, { cacheTtl: 0 });
  return raw ? JSON.parse(raw) : null;
};

const readJson = async (request) => {
  try {
    return await request.json();
  } catch {
    return {};
  }
};

export async function onRequestGet({ request, env }) {
  const durableResponse = await getDurableOrder(request, env);
  if (durableResponse) {
    return durableResponse;
  }

  const store = getKvStore(env);
  if (!store) {
    return json({ order: null, error: "Missing BUNBUN_ORDER_DO Durable Object binding or BUNBUN_ORDERS KV binding" }, 503);
  }

  return json({ order: await readKvOrder(store), mode: "cloudflare-kv" });
}

export async function onRequestPost({ request, env }) {
  const durableResponse = await getDurableOrder(request, env);
  if (durableResponse) {
    return durableResponse;
  }

  const store = getKvStore(env);
  if (!store) {
    return json({ order: null, error: "Missing BUNBUN_ORDER_DO Durable Object binding or BUNBUN_ORDERS KV binding" }, 503);
  }

  const payload = await readJson(request);
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
  const durableResponse = await getDurableOrder(request, env);
  if (durableResponse) {
    return durableResponse;
  }

  const store = getKvStore(env);
  if (!store) {
    return json({ order: null, error: "Missing BUNBUN_ORDER_DO Durable Object binding or BUNBUN_ORDERS KV binding" }, 503);
  }

  const payload = await readJson(request);
  const current = await readKvOrder(store);
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

export async function onRequestDelete({ request, env }) {
  const durableResponse = await getDurableOrder(request, env);
  if (durableResponse) {
    return durableResponse;
  }

  const store = getKvStore(env);
  if (!store) {
    return json({ order: null, error: "Missing BUNBUN_ORDER_DO Durable Object binding or BUNBUN_ORDERS KV binding" }, 503);
  }

  await store.delete(ORDER_KEY);
  return json({ order: null, mode: "cloudflare-kv" });
}