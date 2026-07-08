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

const readJson = async (request) => {
  try {
    return await request.json();
  } catch {
    return {};
  }
};

export class BunbunOrderDurableObject {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    if (request.method === "GET") {
      const order = (await this.state.storage.get(ORDER_KEY)) || null;
      return json({ order, mode: "durable-object" });
    }

    if (request.method === "POST") {
      const payload = await readJson(request);
      const now = new Date().toISOString();
      const order = {
        ...payload,
        id: payload.id || `${Date.now()}`,
        createdAt: payload.createdAt || now,
        updatedAt: now,
      };

      await this.state.storage.put(ORDER_KEY, order);
      return json({ order, mode: "durable-object" });
    }

    if (request.method === "PATCH") {
      const payload = await readJson(request);
      const current = (await this.state.storage.get(ORDER_KEY)) || null;
      if (!current) {
        return json({ order: null, mode: "durable-object" });
      }

      const order = {
        ...current,
        ...payload,
        updatedAt: new Date().toISOString(),
      };

      await this.state.storage.put(ORDER_KEY, order);
      return json({ order, mode: "durable-object" });
    }

    if (request.method === "DELETE") {
      await this.state.storage.delete(ORDER_KEY);
      return json({ order: null, mode: "durable-object" });
    }

    return json({ error: "Method not allowed" }, 405);
  }
}

export default {
  async fetch(request, env) {
    const id = env.BUNBUN_ORDER_DO.idFromName("bunbun-latest-order");
    const stub = env.BUNBUN_ORDER_DO.get(id);
    return stub.fetch(request);
  },
};