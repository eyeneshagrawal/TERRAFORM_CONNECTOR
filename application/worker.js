const INDEX_HTML = __INDEX_HTML__;
const STYLE_CSS = __STYLE_CSS__;
const SCRIPT_JS = __SCRIPT_JS__;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

async function nextId(kv) {
  const { keys } = await kv.list({ prefix: "T" });
  const max = keys.reduce((m, k) => Math.max(m, parseInt(k.name.slice(1), 10) || 100), 100);
  return "T" + (max + 1);
}

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

    try {
      if (!id && method === "GET") {
        const { keys } = await env.TASKS_KV.list({ prefix: "T" });
        const tasks = (await Promise.all(keys.map((k) => env.TASKS_KV.get(k.name, "json")))).filter(Boolean);
        tasks.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
        return json(tasks);
      }
      if (!id && method === "POST") {
        const body = await request.json();
        if (!body.title || !String(body.title).trim()) return json({ error: "title is required" }, 400);
        const task = {
          id: await nextId(env.TASKS_KV),
          title: String(body.title).trim(),
          priority: body.priority || "Medium",
          status: body.status || "Pending",
          createdDate: new Date().toISOString().slice(0, 10),
        };
        await env.TASKS_KV.put(task.id, JSON.stringify(task));
        return json(task, 201);
      }
      if (id && method === "GET") {
        const task = await env.TASKS_KV.get(id, "json");
        return task ? json(task) : json({ error: "Task not found" }, 404);
      }
      if (id && method === "PUT") {
        const task = await env.TASKS_KV.get(id, "json");
        if (!task) return json({ error: "Task not found" }, 404);
        const body = await request.json();
        const updated = { ...task, title: body.title ?? task.title, priority: body.priority ?? task.priority, status: body.status ?? task.status };
        await env.TASKS_KV.put(id, JSON.stringify(updated));
        return json(updated);
      }
      if (id && method === "DELETE") {
        const task = await env.TASKS_KV.get(id, "json");
        if (!task) return json({ error: "Task not found" }, 404);
        await env.TASKS_KV.delete(id);
        return json({ message: "Task removed successfully", id });
      }
      return json({ error: "Method not allowed" }, 405);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  },
};
