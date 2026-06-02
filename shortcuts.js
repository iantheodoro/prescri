// ============================================================
//  shortcuts.js — Atalhos de texto clicáveis
// ============================================================

const SHORTCUTS_KEY = "prescricoes_shortcuts";

const DEFAULT_SHORTCUTS = [
  {
    id: "analgesia",
    trigger: "/analgesia",
    label: "💊 Analgesia",
    text: `3) Dipirona 1g ---------------------------------- 20 comprimidos
   Tomar 1 comprimido via oral a cada 6 horas, se necessário, para dor.

   OU

3) Paracetamol 500mg ----------------------------- 20 comprimidos
   Tomar 1 comprimido via oral a cada 6 horas, se necessário, se febre
   (temperatura axilar acima de 37,8°C).`
  },
  {
    id: "antiemetico",
    trigger: "/antiemetico",
    label: "🤢 Antiemético",
    text: `) Metoclopramida 10mg --------------------------- 15 comprimidos
   Tomar 1 comprimido via oral, 30 minutos antes das refeições, por 5 dias.

   OU

) Ondansetrona 4mg ------------------------------ 10 comprimidos
   Tomar 1 comprimido via oral a cada 8 horas, se náuseas ou vômitos.`
  },
  {
    id: "omeprazol",
    trigger: "/omeprazol",
    label: "🛡 Protetor Gástrico",
    text: `) Omeprazol 20mg -------------------------------- 30 comprimidos
   Tomar 1 comprimido via oral em jejum, 30 minutos antes do café da manhã,
   por 30 dias.`
  },
  {
    id: "retorno",
    trigger: "/retorno",
    label: "📅 Orientação de Retorno",
    text: `ORIENTAÇÕES:

Retornar ao Pronto Socorro IMEDIATAMENTE se apresentar:
- Febre acima de 39°C não responsiva à medicação
- Piora progressiva dos sintomas
- Dificuldade para respirar
- Vômitos que impeçam a ingestão dos medicamentos
- Qualquer outro sintoma que cause preocupação

Retorno ambulatorial em: ______ dias.`
  },
  {
    id: "hidratacao",
    trigger: "/hidratacao",
    label: "💧 Hidratação Oral",
    text: `INDICAÇÃO MÉDICA:

) Hidratação oral — mínimo 1,5 litros por dia
   Dar preferência a água, água de coco ou sucos naturais.
   Evitar refrigerantes, bebidas alcoólicas e café em excesso.`
  },
  {
    id: "repouso",
    trigger: "/repouso",
    label: "🛏 Repouso",
    text: `INDICAÇÃO MÉDICA:

) Repouso relativo por ______ dias.
   Evitar esforços físicos intensos.
   Retomar atividades gradualmente conforme melhora dos sintomas.`
  },
  {
    id: "antibiotico",
    trigger: "/antibiotico",
    label: "⚠️ Alerta Antibiótico",
    text: `⚠ ATENÇÃO — USO DE ANTIBIÓTICO:
   Tomar todos os comprimidos até acabar, mesmo que melhore antes.
   Não interromper o tratamento sem orientação médica.
   Em caso de reação alérgica (manchas, inchaço, falta de ar),
   suspender imediatamente e procurar o Pronto Socorro.`
  }
];

function shortcutsGetAll() {
  const stored = localStorage.getItem(SHORTCUTS_KEY);
  if (!stored) {
    localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(DEFAULT_SHORTCUTS));
    return DEFAULT_SHORTCUTS;
  }
  return JSON.parse(stored);
}

function shortcutsSave(list) {
  localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(list));
}

function shortcutsAdd(item) {
  const list = shortcutsGetAll();
  item.id = Date.now().toString();
  list.push(item);
  shortcutsSave(list);
}

function shortcutsUpdate(id, updated) {
  const list = shortcutsGetAll().map(s => s.id === id ? { ...s, ...updated } : s);
  shortcutsSave(list);
}

function shortcutsDelete(id) {
  const list = shortcutsGetAll().filter(s => s.id !== id);
  shortcutsSave(list);
}

// Insere texto na posição atual do cursor no textarea
function insertAtCursor(textarea, text) {
  const start = textarea.selectionStart;
  const end   = textarea.selectionEnd;
  const before = textarea.value.substring(0, start);
  const after  = textarea.value.substring(end);
  // Adiciona quebra de linha antes se não estiver no início
  const prefix = (before.length > 0 && !before.endsWith("\n")) ? "\n\n" : "";
  textarea.value = before + prefix + text + "\n" + after;
  // Posiciona cursor após o texto inserido
  const newPos = start + prefix.length + text.length + 1;
  textarea.selectionStart = textarea.selectionEnd = newPos;
  textarea.focus();
}

// Abre o painel de atalhos ligado a um textarea
let _activeTextarea = null;

function openShortcutPicker(textarea) {
  if (!textarea || textarea.dataset.shortcutPicker !== "manual") {
    closeShortcutPicker();
    return;
  }
  _activeTextarea = textarea;
  const panel = document.getElementById("shortcut-picker");
  renderShortcutPicker();
  panel.classList.add("open");
}

function closeShortcutPicker() {
  const panel = document.getElementById("shortcut-picker");
  if (panel) panel.classList.remove("open");
}

function renderShortcutPicker() {
  const list = document.getElementById("shortcut-picker-list");
  const all  = shortcutsGetAll();
  list.innerHTML = all.map(s => `
    <button class="picker-item" onclick="pickShortcut('${s.id}')">
      <span class="picker-label">${s.label}</span>
      <span class="picker-trigger">${s.trigger}</span>
    </button>
  `).join("");
}

function pickShortcut(id) {
  const s = shortcutsGetAll().find(x => x.id === id);
  if (!s || !_activeTextarea) return;
  insertAtCursor(_activeTextarea, s.text);
  closeShortcutPicker();
}

window.shortcutsGetAll      = shortcutsGetAll;
window.shortcutsSave        = shortcutsSave;
window.shortcutsAdd         = shortcutsAdd;
window.shortcutsUpdate      = shortcutsUpdate;
window.shortcutsDelete      = shortcutsDelete;
window.openShortcutPicker   = openShortcutPicker;
window.closeShortcutPicker  = closeShortcutPicker;
window.renderShortcutPicker = renderShortcutPicker;
window.pickShortcut         = pickShortcut;

closeShortcutPicker();
