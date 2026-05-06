      const LABELS = {
        rh: "Entrevista RH",
        tecnico: "Técnica",
        final: "Final",
        oferta: "Oferta",
        recusado: "Recusado",
      };

      let state = { count: 0, entrevistas: [], recusados: [] };

      function load() {
        const s = localStorage.getItem("jobtracker");
        if (s) state = JSON.parse(s);
        render();
      }

      function resetCount() {
        if(!confirm('Tem certeza que deseja zerar o contador?')) return;
        state.count = 0;
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

      function addEntry() {
        const name = document.getElementById("input-empresa").value.trim();
        const status = document.getElementById("input-status").value;
        if (!name) return;
        state.entrevistas.push({ id: Date.now(), name, status });
        document.getElementById("input-empresa").value = "";
        save();
        renderList();
      }

      function addRecusado() {
        const name = document.getElementById("input-rec").value.trim();
        if (!name) return;
        state.recusados.push({ id: Date.now(), name });
        document.getElementById("input-rec").value = "";
        save();
        renderList();
      }

      function removeEntry(id) {
        state.entrevistas = state.entrevistas.filter((e) => e.id !== id);
        save();
        renderList();
      }

      function removeRecusado(id) {
        state.recusados = state.recusados.filter((e) => e.id !== id);
        save();
        renderList();
      }

      function renderList() {
        const el = document.getElementById("list-entrevistas");
        if (!state.entrevistas.length) {
          el.innerHTML = '<div class="empty">Nenhuma entrevista ainda</div>';
        } else
          el.innerHTML = state.entrevistas
            .map(
              (e) => `
      <div class="entry">
        <span class="entry-name">${e.name}</span>
        <span class="badge ${e.status}">${LABELS[e.status]}</span>
        <button class="btn-del" onclick="removeEntry(${e.id})">✕</button>
      </div>`,
            )
            .join("");

        const er = document.getElementById("list-recusados");
        if (!state.recusados.length) {
          er.innerHTML = '<div class="empty">Nenhuma recusa registrada</div>';
        } else
          er.innerHTML = state.recusados
            .map(
              (e) => `
      <div class="entry">
        <span class="entry-name">${e.name}</span>
        <span class="badge recusado">Recusado</span>
        <button class="btn-del" onclick="removeRecusado(${e.id})">✕</button>
      </div>`,
            )
            .join("");
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
      }

      load();