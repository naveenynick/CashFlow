const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { fetchSystemSale, jsonResponse } = require("./patanjali-api");

const root = path.join(__dirname, "public");
const port = Number(process.env.PORT) || 8765;
const host = "0.0.0.0";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8"
};

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${host}:${port}`);

  if (url.pathname === "/api/system-sale") {
    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      });
      response.end();
      return;
    }
    try {
      const payload = await fetchSystemSale(url.searchParams.get("store"), url.searchParams.get("date"));
      jsonResponse(response, 200, payload);
    } catch (error) {
      jsonResponse(response, 502, { error: error.message || "Could not fetch system sale." });
    }
    return;
  }

  const cleanPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.normalize(path.join(root, cleanPath));

  if (!filePath.startsWith(root)) {
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

    response.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "text/plain; charset=utf-8" });
    response.end(data);
  });
});

server.listen(port, host, () => {
  console.log(`Daily Cash Flow is running on port ${port}`);
});
