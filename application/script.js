const $ = (id) => document.getElementById(id);
let tasks = [];

const ICON = {
  check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>',
  edit: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  del: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>',
  cal: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
};

function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1800);
}
async function api(path, opts) {
  const r = await fetch(path, { headers: { "Content-Type": "application/json" }, ...opts });
  return r.json();
}
const today = () => new Date().toISOString().slice(0, 10);
const isLate = (t) => t.deadline && t.status !== "Completed" && t.deadline < today();
const rank = { High: 0, Medium: 1, Low: 2 };

async function load() { tasks = await api("/api/tasks"); render(); }

function render() {
  const q = $("search").value.toLowerCase(), f = $("filter").value, c = $("fcat").value, s = $("sort").value;
  let shown = tasks.filter((t) => t.title.toLowerCase().includes(q) && (!f || t.status === f) && (!c || t.category === c));
  if (s === "priority") shown.sort((a, b) => rank[a.priority] - rank[b.priority]);
  else if (s === "deadline") shown.sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"));
  else shown.sort((a, b) => parseInt(b.id.slice(1)) - parseInt(a.id.slice(1)));

  const list = $("list"); list.innerHTML = "";
  shown.forEach((t) => {
    const el = document.createElement("div");
    el.className = "task" + (t.status === "Completed" ? " completed" : "");
    el.innerHTML = `<button class="check" title="Toggle status">${t.status === "Completed" ? ICON.check : ""}</button>
      <div class="info"><div class="t"></div><div class="meta">
        <span class="chip">${t.id}</span><span class="chip ${t.priority}">${t.priority}</span>
        <span class="chip">${t.category || "General"}</span><span class="chip">${t.status}</span>
        ${t.deadline ? `<span class="chip ${isLate(t) ? "late" : ""}">${ICON.cal} ${t.deadline}</span>` : ""}
      </div></div>
      <button class="icon edit" title="Edit">${ICON.edit}</button>
      <button class="icon del" title="Delete">${ICON.del}</button>`;
    el.querySelector(".t").textContent = t.title;
    el.querySelector(".check").onclick = () => update(t, { status: t.status === "Completed" ? "Pending" : "Completed" }, "Status updated");
    el.querySelector(".edit").onclick = () => {
      const n = prompt("Edit task title", t.title);
      if (n && n.trim()) update(t, { title: n.trim() }, "Task updated");
    };
    el.querySelector(".del").onclick = async () => {
      tasks = tasks.filter((x) => x.id !== t.id); render();
      await api("/api/tasks/" + t.id, { method: "DELETE" }); toast("Task removed");
    };
    list.appendChild(el);
  });
  $("empty").hidden = shown.length > 0;

  const done = tasks.filter((t) => t.status === "Completed").length;
  $("s-total").textContent = tasks.length;
  $("s-done").textContent = done;
  $("s-pending").textContent = tasks.length - done;
  $("s-late").textContent = tasks.filter(isLate).length;
  $("bar").style.width = tasks.length ? (done / tasks.length) * 100 + "%" : "0";
}

async function update(t, patch, msg) {
  Object.assign(t, patch); render();
  await api("/api/tasks/" + t.id, { method: "PUT", body: JSON.stringify(patch) });
  toast(msg);
}

$("task-form").onsubmit = async (e) => {
  e.preventDefault();
  const created = await api("/api/tasks", { method: "POST", body: JSON.stringify({
    title: $("title").value, priority: $("priority").value, status: $("status").value,
    category: $("category").value, deadline: $("deadline").value }) });
  if (created.id) { tasks.push(created); render(); toast("Task added"); e.target.reset(); }
  else toast(created.error || "Failed to add task");
};
$("clear").onclick = async () => {
  const done = tasks.filter((t) => t.status === "Completed");
  tasks = tasks.filter((t) => t.status !== "Completed"); render();
  for (const t of done) await api("/api/tasks/" + t.id, { method: "DELETE" });
  toast("Cleared " + done.length + " task(s)");
};
["search", "filter", "fcat", "sort"].forEach((id) => ($(id).oninput = render));
load();
