const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");

const app = require("../server");

let server;
let baseUrl;

before(() => {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(() => {
  return new Promise((resolve) => server.close(resolve));
});

describe("Notification Service", () => {
  it("should return healthy status", async () => {
    const res = await fetch(`${baseUrl}/health`);
    const data = await res.json();
    assert.strictEqual(data.status, "healthy");
  });

  it("should create a notification", async () => {
    const res = await fetch(`${baseUrl}/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Task created", type: "success" }),
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.message, "Task created");
  });

  it("should list notifications", async () => {
    const res = await fetch(`${baseUrl}/notifications`);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    assert.ok(data.length >= 1);
  });

  it("should reject notification without message", async () => {
    const res = await fetch(`${baseUrl}/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "info" }),
    });
    assert.strictEqual(res.status, 400);
  });
});
