// ============================================================
//  pacientes.js — Gestão de Pacientes com cronômetro por paciente
//  Dados salvos localmente (localStorage), por dispositivo.
// ============================================================

const PAC_KEY = "prescricoesmed_pacientes";
const PAC_HIST_KEY = "prescricoesmed_pacientes_historico";

let pacTickInterval = null;
let pacOpenMenuId = null;

function pacEscape(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ── Persistência ─────────────────────────────────────────
function pacGetAll() {
  try {
    const raw = localStorage.getItem(PAC_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}
function pacSaveAll(list) {
  try { localStorage.setItem(PAC_KEY, JSON.stringify(list)); } catch (e) {}
}
function pacHistGetAll() {
  try {
    const raw = localStorage.getItem(PAC_HIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}
function pacHistSaveAll(list) {
  try { localStorage.setItem(PAC_HIST_KEY, JSON.stringify(list)); } catch (e) {}
}

// ── Utilidades de tempo ──────────────────────────────────
function pacFormatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = String(Math.floor(s / 3600)).padStart(2, "0");
  const mins = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const secs = String(s % 60).padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
}
function pacElapsedSeconds(p) {
  const running = p.runningSince ? (Date.now() - p.runningSince) / 1000 : 0;
  return (p.accumulated || 0) + running;
}

// ── Navegação ────────────────────────────────────────────
function openPacientes() {
  showScreen("screen-pacientes");
  renderPacientes();
  renderPacHistory();
  if (pacTickInterval) clearInterval(pacTickInterval);
  pacTickInterval = setInterval(pacUpdateTimerDisplays, 1000);
}

// ── Adicionar paciente ───────────────────────────────────
function addPatient() {
  const nameInput = document.getElementById("pac-name");
  const locationInput = document.getElementById("pac-location");
  const medsInput = document.getElementById("pac-meds");
  const pendingInput = document.getElementById("pac-pending");

  const name = nameInput.value.trim();
  if (!name) {
    alert("Por favor, preencha pelo menos o nome do paciente.");
    nameInput.focus();
    return;
  }

  const list = pacGetAll();
  list.unshift({
    id: Date.now().toString(),
    name,
    location: locationInput.value.trim(),
    meds: medsInput.value.trim(),
    pending: pendingInput.value.trim(),
    accumulated: 0,
    runningSince: null,
    createdAt: Date.now()
  });
  pacSaveAll(list);
  renderPacientes();

  nameInput.value = "";
  locationInput.value = "";
  medsInput.value = "";
  pendingInput.value = "";
  nameInput.focus();
}

// ── Edição inline das colunas ────────────────────────────
function pacEditCell(id, field, el) {
  const list = pacGetAll();
  const p = list.find(x => x.id === id);
  if (!p) return;
  p[field] = el.textContent.trim();
  pacSaveAll(list);
}
function pacEditKeydown(ev) {
  if (ev.key === "Enter") {
    ev.preventDefault();
    ev.target.blur();
  }
}

// ── Cronômetro ───────────────────────────────────────────
function pacToggleTimer(id) {
  const list = pacGetAll();
  const p = list.find(x => x.id === id);
  if (!p) return;
  if (p.runningSince) {
    // pausar: consolida o tempo decorrido
    p.accumulated = pacElapsedSeconds(p);
    p.runningSince = null;
  } else {
    p.runningSince = Date.now();
  }
  pacSaveAll(list);
  renderPacientes();
}

function pacResetTimer(id) {
  if (!confirm("Zerar o tempo decorrido deste paciente?")) return;
  const list = pacGetAll();
  const p = list.find(x => x.id === id);
  if (!p) return;
  p.accumulated = 0;
  p.runningSince = p.runningSince ? Date.now() : null;
  pacSaveAll(list);
  renderPacientes();
}

function pacAddTime(id, minutes) {
  const list = pacGetAll();
  const p = list.find(x => x.id === id);
  if (!p) return;
  p.accumulated = (p.accumulated || 0) + minutes * 60;
  pacSaveAll(list);
  pacCloseAddTimeMenu();
  renderPacientes();
}

function pacAddCustomTime(id) {
  const input = document.getElementById(`pac-custom-min-${id}`);
  if (!input) return;
  const minutes = parseFloat(input.value.replace(",", "."));
  if (!minutes || minutes <= 0) {
    input.focus();
    return;
  }
  pacAddTime(id, minutes);
}

function pacToggleAddTimeMenu(id, ev) {
  ev.stopPropagation();
  if (pacOpenMenuId === id) {
    pacCloseAddTimeMenu();
    return;
  }
  pacOpenMenuId = id;
  renderPacientes();
  setTimeout(() => {
    const inp = document.getElementById(`pac-custom-min-${id}`);
    if (inp) inp.focus();
  }, 0);
}
function pacCloseAddTimeMenu() {
  pacOpenMenuId = null;
}
document.addEventListener("click", (ev) => {
  if (pacOpenMenuId !== null && !ev.target.closest(".pac-addtime-menu") && !ev.target.closest(".btn-pac-addtime")) {
    pacCloseAddTimeMenu();
    renderPacientes();
  }
});

// Atualiza somente os displays de tempo (chamado a cada segundo),
// sem re-renderizar a tabela inteira — preserva o foco em edição.
function pacUpdateTimerDisplays() {
  const screen = document.getElementById("screen-pacientes");
  if (!screen || !screen.classList.contains("active")) {
    clearInterval(pacTickInterval);
    pacTickInterval = null;
    return;
  }
  const list = pacGetAll();
  list.forEach(p => {
    const el = document.querySelector(`.pac-timer-display[data-id="${p.id}"]`);
    if (el) el.textContent = pacFormatTime(pacElapsedSeconds(p));
  });
}

// ── Mover para histórico ─────────────────────────────────
function pacDeletePatient(id) {
  const list = pacGetAll();
  const p = list.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`Mover "${p.name}" para o histórico?`)) return;

  const hist = pacHistGetAll();
  hist.unshift({
    name: p.name,
    location: p.location,
    meds: p.meds,
    pending: p.pending,
    totalTime: pacFormatTime(pacElapsedSeconds(p)),
    deletedAt: new Date().toLocaleString("pt-BR")
  });
  pacHistSaveAll(hist);

  pacSaveAll(list.filter(x => x.id !== id));
  renderPacientes();
  renderPacHistory();
}

function clearPatientHistory() {
  if (!confirm("Deseja realmente apagar todo o histórico de pacientes?")) return;
  pacHistSaveAll([]);
  renderPacHistory();
}

// ── Renderização ─────────────────────────────────────────
function pacEditableCell(id, field, value, placeholder) {
  return `<div class="pac-editable" contenteditable="true" spellcheck="false"
      data-placeholder="${pacEscape(placeholder)}"
      onblur="pacEditCell('${id}','${field}',this)"
      onkeydown="pacEditKeydown(event)">${pacEscape(value || "")}</div>`;
}

function renderPacientes() {
  const tbody = document.getElementById("pac-table-body");
  const empty = document.getElementById("pac-empty");
  if (!tbody) return;
  const list = pacGetAll();

  if (!list.length) {
    tbody.innerHTML = "";
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  tbody.innerHTML = list.map(p => {
    const running = !!p.runningSince;
    const elapsed = pacElapsedSeconds(p);
    const menuOpen = pacOpenMenuId === p.id;
    return `
      <tr>
        <td>${pacEditableCell(p.id, "name", p.name, "Nome")}</td>
        <td>${pacEditableCell(p.id, "location", p.location, "Onde está")}</td>
        <td>${pacEditableCell(p.id, "meds", p.meds, "Medicações")}</td>
        <td>${pacEditableCell(p.id, "pending", p.pending, "Pendências")}</td>
        <td class="pac-timer-cell">
          <span class="pac-timer-display${running ? "" : " paused"}" data-id="${p.id}">${pacFormatTime(elapsed)}</span>
        </td>
        <td>
          <div class="pac-actions">
            <button class="pac-btn btn-pac-toggle ${running ? "is-pause" : "is-start"}" onclick="pacToggleTimer('${p.id}')">${running ? "Pausar" : "Iniciar"}</button>
            <button class="pac-btn btn-pac-reset" onclick="pacResetTimer('${p.id}')">Zerar</button>
            <button class="pac-btn btn-pac-addtime" onclick="pacToggleAddTimeMenu('${p.id}', event)">+ Tempo</button>
            ${menuOpen ? `
              <div class="pac-addtime-menu" onclick="event.stopPropagation()">
                <button onclick="pacAddTime('${p.id}', 5)">+ 5 min</button>
                <button onclick="pacAddTime('${p.id}', 15)">+ 15 min</button>
                <button onclick="pacAddTime('${p.id}', 30)">+ 30 min</button>
                <button onclick="pacAddTime('${p.id}', 60)">+ 1 hora</button>
                <div class="pac-addtime-custom">
                  <input type="number" min="1" step="1" id="pac-custom-min-${p.id}" placeholder="min" onkeydown="if(event.key==='Enter'){event.preventDefault();pacAddCustomTime('${p.id}');}" />
                  <button onclick="pacAddCustomTime('${p.id}')">OK</button>
                </div>
              </div>
            ` : ""}
          </div>
        </td>
        <td>
          <button class="pac-btn btn-pac-delete" title="Mover para o histórico" onclick="pacDeletePatient('${p.id}')">🗑️</button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderPacHistory() {
  const tbody = document.getElementById("pac-history-body");
  const empty = document.getElementById("pac-history-empty");
  if (!tbody) return;
  const hist = pacHistGetAll();

  if (!hist.length) {
    tbody.innerHTML = "";
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  tbody.innerHTML = hist.map(h => `
    <tr>
      <td>${pacEscape(h.name)}</td>
      <td>${pacEscape(h.location || "-")}</td>
      <td>${pacEscape(h.meds || "-")}</td>
      <td>${pacEscape(h.pending || "-")}</td>
      <td class="pac-timer-display">${pacEscape(h.totalTime)}</td>
      <td><small>${pacEscape(h.deletedAt)}</small></td>
    </tr>
  `).join("");
}

window.openPacientes = openPacientes;
window.addPatient = addPatient;
window.pacEditCell = pacEditCell;
window.pacEditKeydown = pacEditKeydown;
window.pacToggleTimer = pacToggleTimer;
window.pacResetTimer = pacResetTimer;
window.pacAddTime = pacAddTime;
window.pacAddCustomTime = pacAddCustomTime;
window.pacToggleAddTimeMenu = pacToggleAddTimeMenu;
window.pacDeletePatient = pacDeletePatient;
window.clearPatientHistory = clearPatientHistory;
