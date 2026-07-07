const fs = require("fs");
const http = require("http");
const path = require("path");

const PORT = Number(process.env.PORT || 5174);
const ROOT = __dirname;
const ORDER_KEY = "latest-order";
let latestOrder = null;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

const sendJson = (response, data, status = 200) => {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(data));
};

const readJsonBody = (request) =>
  new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100000) {
        request.destroy();
        reject(new Error("Request body too large"));
      }
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", reject);
  });

const handleOrderApi = async (request, response) => {
  if (request.method === "GET") {
    sendJson(response, { order: latestOrder, mode: "local-memory", key: ORDER_KEY });
    return;
  }

  if (request.method === "POST") {
    const payload = await readJsonBody(request);
    const now = new Date().toISOString();
    latestOrder = {
      ...payload,
      id: payload.id || `${Date.now()}`,
      createdAt: payload.createdAt || now,
      updatedAt: now,
    };
    sendJson(response, { order: latestOrder, mode: "local-memory" });
    return;
  }

  if (request.method === "PATCH") {
    const payload = await readJsonBody(request);
    latestOrder = latestOrder ? { ...latestOrder, ...payload, updatedAt: new Date().toISOString() } : null;
    sendJson(response, { order: latestOrder, mode: "local-memory" });
    return;
  }

  if (request.method === "DELETE") {
    latestOrder = null;
    sendJson(response, { order: null, mode: "local-memory" });
    return;
  }

  sendJson(response, { error: "Method not allowed" }, 405);
};

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname === "/api/order") {
    try {
      await handleOrderApi(request, response);
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  const requestedPath = decodeURIComponent(url.pathname);
  const relativePath = requestedPath === "/" ? "index.html" : requestedPath.slice(1);
  const filePath = path.normalize(path.join(ROOT, relativePath));
  const relativeToRoot = path.relative(ROOT, filePath);

  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const extension = path.extname(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`笨笨专属接驾已启动：http://localhost:${PORT}`);
});