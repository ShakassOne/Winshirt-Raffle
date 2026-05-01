import http from "node:http";
import { adminPage } from "./routes/admin/index.js";
import { healthResponse } from "./routes/public/health.js";

const PORT = Number(process.env.PORT ?? 3000);

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: false }));
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(healthResponse());
    return;
  }

  if (req.method === "GET" && (req.url === "/" || req.url === "/admin")) {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(adminPage());
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ message: "Not found" }));
});

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`WinShirt Raffle app running on port ${PORT}`);
  });
}

export default server;
