const INDEX_HTML = __INDEX_HTML__;
const STYLE_CSS = __STYLE_CSS__;
const SCRIPT_JS = __SCRIPT_JS__;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// KV list() is eventually consistent, so we keep our own index key (get/put are read-your-writes).
async function getIndex(kv) {
  const idx = await kv.get("_index", "json");
  if (idx) return idx;
  const { keys } = await kv.list({ prefix: "T" });
  return keys.map((k) => k.name);
}
const saveIndex = (kv, ids) => kv.put("_index", JSON.stringify(ids));
const num = (id) => parseInt(id.slice(1), 10) || 100;

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    const method = request.method;

    if (method === "GET" && (path === "/" || path === "/index.html"))
      return new Response(INDEX_HTML.replaceAll("{{APP_TITLE}}", env.APP_TITLE || "Student Task Manager"),
        { headers: { "Content-Type": "text/html; charset=utf-8" } });
    if (method === "GET" && path === "/style.css")
      return new Response(STYLE_CSS, { headers: { "Content-Type": "text/css" } });
    if (method === "GET" && path === "/script.js")
      return new Response(SCRIPT_JS, { headers: { "Content-Type": "application/javascript" } });

    const m = path.match(/^\/api\/tasks(?:\/([A-Za-z0-9_-]+))?\/?$/);
    if (!m) return json({ error: "Not found" }, 404);
    const id = m[1];
    const kv = env.TASKS_KV;

    try {
      if (!id && method === "GET") {
        const ids = await getIndex(kv);
        const tasks = (await Promise.all(ids.map((i) => kv.get(i, "json")))).filter(Boolean);
        tasks.sort((a, b) => num(a.id) - num(b.id));
        return json(tasks);
      }
      if (!id && method === "POST") {
        const body = await request.json();
        if (!body.title || !String(body.title).trim()) return json({ error: "title is required" }, 400);
        const ids = await getIndex(kv);
        const task = {
          id: "T" + (ids.reduce((mx, i) => Math.max(mx, num(i)), 100) + 1),
          title: String(body.title).trim(),
          priority: body.priority || "Medium",
          status: body.status || "Pending",
          category: body.category || "General",
          deadline: body.deadline || "",
          createdDate: new Date().toISOString().slice(0, 10),
        };
        await kv.put(task.id, JSON.stringify(task));
        await saveIndex(kv, [...ids, task.id]);
        return json(task, 201);
      }
      if (id && method === "GET") {
        const task = await kv.get(id, "json");
        return task ? json(task) : json({ error: "Task not found" }, 404);
      }
      if (id && method === "PUT") {
        const task = await kv.get(id, "json");
        if (!task) return json({ error: "Task not found" }, 404);
        const b = await request.json();
        const updated = { ...task };
        for (const f of ["title", "priority", "status", "category", "deadline"]) if (b[f] !== undefined) updated[f] = b[f];
        await kv.put(id, JSON.stringify(updated));
        return json(updated);
      }
      if (id && method === "DELETE") {
        const task = await kv.get(id, "json");
        if (!task) return json({ error: "Task not found" }, 404);
        await kv.delete(id);
        await saveIndex(kv, (await getIndex(kv)).filter((i) => i !== id));
        return json({ message: "Task removed successfully", id });
      }
      return json({ error: "Method not allowed" }, 405);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  },
};
