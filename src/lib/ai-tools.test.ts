import assert from "node:assert/strict";
import test from "node:test";
import { apiTools, toolByName, tools } from "./ai-tools";

test("every tool exposes a JSON schema object to the model", () => {
  for (const tool of apiTools()) {
    assert.equal(tool.input_schema.type, "object", tool.name);
    assert.ok(tool.description.length > 10, tool.name);
  }
  assert.equal(new Set(tools.map((t) => t.name)).size, tools.length);
});

test("only the listed tools can change data", () => {
  const writes = tools.filter((t) => t.write).map((t) => t.name).sort();
  assert.deepEqual(writes, ["adjust_wallet", "approve_purchase", "approve_topup", "close_ticket", "create_package", "reject_purchase", "reject_topup", "reply_ticket", "update_feature", "update_package", "update_site"]);
  // Reads must be GET requests, writes never GET: a write mislabelled as a read would skip the approval card.
  for (const tool of tools) {
    const sample = Object.fromEntries(Object.keys(tool.input.shape).map((k) => [k, k === "direction" ? "credit" : k === "amount" || k.endsWith("price") ? 1 : "x"]));
    const method = tool.request(sample as never).method;
    assert.equal(method === "GET", !tool.write, `${tool.name} is ${method}`);
  }
});

test("ids are url-encoded into the path and arguments map to the API's field names", () => {
  assert.equal(toolByName.get("get_site")!.request({ site_id: "a/b c" } as never).path, "/sites/a%2Fb%20c");
  const req = toolByName.get("update_site")!.request({ site_id: "s1", contract_price: 5, add_features: ["wallet"] } as never);
  assert.deepEqual(JSON.parse(JSON.stringify(req.body)), { contractPrice: 5, addFeatures: ["wallet"] });
});

test("the assistant has no tool for license keys, deletion or payment settings", () => {
  for (const tool of tools) assert.doesNotMatch(tool.name, /key|delete|remove_site|settings|sms|rotate/i, tool.name);
});

test("a tool call with bad arguments is rejected before it runs", () => {
  const parsed = toolByName.get("adjust_wallet")!.input.safeParse({ site_id: "s", direction: "mint", amount: 5, description: "x" });
  assert.equal(parsed.success, false);
});
