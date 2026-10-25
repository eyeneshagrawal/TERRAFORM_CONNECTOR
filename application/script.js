const rows = document.getElementById("rows");
let tasks = [];

async function api(path, opts) {
  const r = await fetch(path, { headers: { "Content-Type": "application/json" }, ...opts });
  return r.json();
}
async function load() { tasks = await api("/api/tasks"); render(); }

function render() {
  const q = document.getElementById("search").value.toLowerCase();
  const f = document.getElementById("filter").value;
  rows.innerHTML = "";
  tasks.filter(t => t.title.toLowerCase().includes(q) && (!f || t.status === f)).forEach(t => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${t.id}</td><td></td><td class="${t.priority}">${t.priority}</td><td>${t.status}</td><td>${t.createdDate || ""}</td>
      <td><button class="done">${t.status === "Completed" ? "Reopen" : "Complete"}</button> <button class="del">Delete</button></td>`;
    tr.children[1].textContent = t.title;
    tr.querySelector(".done").onclick = async () => {
      await api("/api/tasks/" + t.id, { method: "PUT", body: JSON.stringify({ status: t.status === "Completed" ? "Pending" : "Completed" }) });
      load();
    };
    tr.querySelector(".del").onclick = async () => { await api("/api/tasks/" + t.id, { method: "DELETE" }); load(); };
    rows.appendChild(tr);
  });
  const done = tasks.filter(t => t.status === "Completed").length;
  document.getElementById("stats").textContent = `Total: ${tasks.length} | Completed: ${done} | Pending: ${tasks.length - done}`;
}

document.getElementById("task-form").onsubmit = async (e) => {
  e.preventDefault();
  await api("/api/tasks", { method: "POST", body: JSON.stringify({
    title: document.getElementById("title").value,
    priority: document.getElementById("priority").value,
    status: document.getElementById("status").value }) });
  e.target.reset(); load();
};
document.getElementById("search").oninput = render;
document.getElementById("filter").onchange = render;
load();
