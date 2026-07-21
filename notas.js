// ============================================================
//  notas.js — Anotações rápidas (expiram automaticamente em 48h)
// ============================================================

const NOTAS_KEY = "prescricoes_anotacoes";
const NOTAS_TTL_MS = 48 * 60 * 60 * 1000; // 48 horas

function notasEscape(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Lê as anotações salvas, descarta as expiradas (>48h) e persiste a limpeza
function notasGetAll() {
  let list = [];
  try {
    const raw = localStorage.getItem(NOTAS_KEY);
    list = raw ? JSON.parse(raw) : [];
  } catch (e) { list = []; }

  const now = Date.now();
  const valid = list.filter(n => (now - n.createdAt) < NOTAS_TTL_MS);
  if (valid.length !== list.length) notasSave(valid);
  return valid.sort((a, b) => b.createdAt - a.createdAt);
}

function notasSave(list) {
  try { localStorage.setItem(NOTAS_KEY, JSON.stringify(list)); } catch (e) {}
}

function notasAdd(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) return;
  const list = notasGetAll();
  list.unshift({ id: Date.now().toString(), text: trimmed, createdAt: Date.now() });
  notasSave(list);
}

function notasDelete(id) {
  const list = notasGetAll().filter(n => n.id !== id);
  notasSave(list);
}

function notasHoursLeft(createdAt) {
  const remaining = NOTAS_TTL_MS - (Date.now() - createdAt);
  return Math.max(0, remaining / (60 * 60 * 1000));
}

function openNotas() {
  showScreen("screen-notas");
  renderNotas();
}

function renderNotas() {
  const list = document.getElementById("notas-list");
  if (!list) return;
  const items = notasGetAll();
  if (!items.length) {
    list.innerHTML = `<div class="empty-state">Nenhuma anotação no momento.<br/>Suas anotações somem sozinhas 48h após serem criadas.</div>`;
    return;
  }
  list.innerHTML = items.map(n => {
    const hrs = notasHoursLeft(n.createdAt);
    const label = hrs >= 1 ? `${Math.floor(hrs)}h restantes` : `${Math.max(1, Math.round(hrs * 60))}min restantes`;
    return `
      <div class="nota-card">
        <span class="nota-warning" title="Anotação temporária">⚠</span>
        <button class="nota-delete" onclick="notasDelete('${n.id}'); renderNotas();" title="Excluir agora">✕</button>
        <p class="nota-text">${notasEscape(n.text)}</p>
        <span class="nota-expiry">${label}</span>
      </div>
    `;
  }).join("");
}

function addNotaFromInput() {
  const input = document.getElementById("nota-input");
  if (!input) return;
  notasAdd(input.value);
  input.value = "";
  renderNotas();
}

// Atualiza o contador de tempo restante periodicamente enquanto a tela estiver aberta
setInterval(() => {
  const screen = document.getElementById("screen-notas");
  if (screen && screen.classList.contains("active")) renderNotas();
}, 60000);

window.openNotas = openNotas;
window.renderNotas = renderNotas;
window.addNotaFromInput = addNotaFromInput;
window.notasDelete = notasDelete;
window.notasGetAll = notasGetAll;
