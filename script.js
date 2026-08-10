const STAGES = [
  { key: "interview", label: "Interview", desc: "Active loops and take-homes." },
  { key: "offer", label: "Offer", desc: "Final-stage or offer conversations." },
  { key: "rejected", label: "Rejected", desc: "Not moving forward." },
];

const PER_PAGE = 5;
const MAX_NAME_LENGTH = 30;

let state = { count: 0, applications: [] };
let pages = { interview: 1, offer: 1, rejected: 1 };
let draggedId = null;

function load() {
  const s = localStorage.getItem("jobtracker");
  if (s) {
    try {
      const parsed = JSON.parse(s);
      state = {
        count: parsed.count ?? 0,
        applications: parsed.applications ?? [],
      };
    } catch {
      state = { count: 0, applications: [] };
    }
  }
  document.getElementById("input-date").value = today();
  render();
}

function loadBgMode() {
  const mode = localStorage.getItem("jobtracker_bg") || "image";
  document.body.classList.toggle("bg-grey", mode === "grey");
}

function toggleBackground() {
  const isGrey = document.body.classList.toggle("bg-grey");
  localStorage.setItem("jobtracker_bg", isGrey ? "grey" : "image");
}

function save() {
  localStorage.setItem("jobtracker", JSON.stringify(state));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function change(d) {
  state.count = Math.max(0, state.count + d);
  save();
  render();
}

function resetCount() {
  if (!confirm("Tem certeza que deseja zerar o contador?")) return;
  state.count = 0;
  save();
  render();
}

function addApplication() {
  const name = document.getElementById("input-empresa").value.trim();
  const date = document.getElementById("input-date").value || today();
  if (!name) return alert("Nome nao pode ser vazio!");
  if (name.length > MAX_NAME_LENGTH)
    return alert(`Nome muito longo (max ${MAX_NAME_LENGTH} caracteres)!`);
  state.applications.push({
    id: Date.now(),
    name,
    date,
    stage: "interview",
  });
  document.getElementById("input-empresa").value = "";
  document.getElementById("input-date").value = today();
  pages.interview = 1;
  save();
  renderBoard();
}

function removeApplication(id) {
  const app = state.applications.find((a) => a.id === id);
  if (!app) return;
  if (!confirm(`Remover "${app.name}"?`)) return;
  state.applications = state.applications.filter((a) => a.id !== id);
  save();
  renderBoard();
}

function moveApplication(id, newStage) {
  const app = state.applications.find((a) => a.id === id);
  if (!app || app.stage === newStage) return;
  app.stage = newStage;
  pages[newStage] = 1;
  save();
  renderBoard();
}

function getStageApps(stageKey) {
  return state.applications
    .filter((a) => a.stage === stageKey)
    .sort((a, b) => b.id - a.id);
}

function paginate(list, page) {
  const start = (page - 1) * PER_PAGE;
  return list.slice(start, start + PER_PAGE);
}

function goPage(stageKey, page) {
  pages[stageKey] = page;
  renderBoard();
}

function renderPagination(stageKey, total) {
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  if (totalPages <= 1) return "";
  const cur = pages[stageKey];
  const prev = `<button class="pg-btn" ${cur === 1 ? "disabled" : ""} onclick="goPage('${stageKey}', ${cur - 1})">‹</button>`;
  const next = `<button class="pg-btn" ${cur === totalPages ? "disabled" : ""} onclick="goPage('${stageKey}', ${cur + 1})">›</button>`;
  const info = `<span class="pg-info">${cur} / ${totalPages}</span>`;
  return `<div class="pagination">${prev}${info}${next}</div>`;
}

function cardHTML(a) {
  return `
    <div class="kcard" draggable="true" data-id="${a.id}"
      ondragstart="onDragStart(event, ${a.id})">
      <div class="kcard-top">
        <span class="kcard-name">${a.name}</span>
        <button class="btn-del" onclick="removeApplication(${a.id})">✕</button>
      </div>
      <div class="kcard-date">${formatDate(a.date)}</div>
    </div>`;
}

function renderColumn(stage) {
  const all = getStageApps(stage.key);
  const slice = paginate(all, pages[stage.key]);
  const cardsHTML = slice.length
    ? slice.map(cardHTML).join("")
    : `<div class="empty">Drop applications here.</div>`;

  return `
    <div class="column" data-stage="${stage.key}"
      ondragover="onDragOver(event)" ondrop="onDrop(event, '${stage.key}')">
      <div class="column-header">
        <span class="column-title">${stage.label}</span>
        <span class="column-count">${all.length}</span>
      </div>
      <div class="column-desc">${stage.desc}</div>
      <div class="column-list">${cardsHTML}</div>
      ${renderPagination(stage.key, all.length)}
    </div>`;
}

function renderBoard() {
  document.getElementById("board").innerHTML = STAGES.map(renderColumn).join("");
}

function render() {
  document.getElementById("count").textContent = state.count;
  renderBoard();
}

function onDragStart(e, id) {
  draggedId = id;
  e.dataTransfer.setData("text/plain", id);
}
function onDragOver(e) {
  e.preventDefault();
}
function onDrop(e, stageKey) {
  e.preventDefault();
  const id = Number(e.dataTransfer.getData("text/plain")) || draggedId;
  moveApplication(id, stageKey);
  draggedId = null;
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "vagas.json";
  a.click();
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = (ev) => {
    try {
      const parsed = JSON.parse(ev.target.result);
      state = {
        count: parsed.count ?? 0,
        applications: parsed.applications ?? [],
      };
      pages = { interview: 1, offer: 1, rejected: 1 };
      save();
      render();
    } catch {
      alert("Arquivo inválido");
    }
  };
  r.readAsText(file);
  e.target.value = "";
}

document.addEventListener("DOMContentLoaded", () => {
  load();
  loadBgMode();
});