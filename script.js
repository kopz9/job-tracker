const LABELS = {
  enviado: "Enviado",
  rh: "Entrevista RH",
  tecnico: "Técnica",
  final: "Final",
  oferta: "Oferta",
  recusado: "Recusado",
  ghosted: "Ghosted",
  recusado: "Recusado"
};

const PER_PAGE = 5;

let state = { count: 0, entrevistas: [], recusados: [] };
let pages = { entrevistas: 0, recusados: 0 };

function load() {
  const s = localStorage.getItem("jobtracker");
  if (s) state = JSON.parse(s);
  render();
}

function resetCount() {
  if (!confirm("Tem certeza que deseja zerar o contador?")) return;
  state = { count: 0, entrevistas: [], recusados: [] };
  pages = { entrevistas: 0, recusados: 0 };
  save();
  render();
}

function save() {
  localStorage.setItem("jobtracker", JSON.stringify(state));
}

function change(d) {
  state.count = Math.max(0, state.count + d);
  save();
  render();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function addEntry() {
  const name = document.getElementById("input-empresa").value.trim();
  const status = document.getElementById("input-status").value;
  const date = document.getElementById("input-date").value || today();
  if (!name) return alert("Nome nao pode ser vazio!");
  state.entrevistas.push({ id: Date.now(), name, status, date });
  document.getElementById("input-empresa").value = "";
  document.getElementById("input-date").value = today();
  pages.entrevistas = 1;
  save();
  renderList();
}

function addRecusado() {
  const name = document.getElementById("input-rec").value.trim();
  const date = document.getElementById("input-rec-date").value || today();
  if (!name) return alert("Nome nao pode ser vazio!");
  state.recusados.push({ id: Date.now(), name, date });
  document.getElementById("input-rec").value = "";
  document.getElementById("input-rec-date").value = today();
  pages.recusados = 1;
  save();
  renderList();
}

function updateStatus(id, newStatus) {
  const entry = state.entrevistas.find((e) => e.id === id);
  if (entry) {
    entry.status = newStatus;
  }
  save();
  renderList();
}

function removeEntry(id) {
  state.entrevistas = state.entrevistas.filter((e) => e.id !== id);
  const maxPage = Math.max(1, Math.ceil(state.entrevistas.length / PER_PAGE));
  if (pages.entrevistas > maxPage) pages.entrevistas = maxPage;
  save();
  renderList();
}

function removeRecusado(id) {
  state.recusados = state.recusados.filter((e) => e.id !== id);
  const maxPage = Math.max(1, Math.ceil(state.recusados.length / PER_PAGE));
  if (pages.recusados > maxPage) pages.recusados = maxPage;
  save();
  renderList();
}

function paginate(list, page) {
  const start = (page - 1) * PER_PAGE;
  return [...list].reverse().slice(start, start + PER_PAGE);
}

function renderPagination(container, listKey) {
  const total = state[listKey].length;
  const totalPages = Math.ceil(total / PER_PAGE);
  if (totalPages <= 1) return "";
  const cur = pages[listKey];

  const prev = `<button class="pg-btn" ${cur === 1 ? "disabled" : ""} onclick="goPage('${listKey}', ${cur - 1})">‹</button>`;
  const next = `<button class="pg-btn" ${cur === totalPages ? "disabled" : ""} onclick="goPage('${listKey}', ${cur + 1})">›</button>`;
  const info = `<span class="pg-info">${cur} / ${totalPages}</span>`;

  return `<div class="pagination">${prev}${info}${next}</div>`;
}

function goPage(listKey, page) {
  pages[listKey] = page;
  renderList();
}

function renderList() {
  // Entrevistas
  const el = document.getElementById("list-entrevistas");
  const pgE = document.getElementById("pg-entrevistas");

  if (!state.entrevistas.length) {
    el.innerHTML = '<div class="empty">Nenhuma entrevista ainda</div>';
    pgE.innerHTML = "";
  } else {
    const slice = paginate(state.entrevistas, pages.entrevistas);
    el.innerHTML = slice
      .map(
        (e) => `
       <div class="entry">
         <span class="entry-name">${e.name}</span>
        <span class="entry-date">${formatDate(e.date)}</span>
        <select class="status-select ${e.status}" onchange="updateStatus(${e.id}, this.value)">
          ${Object.entries(LABELS)
            .map(
              ([k, v]) =>
                `<option value="${k}" ${e.status === k ? "selected" : ""}>${v}</option>`,
            )
            .join("")}
        </select>
        <button class="btn-del" onclick="removeEntry(${e.id})">✕</button>
      </div>
        `,
      )
      .join("");
    pgE.innerHTML = renderPagination("list-entrevistas", "entrevistas");
  }

  // Recusados
  const er = document.getElementById("list-recusados");
  const pgR = document.getElementById("pg-recusados");

  if (!state.recusados.length) {
    er.innerHTML = '<div class="empty">Nenhuma recusa registrada</div>';
    pgR.innerHTML = "";
  } else {
    const slice = paginate(state.recusados, pages.recusados);
    er.innerHTML = slice
      .map(
        (e) => `
      <div class="entry">
        <span class="entry-name">${e.name}</span>
        <span class="entry-date">${formatDate(e.date)}</span>
        <span class="badge recusado">Recusado</span>
        <button class="btn-del" onclick="removeRecusado(${e.id})">✕</button>
      </div>`,
      )
      .join("");
    pgR.innerHTML = renderPagination("list-recusados", "recusados");
  }
}

function render() {
  document.getElementById("count").textContent = state.count;
  renderList();
}

function switchTab(tab, btn) {
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("panel-entrevistas").style.display =
    tab === "entrevistas" ? "" : "none";
  document.getElementById("panel-recusados").style.display =
    tab === "recusados" ? "" : "none";
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
      state = JSON.parse(ev.target.result);
      save();
      render();
    } catch {
      alert("Arquivo inválido");
    }
  };
  r.readAsText(file);
  e.target.value = "";

  function load() {
    const s = localStroage.getItem("jobtracker");
    if (s) {
      state = {
        count: parsed.count ?? 0,
        entrevistas: parsed.entrevistas ?? [],
        recusados: parsed.recusados ?? [],
      };
    }
    document.getElementById("input-date").value = today();
    document.getElementById("input-rec-date").value = today();
    render();
  }
}

document.addEventListener("DOMContentLoaded", load);
