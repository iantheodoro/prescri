// ============================================================
//  shortcuts.js — Sistema de atalhos de texto (/comando)
// ============================================================

const SHORTCUTS_KEY = "prescricoes_shortcuts";

const DEFAULT_SHORTCUTS = [
  {
    id: "analgesia",
    trigger: "/analgesia",
    label: "Analgesia",
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
    label: "Antiemético",
    text: `) Metoclopramida 10mg --------------------------- 15 comprimidos
   Tomar 1 comprimido via oral, 30 minutos antes das refeições, por 5 dias.

   OU

) Ondansetrona 4mg ------------------------------ 10 comprimidos
   Tomar 1 comprimido via oral a cada 8 horas, se náuseas ou vômitos.`
  },
  {
    id: "omeprazol",
    trigger: "/omeprazol",
    label: "Protetor Gástrico",
    text: `) Omeprazol 20mg -------------------------------- 30 comprimidos
   Tomar 1 comprimido via oral em jejum, 30 minutos antes do café da manhã,
   por 30 dias.`
  },
  {
    id: "retorno",
    trigger: "/retorno",
    label: "Orientação de Retorno",
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
    label: "Hidratação Oral",
    text: `INDICAÇÃO MÉDICA:

) Hidratação oral — mínimo 1,5 litros por dia
   Dar preferência a água, água de coco ou sucos naturais.
   Evitar refrigerantes, bebidas alcoólicas e café em excesso.`
  },
  {
    id: "repouso",
    trigger: "/repouso",
    label: "Repouso",
    text: `INDICAÇÃO MÉDICA:

) Repouso relativo por ______ dias.
   Evitar esforços físicos intensos.
   Retomar atividades gradualmente conforme melhora dos sintomas.`
  },
  {
    id: "antibiotico",
    trigger: "/antibiotico",
    label: "Alerta Antibiótico",
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

// Aplicar atalho em um textarea
function applyShortcuts(textarea) {
  const shortcuts = shortcutsGetAll();
  let val = textarea.value;
  let changed = false;

  shortcuts.forEach(s => {
    if (val.includes(s.trigger)) {
      val = val.replace(s.trigger, s.text);
      changed = true;
    }
  });

  if (changed) {
    textarea.value = val;
    // Mover cursor para o fim
    textarea.selectionStart = textarea.selectionEnd = val.length;
  }
  return changed;
}

// Detectar /comando sendo digitado e mostrar sugestão
function detectShortcutSuggestion(textarea, suggestionEl) {
  const val = textarea.value;
  const cursorPos = textarea.selectionStart;
  const textBeforeCursor = val.substring(0, cursorPos);
  const match = textBeforeCursor.match(/\/\w*$/);

  if (!match) {
    suggestionEl.style.display = "none";
    return;
  }

  const typed = match[0].toLowerCase();
  const shortcuts = shortcutsGetAll();
  const matches = shortcuts.filter(s => s.trigger.startsWith(typed));

  if (matches.length === 0) {
    suggestionEl.style.display = "none";
    return;
  }

  suggestionEl.innerHTML = matches.map(s => `
    <div class="shortcut-suggestion-item" onclick="applySuggestion(this, '${s.trigger}')">
      <span class="suggestion-trigger">${s.trigger}</span>
      <span class="suggestion-label">${s.label}</span>
    </div>
  `).join("");
  suggestionEl.style.display = "block";
  suggestionEl._textarea = textarea;
  suggestionEl._typed = match[0];
}

function applySuggestion(el, trigger) {
  const suggestionEl = el.closest(".shortcut-suggestions");
  const textarea = suggestionEl._textarea;
  const typed = suggestionEl._typed;
  const shortcuts = shortcutsGetAll();
  const s = shortcuts.find(x => x.trigger === trigger);
  if (!s || !textarea) return;

  const cursorPos = textarea.selectionStart;
  const val = textarea.value;
  const before = val.substring(0, cursorPos - typed.length);
  const after  = val.substring(cursorPos);
  textarea.value = before + s.text + after;
  textarea.focus();
  suggestionEl.style.display = "none";
}

window.shortcutsGetAll          = shortcutsGetAll;
window.shortcutsSave            = shortcutsSave;
window.shortcutsAdd             = shortcutsAdd;
window.shortcutsUpdate          = shortcutsUpdate;
window.shortcutsDelete          = shortcutsDelete;
window.applyShortcuts           = applyShortcuts;
window.detectShortcutSuggestion = detectShortcutSuggestion;
window.applySuggestion          = applySuggestion;
