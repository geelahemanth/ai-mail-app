process.env.OPENAI_API_KEY = "YOUR_OPENAI_API_KEY_HERE";

const { CopilotRuntime, OpenAIAdapter, copilotRuntimeNodeHttpEndpoint } = require("@copilotkit/runtime");
const { createServer } = require("http");

const runtime = new CopilotRuntime();

const handler = copilotRuntimeNodeHttpEndpoint({
  runtime,
  serviceAdapter: new OpenAIAdapter({
    model: "gpt-4o-mini",
  }),
  endpoint: "/copilotkit",
});

const server = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url.startsWith("/copilotkit")) {
    return handler(req, res);
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(4000, () => {
  console.log("CopilotKit runtime running on http://localhost:4000");
});