// ============================================================
//  app.js — Core & Navegação Integrada do PrescriçõesMed
// ============================================================

let currentSector = "";
let currentPrescription = null;
let currentVariantIndex = 0;
let editingId = null;
let editVariants = [];
let newEditVariants = [];
let pediatricPrescriptionContext = { weight: "", age: "" };
const PED_DRUGS_STORAGE_KEY = "prescricoesmed_pediatric_drugs";

function getEl(...ids) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) return el;
  }
  return null;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatNumber(value, decimals = 1) {
  if (!Number.isFinite(value)) return "-";
  const fixed = value.toFixed(decimals);
  return fixed.replace(".", ",");
}

function showLoading() { document.getElementById("loading").classList.add("show"); }
function hideLoading() { document.getElementById("loading").classList.remove("show"); }

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  // Tema visual da Sala Vermelha só deve valer enquanto estivermos dentro
  // dela; ao voltar para o início, o tema é resetado.
  if (id === "screen-welcome") document.body.classList.remove("sector-red");
}
function goBack(id) { showScreen(id); }

async function selectSector(btn) {
  currentSector = btn.dataset.sector;
  document.body.classList.toggle("sector-red", currentSector === "Sala Vermelha");
  document.getElementById("active-sector-label").textContent = currentSector;
  showScreen("screen-disease");
  await renderDiseaseList();
}

// ── Agrupamento de prescrições por doença ─────────────────
// Evita que a mesma doença apareça duplicada quando existem vários
// documentos com o mesmo setor + nome: mescla as variantes num só item.
function mergeBySameDisease(items) {
  const map = new Map();
  const order = [];
  (items || []).forEach(p => {
    const key = `${(p.sector || "").trim().toLowerCase()}||${(p.disease || "").trim().toLowerCase()}`;
    if (!map.has(key)) {
      map.set(key, { ...p, variants: [...(p.variants || [])] });
      order.push(key);
    } else {
      const existing = map.get(key);
      const seenSigs = new Set(existing.variants.map(v => `${v.label}||${v.text}`));
      (p.variants || []).forEach(v => {
        const sig = `${v.label}||${v.text}`;
        if (!seenSigs.has(sig)) {
          existing.variants.push(v);
          seenSigs.add(sig);
        }
      });
    }
  });
  return order.map(k => map.get(k));
}

async function renderDiseaseList(filter = "") {
  const list = document.getElementById("disease-list");
  list.innerHTML = `<div class="empty-state">Carregando...</div>`;
  showLoading();
  try {
    const raw = (await window.dbGetBySector(currentSector))
      .filter(p => p.disease.toLowerCase().includes(filter.toLowerCase()));
    const items = mergeBySameDisease(raw)
      .sort((a, b) => a.disease.localeCompare(b.disease, 'pt-BR', { sensitivity: 'base' }));

    if (!items.length) {
      list.innerHTML = `<div class="empty-state">Nenhum diagnóstico neste setor.<br/>Use o botão ⚙ administrativo para cadastrar.</div>`;
      return;
    }

    list.innerHTML = items.map(p => `
      <button class="disease-item" onclick="openPrescription('${p.id}')">
        <span class="disease-arrow">→</span>
        <span class="disease-label">${p.disease}</span>
        ${p.variants && p.variants.length > 1 ? `<span class="variant-count">${p.variants.length} variantes</span>` : ''}
      </button>
    `).join("");
  } catch (e) {
    list.innerHTML = `<div class="empty-state">Erro ao conectar ao banco. Verifique sua conexão.</div>`;
  } finally {
    hideLoading();
  }
}

function filterDiseases() {
  renderDiseaseList(document.getElementById("disease-search").value);
}

// ── Visualização de Prescrições e Abas ────────────────────
async function openPrescription(id) {
  showLoading();
  try {
    const p = await window.dbGetById(id);
    if (!p) return;
    currentPrescription = p;
    currentVariantIndex = 0;

    const titleEl = getEl("rx-disease-name", "rx-title");
    const sectorEl = getEl("rx-sector-label");
    if (titleEl) titleEl.textContent = p.disease;
    if (sectorEl) sectorEl.textContent = p.sector;
    
    // Configura inputs de contexto caso seja do setor Pediatria
    const pedCtx = getEl("rx-ped-context", "rx-pediatric-context");
    if (isPediatricPrescription()) {
      if (pedCtx) pedCtx.style.display = "block";
      const rxWeight = document.getElementById("rx-ped-weight");
      const rxAge = document.getElementById("rx-ped-age");
      if (rxWeight) rxWeight.value = pediatricPrescriptionContext.weight;
      if (rxAge) rxAge.value = pediatricPrescriptionContext.age;
    } else {
      if (pedCtx) pedCtx.style.display = "none";
    }

    renderVariantTabs();
    renderVariantContent(0);
    showScreen("screen-prescription");
  } catch (e) {
    alert("Erro ao abrir prescrição.");
  } finally {
    hideLoading();
  }
}

function isPediatricPrescription() {
  return currentPrescription && (currentSector === "Pediatria" || currentPrescription.sector === "Pediatria");
}

function renderVariantTabs() {
  const container = getEl("variant-tabs", "rx-tabs-container");
  if (!container) return;
  container.innerHTML = "";
  const v = currentPrescription.variants || [];
  if (v.length <= 1) return;

  v.forEach((variant, idx) => {
    const btn = document.createElement("button");
    btn.className = `variant-tab ${idx === 0 ? 'active' : ''}`;
    btn.textContent = variant.label || `Opção ${idx + 1}`;
    btn.onclick = () => switchVariant(idx, btn);
    container.appendChild(btn);
  });
}

function switchVariant(idx, btn) {
  document.querySelectorAll(".variant-tab").forEach(t => t.classList.remove("active"));
  if (btn) btn.classList.add("active");
  currentVariantIndex = idx;
  renderVariantContent(idx);
}

function renderVariantContent(idx) {
  const body = getEl("rx-text", "rx-body");
  if (!body) return;
  const v = currentPrescription.variants && currentPrescription.variants[idx];
  const pickerWrap = document.getElementById("rx-med-picker-wrap");
  const cardEl = document.querySelector(".screen.active .rx-card") || document.querySelector(".rx-card");
  const editBtn = getEl("btn-rx-edit", "btn-edit-rx");

  if (!v) {
    if (pickerWrap) pickerWrap.style.display = "none";
    if (cardEl) cardEl.style.display = "";
    if (editBtn) editBtn.style.display = "inline-flex";
    body.innerHTML = "Nenhum texto disponível.";
    renderRxImageGallery(null);
    return;
  }

  setRxEditMode(false);

  let text = v.text || "";
  if (isPediatricPrescription()) {
    text = applyPediatricMarkers(text);
  }

  const rawMedLines = (v.medLines || []).filter(Boolean);
  const medLines = isPediatricPrescription()
    ? rawMedLines.map(l => applyPediatricMarkers(l).trim()).filter(Boolean)
    : rawMedLines.map(l => l.trim()).filter(Boolean);

  if (medLines.length) {
    // A prescrição tem medicamentos marcados na criação: mostra as
    // caixinhas de seleção + a prescrição final editável (borda amarela)
    if (cardEl) cardEl.style.display = "none";
    if (editBtn) editBtn.style.display = "none";
    if (pickerWrap) pickerWrap.style.display = "grid";
    renderRxMedPicker(text, medLines);
    body.innerText = text; // mantém disponível como fallback (ex: cópia legada)
  } else {
    if (pickerWrap) pickerWrap.style.display = "none";
    if (cardEl) cardEl.style.display = "";
    if (editBtn) editBtn.style.display = "inline-flex";
    body.innerText = text;
  }

  renderRxImageGallery(v.images);
}

// Monta a prescrição em texto + a prévia editável em amarelo.
// Trechos marcados como medicamento aparecem realçados (<mark>). Para
// incluir/remover na prévia, o médico pode:
//   • clicar em cima do trecho realçado, ou
//   • selecionar qualquer texto e apertar Ctrl/Cmd+G.
function renderRxMedPicker(text, medLines) {
  const linesContainer = document.getElementById("rx-med-lines");
  const preview = document.getElementById("rx-med-preview");
  if (!linesContainer || !preview) return;

  const medSet = new Set((medLines || []).map(l => l.trim()).filter(Boolean));
  const lines = text.split("\n");

  linesContainer.innerHTML = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed && medSet.has(trimmed)) {
      return `<p class="rx-med-line rx-med-marked"><mark class="rx-med-mark" data-line="${escapeHtml(trimmed)}" onclick="toggleRxMedText(this.dataset.line)">${escapeHtml(line)}</mark></p>`;
    }
    return `<p class="rx-med-plain-line">${trimmed ? escapeHtml(line) : "&nbsp;"}</p>`;
  }).join("");

  linesContainer.dataset.medLines = JSON.stringify([...medSet]);

  // Prévia começa só com o texto fixo (não-medicamentos); medicamentos
  // entram conforme o médico marca via clique ou Ctrl/Cmd+G.
  const skeleton = lines.filter(l => !medSet.has(l.trim())).join("\n");
  preview.value = skeleton;

  // Instala o atalho Ctrl/Cmd+G uma única vez por sessão
  if (!window.__rxMarkKeyBound) {
    document.addEventListener("keydown", handleRxMarkKey);
    window.__rxMarkKeyBound = true;
  }
}

// Alterna a inclusão de um trecho (linha) na prévia amarela
function toggleRxMedText(rawLine) {
  const preview = document.getElementById("rx-med-preview");
  if (!preview || !rawLine) return;
  const line = String(rawLine).trim();
  if (!line) return;

  const value = preview.value;
  const arr = value.split("\n");
  const idx = arr.findIndex(l => l.trim() === line);

  if (idx !== -1) {
    arr.splice(idx, 1);
    preview.value = arr.join("\n");
  } else {
    preview.value = value && !value.endsWith("\n") ? `${value}\n${line}` : `${value}${line}`;
  }

  // Feedback visual nos <mark> correspondentes
  document.querySelectorAll(`#rx-med-lines .rx-med-mark[data-line="${CSS.escape(line)}"]`).forEach(el => {
    el.classList.toggle("is-picked", idx === -1);
  });
}

// Handler global do atalho Ctrl/Cmd+G na tela de visualização
function handleRxMarkKey(e) {
  const isCombo = (e.key === "g" || e.key === "G") && (e.metaKey || e.ctrlKey);
  if (!isCombo) return;
  const pickerWrap = document.getElementById("rx-med-picker-wrap");
  if (!pickerWrap || pickerWrap.style.display === "none") return;

  const sel = window.getSelection();
  const raw = sel ? sel.toString() : "";
  if (!raw || !raw.trim()) return;

  // Só age se a seleção está dentro do card de prescrição
  const anchor = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
  if (!anchor || !anchor.closest("#rx-med-picker-wrap")) return;

  e.preventDefault();
  // Divide em linhas: cada linha da seleção é adicionada/removida da prévia
  raw.split("\n").map(l => l.trim()).filter(Boolean).forEach(line => toggleRxMedText(line));
  if (sel.removeAllRanges) sel.removeAllRanges();
}

// Renderiza a galeria de imagens da variante (ex: traçados de ECG)
function renderRxImageGallery(images) {
  const gallery = document.getElementById("rx-image-gallery");
  if (!gallery) return;
  if (!images || !images.length) {
    gallery.innerHTML = "";
    gallery.style.display = "none";
    return;
  }
  gallery.style.display = "flex";
  gallery.innerHTML = images.map(img => `
    <figure class="rx-image-figure">
      <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.caption || "")}" onclick="openImageViewer('${escapeHtml(img.url)}')" />
      ${img.caption ? `<figcaption>${escapeHtml(img.caption)}</figcaption>` : ""}
    </figure>
  `).join("");
}

// Visualizador em tela cheia
function openImageViewer(url) {
  let viewer = document.getElementById("image-viewer-overlay");
  if (!viewer) {
    viewer = document.createElement("div");
    viewer.id = "image-viewer-overlay";
    viewer.className = "image-viewer-overlay";
    viewer.onclick = closeImageViewer;
    viewer.innerHTML = `<img id="image-viewer-img" src="" alt="" />`;
    document.body.appendChild(viewer);
  }
  document.getElementById("image-viewer-img").src = url;
  viewer.classList.add("open");
}
function closeImageViewer() {
  const viewer = document.getElementById("image-viewer-overlay");
  if (viewer) viewer.classList.remove("open");
}

function updatePediatricPrescriptionContext() {
  const wText = document.getElementById("rx-ped-weight")?.value || "";
  const aText = document.getElementById("rx-ped-age")?.value || "";
  
  pediatricPrescriptionContext.weight = wText;
  pediatricPrescriptionContext.age = aText;

  const mainWeight = document.getElementById("ped-weight");
  const mainAge = document.getElementById("ped-age");
  if (mainWeight) mainWeight.value = wText;
  if (mainAge) mainAge.value = aText;

  // Recalcula doses se houver uma calculadora ativa (ped-ui)
  if (window.onPedInput) {
    window.onPedInput();
  }

  renderVariantContent(currentVariantIndex);
}

// ── Processador de Sintaxe de Marcadores Pediátricos ──────
function parseLocaleNumber(str) {
  if (!str) return 0;
  return parseFloat(str.replace(",", "."));
}

function applyPediatricMarkers(text) {
  const weight = parseLocaleNumber(pediatricPrescriptionContext.weight);
  const age = parseLocaleNumber(pediatricPrescriptionContext.age);
  if (!weight || weight <= 0) return text;

  const map = buildPediatricMarkerMap(weight, age);
  let output = text;
  for (const [marker, val] of Object.entries(map)) {
    const regex = new RegExp(`\\{\\{\\s*${marker}\\s*\\}\\}`, "gi");
    output = output.replace(regex, val);
  }
  return output;
}

function buildPediatricMarkerMap(weight, age) {
  const map = {};
  const list = (typeof pedDrugsGet === "function") ? pedDrugsGet() : (typeof PEDIATRIC_DRUGS !== "undefined" ? PEDIATRIC_DRUGS : []);
  
  list.forEach(drug => {
    let calc = null;
    if (typeof getPediatricCalculation === "function") {
      calc = getPediatricCalculation(drug, weight, age);
    } else {
      let dPerDose = 0;
      if (drug.dose_per_kg) {
        dPerDose = drug.dose_per_kg * weight;
        if (drug.dose_max && dPerDose > drug.dose_max) dPerDose = drug.dose_max;
      } else if (drug.dose_by_age) {
        const match = drug.dose_by_age.find(f => age >= f.age_min && age <= f.age_max);
        if (match) dPerDose = match.dose;
      }
      if (dPerDose > 0) {
        calc = { dosePerDose: dPerDose, label: `${dPerDose.toFixed(1).replace(".", ",")} mg` };
      }
    }

    if (!calc) {
      map[`${drug.id}_dose`] = `[Definir peso p/ ${drug.name}]`;
      map[`${drug.id}_ml`] = `[Definir peso]`;
      map[`${drug.id}_gotas`] = `[Definir peso]`;
      return;
    }

    map[`${drug.id}_dose`] = calc.label;

    (drug.presentations || []).forEach(p => {
      if (p.drop_mg) {
        const g = Math.round(calc.dosePerDose / p.drop_mg);
        map[`${drug.id}_gotas`] = `${g} gotas`;
      } else if (p.concentration) {
        const ml = Math.round((calc.dosePerDose / p.concentration) * 10) / 10;
        map[`${drug.id}_ml`] = `${ml.toString().replace(".", ",")} mL`;
      } else if (p.fixed_mg) {
        const comp = calc.dosePerDose / p.fixed_mg;
        const compLabel = comp >= 1 ? `${comp % 1 === 0 ? comp : comp.toFixed(1)} comp` : `${comp.toFixed(2)} comp`;
        map[`${drug.id}_comp`] = compLabel.replace(".", ",");
      }
    });

    if (!map[`${drug.id}_ml`]) map[`${drug.id}_ml`] = map[`${drug.id}_dose`];
    if (!map[`${drug.id}_gotas`]) map[`${drug.id}_gotas`] = map[`${drug.id}_dose`];
  });

  return map;
}

// ── Edição Inline (contentEditable) e Cópia ────────────────
function setRxEditMode(mode) {
  const body = getEl("rx-text", "rx-body");
  const editBtn = getEl("btn-rx-edit", "btn-edit-rx");
  const saveBtn = getEl("btn-save-rx");
  if (!body) return;
  
  if (mode) {
    body.contentEditable = "true";
    body.spellcheck = true;
    body.classList.add("editing");
    if (editBtn) editBtn.style.display = "none";
    if (saveBtn) saveBtn.style.display = "inline-flex";
    if (!saveBtn && editBtn) {
      editBtn.style.display = "inline-flex";
      editBtn.classList.add("saving");
      editBtn.textContent = "✓ Salvar edição";
      editBtn.onclick = saveRxInlineEdit;
    }
    body.onfocus = null;
    setTimeout(() => body.focus(), 0);
  } else {
    body.contentEditable = "false";
    body.classList.remove("editing");
    body.spellcheck = false;
    if (editBtn) editBtn.style.display = "inline-flex";
    if (saveBtn) saveBtn.style.display = "none";
    if (!saveBtn && editBtn) {
      editBtn.classList.remove("saving");
      editBtn.textContent = "✎ Editar";
      editBtn.onclick = editCurrentPrescription;
    }
    body.onfocus = null;
    if (window.closeShortcutPicker) window.closeShortcutPicker();
  }
}

function editCurrentPrescription() {
  setRxEditMode(true);
  const v = currentPrescription.variants && currentPrescription.variants[currentVariantIndex];
  if (v) {
    const body = getEl("rx-text", "rx-body");
    if (body) body.innerText = v.text || "";
  }
}

async function saveRxInlineEdit() {
  if (!currentPrescription) return;
  const body = getEl("rx-text", "rx-body");
  if (!body) return;
  const newText = body.innerText;
  
  currentPrescription.variants[currentVariantIndex].text = newText;
  showLoading();
  try {
    await window.dbUpdate(currentPrescription.id, {
      variants: currentPrescription.variants
    });
    setRxEditMode(false);
    renderVariantContent(currentVariantIndex);
  } catch (e) {
    alert("Erro ao salvar alterações no servidor.");
  } finally {
    hideLoading();
  }
}

function copyPrescription() {
  const pickerWrap = document.getElementById("rx-med-picker-wrap");
  let text;
  if (pickerWrap && pickerWrap.style.display !== "none") {
    const preview = document.getElementById("rx-med-preview");
    text = preview ? preview.value : "";
  } else {
    const body = getEl("rx-text", "rx-body");
    if (!body) return;
    text = body.innerText;
  }
  navigator.clipboard.writeText(text).then(() => {
    const feedback = document.getElementById("copy-feedback");
    feedback.classList.add("show");
    setTimeout(() => feedback.classList.remove("show"), 2000);
  });
}

// ============================================================
//  PAINEL ADMINISTRATIVO (Gerenciamento de Prescrições Gerais)
// ============================================================

function openAdmin() {
  const modal = document.getElementById("admin-modal");
  if (modal) modal.classList.add("open");
  switchTab("tab-list", document.getElementById("tab-list-btn"));
  renderAdminList();
}
function closeAdmin() {
  const modal = document.getElementById("admin-modal");
  if (modal) modal.classList.remove("open");
}
function closeAdminIfOutside(e) {
  if (e.target.classList.contains("modal-overlay")) closeAdmin();
}

function switchTab(tabId, btn) {
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
  if (btn) btn.classList.add("active");
}

async function renderAdminList(filter = "") {
  const container = getEl("admin-list", "admin-list-container");
  if (!container) return;
  container.innerHTML = '<div class="empty-state">Carregando...</div>';
  try {
    const all = mergeBySameDisease(await window.dbGetAll()).sort((a, b) => {
      const sec = a.sector.localeCompare(b.sector);
      if (sec !== 0) return sec;
      return a.disease.localeCompare(b.disease);
    });
    const sectorFilter = document.getElementById("admin-sector-filter")?.value || "";
    
    const filtered = all.filter(x => 
      (x.disease || "").toLowerCase().includes(filter.toLowerCase()) || 
      (x.sector || "").toLowerCase().includes(filter.toLowerCase())
    );
    const scoped = sectorFilter
      ? filtered.filter(x => x.sector === sectorFilter)
      : filtered;

    if (!scoped.length) {
      container.innerHTML = '<div class="empty-state">Nenhuma prescrição cadastrada.</div>';
      return;
    }

    container.innerHTML = scoped.map(p => `
      <div class="admin-item">
        <div class="admin-item-info">
          <span class="admin-item-sector">${p.sector}</span>
          <strong class="admin-item-disease">${p.disease}</strong>
          <span class="admin-item-vcount">${p.variants ? p.variants.length : 1} variante(s)</span>
        </div>
        <button class="btn-edit-item" onclick="startEdit('${p.id}')">Editar</button>
      </div>
    `).join("");
  } catch(e) {
    container.innerHTML = '<div class="empty-state">Erro ao buscar lista.</div>';
  }
}

function filterAdminList() {
  renderAdminList(document.getElementById("admin-search")?.value || "");
}

// ── Fluxos de Inclusão e Edição Estrutural no Form ────────
function addVariantField(containerId = "variants-container", label = "", text = "", images = [], medLines = []) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const div = document.createElement("div");
  div.className = "variant-form-group variant-edit-block animate-fade";
  div.innerHTML = `
    <div class="variant-form-header variant-edit-header">
      <input type="text" placeholder="Nome da Variante (ex: Sem Comorbidades, Alergia)" class="var-label variant-label-input" value="${escapeHtml(label)}" required />
      <button type="button" class="btn-remove-var btn-remove-variant" onclick="this.closest('.variant-form-group').remove()">✕ Remover</button>
    </div>
    <textarea rows="10" placeholder="Escreva livremente a prescrição..." class="var-text variant-text-input" required oninput="refreshVariantLinePicker(this)" onkeydown="handleVariantMarkKey(event)">${escapeHtml(text)}</textarea>
    <div class="var-line-picker-wrap">
      <span class="var-col-label">Selecione o texto que é medicamento e pressione <kbd>Ctrl</kbd>+<kbd>G</kbd> (ou <kbd>⌘</kbd>+<kbd>G</kbd>) para marcar. As linhas marcadas aparecem abaixo.</span>
      <div class="var-line-picker" data-med-lines="[]"></div>
    </div>
    <div class="var-images-block">
      <div class="var-images-head">
        <span>Imagens</span>
        <label class="btn-add-image">+ Adicionar imagem
          <input type="file" accept="image/*" multiple class="var-image-input" onchange="handleVariantImageUpload(event, this)" hidden />
        </label>
      </div>
      <div class="var-images-list"></div>
    </div>
  `;
  container.appendChild(div);
  const imgList = div.querySelector(".var-images-list");
  (images || []).forEach(img => addVariantImageEntry(imgList, img));

  const draftArea = div.querySelector(".var-text");
  if (draftArea) refreshVariantLinePicker(draftArea, medLines);

  return div;
}

// ── Marcação de linhas de medicamento (na criação/edição) ──────────
// O médico marca aqui quais linhas do rascunho são medicamentos.
// Essa marcação é salva junto da variante (medLines) e só vira uma
// caixinha selecionável de fato depois, na tela de visualização,
// quando a prescrição for aberta para copiar.
function refreshVariantLinePicker(textarea, presetLines) {
  const block = textarea.closest(".variant-form-group");
  if (!block) return;
  const picker = block.querySelector(".var-line-picker");
  if (!picker) return;

  // Fonte de verdade: array em picker.dataset.medLines (JSON).
  let current;
  if (presetLines && presetLines.length) {
    current = presetLines.map(l => l.trim()).filter(Boolean);
  } else {
    try { current = JSON.parse(picker.dataset.medLines || "[]"); }
    catch { current = []; }
  }

  // Descarta marcações que não existem mais no texto (após edição)
  const validLines = new Set(textarea.value.split("\n").map(l => l.trim()).filter(Boolean));
  current = current.filter(l => validLines.has(l));
  picker.dataset.medLines = JSON.stringify(current);

  if (!current.length) {
    picker.innerHTML = `<span class="var-line-empty">Nenhum medicamento marcado ainda.</span>`;
    return;
  }

  picker.innerHTML = current.map(line => `
    <span class="var-line-tag">
      <span class="var-line-text">${escapeHtml(line)}</span>
      <button type="button" class="var-line-tag-remove" title="Remover marcação" onclick="unmarkVariantLine(this, ${JSON.stringify(line).replace(/"/g,'&quot;')})">✕</button>
    </span>
  `).join("");
}

// Remove uma linha marcada (botão ✕ na tag)
function unmarkVariantLine(btn, line) {
  const block = btn.closest(".variant-form-group");
  if (!block) return;
  const picker = block.querySelector(".var-line-picker");
  const textarea = block.querySelector(".var-text");
  if (!picker || !textarea) return;
  let arr = [];
  try { arr = JSON.parse(picker.dataset.medLines || "[]"); } catch {}
  arr = arr.filter(l => l !== line);
  picker.dataset.medLines = JSON.stringify(arr);
  refreshVariantLinePicker(textarea);
}

// Ctrl/Cmd+G dentro do textarea: marca as linhas cobertas pela seleção
function handleVariantMarkKey(e) {
  const isCombo = (e.key === "g" || e.key === "G") && (e.metaKey || e.ctrlKey);
  if (!isCombo) return;
  const textarea = e.currentTarget || e.target;
  if (!textarea || textarea.tagName !== "TEXTAREA") return;

  e.preventDefault();
  const value = textarea.value;
  let start = textarea.selectionStart;
  let end = textarea.selectionEnd;
  if (start === end) return; // nada selecionado

  // Expande para os limites de linha completos
  while (start > 0 && value[start - 1] !== "\n") start--;
  while (end < value.length && value[end] !== "\n") end++;

  const selectedLines = value.slice(start, end).split("\n").map(l => l.trim()).filter(Boolean);
  if (!selectedLines.length) return;

  const block = textarea.closest(".variant-form-group");
  const picker = block && block.querySelector(".var-line-picker");
  if (!picker) return;

  let current;
  try { current = JSON.parse(picker.dataset.medLines || "[]"); } catch { current = []; }
  const set = new Set(current);
  // Se todas as linhas selecionadas já estão marcadas, o atalho desmarca; senão marca as que faltam.
  const allMarked = selectedLines.every(l => set.has(l));
  if (allMarked) {
    selectedLines.forEach(l => set.delete(l));
  } else {
    selectedLines.forEach(l => set.add(l));
  }
  picker.dataset.medLines = JSON.stringify([...set]);
  refreshVariantLinePicker(textarea);
}

// Compat: mantém a função exportada, mas não é mais usada pela UI
function toggleVariantLineCheck(checkbox) {
  const row = checkbox.closest(".var-line-row");
  if (row) row.classList.toggle("checked", checkbox.checked);
}

// ── Compressão de imagens (mantém tudo no Firestore, sem Storage) ─
// Redimensiona para no máx. MAX_DIM px no maior lado e reexporta como
// JPEG com qualidade reduzida, retornando um dataURL base64 leve.
const IMG_MAX_DIM = 1000;
const IMG_QUALITY = 0.72;

function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo de imagem."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Falha ao processar a imagem."));
      img.onload = () => {
        let { width, height } = img;
        if (width > IMG_MAX_DIM || height > IMG_MAX_DIM) {
          if (width >= height) {
            height = Math.round(height * (IMG_MAX_DIM / width));
            width = IMG_MAX_DIM;
          } else {
            width = Math.round(width * (IMG_MAX_DIM / height));
            height = IMG_MAX_DIM;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", IMG_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Lê arquivos selecionados, comprime e adiciona à variante como base64
function handleVariantImageUpload(e, input) {
  const list = input.closest(".var-images-block").querySelector(".var-images-list");
  const files = [...(e.target.files || [])];
  files.forEach(async file => {
    const item = addVariantImageEntry(list, { url: "", caption: "" });
    const thumb = item.querySelector(".var-image-thumb");
    const urlInput = item.querySelector(".var-image-url");
    urlInput.disabled = true;
    urlInput.placeholder = "Comprimindo imagem…";
    try {
      const dataUrl = await compressImageFile(file);
      thumb.src = dataUrl;
      item.dataset.embeddedUrl = dataUrl;
      urlInput.value = "";
      urlInput.placeholder = `Imagem incorporada (${formatBytes(dataUrl.length)})`;
      const sizeLabel = item.querySelector(".var-image-size");
      if (sizeLabel) sizeLabel.textContent = formatBytes(dataUrl.length);
    } catch (err) {
      console.error(err);
      alert("Não foi possível processar essa imagem.");
      item.remove();
    } finally {
      urlInput.disabled = false;
    }
  });
  input.value = "";
}

function formatBytes(n) {
  return n > 1024 ? `${Math.round(n / 1024)} KB` : `${n} B`;
}

function addVariantImageEntry(list, img = { url: "", caption: "" }) {
  const item = document.createElement("div");
  item.className = "var-image-item";
  const isEmbedded = (img.url || "").startsWith("data:");
  item.innerHTML = `
    <img class="var-image-thumb" src="${escapeHtml(img.url || "")}" alt="" />
    <div class="var-image-fields">
      <input type="text" class="var-image-url" placeholder="URL da imagem (ou envie um arquivo)" value="${isEmbedded ? "" : escapeHtml(img.url || "")}" />
      <input type="text" class="var-image-caption" placeholder="Legenda (opcional)" value="${escapeHtml(img.caption || "")}" />
      ${isEmbedded ? `<span class="var-image-size">${formatBytes(img.url.length)}</span>` : ""}
    </div>
    <button type="button" class="btn-remove-var" onclick="this.parentElement.remove()">✕</button>
  `;
  const urlInput = item.querySelector(".var-image-url");
  const thumb = item.querySelector(".var-image-thumb");
  if (isEmbedded) {
    item.dataset.embeddedUrl = img.url;
    urlInput.placeholder = `Imagem incorporada (${formatBytes(img.url.length)})`;
  }
  urlInput.addEventListener("input", () => {
    delete item.dataset.embeddedUrl;
    thumb.src = urlInput.value;
    urlInput.placeholder = "URL da imagem (ou envie um arquivo)";
    const sizeLabel = item.querySelector(".var-image-size");
    if (sizeLabel) sizeLabel.remove();
  });
  list.appendChild(item);
  return item;
}

function addNewVariantField() { addVariantField("new-variants-container"); }
function addVariantFieldEdit() { addVariantField("variants-container"); }

// Lê os campos de imagem de um bloco de variante e retorna array {url, caption}
function collectVariantImages(block) {
  return [...block.querySelectorAll(".var-image-item")]
    .map(item => ({
      url: item.dataset.embeddedUrl || item.querySelector(".var-image-url").value.trim(),
      caption: item.querySelector(".var-image-caption").value.trim()
    }))
    .filter(img => img.url);
}

function collectAllVariantsImages(blocks) {
  return [...blocks].map(b => {
    const draftEl = b.querySelector(".var-text");
    const text = draftEl ? draftEl.value : "";
    let medLines = [];
    try {
      const picker = b.querySelector(".var-line-picker");
      if (picker && picker.dataset.medLines) medLines = JSON.parse(picker.dataset.medLines);
    } catch { medLines = []; }
    medLines = (medLines || []).map(l => String(l).trim()).filter(Boolean);
    return {
      label: b.querySelector(".var-label").value,
      text,
      medLines,
      images: collectVariantImages(b)
    };
  });
}

// ── Buscar doença existente ao criar (evita duplicar por variação) ─
let addingToExistingId = null;

function prepareAddTab() {
  cancelAddToExisting();
}

async function searchExistingDisease() {
  const input = document.getElementById("add-disease-search");
  const container = document.getElementById("add-disease-search-results");
  if (!input || !container) return;
  const q = input.value.trim().toLowerCase();
  if (!q) { container.innerHTML = ""; return; }

  container.innerHTML = `<div class="empty-state" style="padding:12px">Buscando...</div>`;
  try {
    const all = await window.dbGetAll();
    const matches = mergeBySameDisease(all)
      .filter(p => (p.disease || "").toLowerCase().includes(q))
      .slice(0, 8);

    if (!matches.length) {
      container.innerHTML = `<div class="empty-state" style="padding:12px">Nenhuma doença encontrada — será criada uma nova.</div>`;
      return;
    }
    container.innerHTML = matches.map(p => `
      <div class="admin-item">
        <div class="admin-item-info">
          <span class="admin-item-sector">${p.sector}</span>
          <strong class="admin-item-disease">${p.disease}</strong>
          <span class="admin-item-vcount">${p.variants ? p.variants.length : 0} variante(s)</span>
        </div>
        <button type="button" class="btn-edit-item" onclick="selectExistingDisease('${p.id}')">+ Adicionar variante</button>
      </div>
    `).join("");
  } catch(e) {
    container.innerHTML = `<div class="empty-state" style="padding:12px">Erro ao buscar.</div>`;
  }
}

async function selectExistingDisease(id) {
  showLoading();
  try {
    const p = await window.dbGetById(id);
    if (!p) return;
    addingToExistingId = id;

    const idField = document.getElementById("add-existing-id");
    const sectorSel = document.getElementById("add-sector");
    const diseaseInput = document.getElementById("add-disease");
    const banner = document.getElementById("add-existing-banner");

    if (idField) idField.value = id;
    if (sectorSel) { sectorSel.value = p.sector; sectorSel.disabled = true; }
    if (diseaseInput) { diseaseInput.value = p.disease; diseaseInput.readOnly = true; }
    if (banner) banner.style.display = "flex";
    const labelEl = document.getElementById("add-existing-label");
    if (labelEl) labelEl.textContent = `${p.sector} — ${p.disease}`;

    document.getElementById("add-disease-search").value = "";
    document.getElementById("add-disease-search-results").innerHTML = "";

    const container = document.getElementById("new-variants-container");
    container.innerHTML = "";
    (p.variants || []).forEach(v => addVariantField("new-variants-container", v.label, v.text, v.images, v.medLines));
    addNewVariantField(); // bloco extra em branco para a nova variante
  } catch(e) {
    alert("Erro ao carregar doença.");
  } finally { hideLoading(); }
}

function cancelAddToExisting() {
  addingToExistingId = null;
  const idField = document.getElementById("add-existing-id");
  const sectorSel = document.getElementById("add-sector");
  const diseaseInput = document.getElementById("add-disease");
  const banner = document.getElementById("add-existing-banner");
  const searchInput = document.getElementById("add-disease-search");
  const searchResults = document.getElementById("add-disease-search-results");
  const container = document.getElementById("new-variants-container");

  if (idField) idField.value = "";
  if (sectorSel) { sectorSel.disabled = false; sectorSel.value = ""; }
  if (diseaseInput) { diseaseInput.readOnly = false; diseaseInput.value = ""; }
  if (banner) banner.style.display = "none";
  if (searchInput) searchInput.value = "";
  if (searchResults) searchResults.innerHTML = "";
  if (container) container.innerHTML = "";
  addNewVariantField();
}

async function saveNewPrescription(e) {
  e.preventDefault();
  const form = e.target;
  const sector = form.querySelector('[name="sector"]')?.value || "";
  const disease = form.querySelector('[name="disease"]')?.value || "";
  const blocks = document.querySelectorAll("#new-variants-container .variant-form-group");

  if (!blocks.length) {
    alert("Adicione ao menos uma variante.");
    return;
  }

  showLoading();
  try {
    const variants = await collectAllVariantsImages(blocks);

    if (addingToExistingId) {
      // Atualiza a doença já existente, mesclando variantes em vez de duplicar
      await window.dbUpdate(addingToExistingId, { sector, disease, variants });
    } else {
      // Se já existir uma doença com o mesmo nome no mesmo setor, agrupa
      // as variantes nela em vez de criar um novo documento duplicado.
      const existingList = await window.dbGetBySector(sector);
      const match = existingList.find(p => (p.disease || "").trim().toLowerCase() === disease.trim().toLowerCase());
      if (match) {
        const seenSigs = new Set((match.variants || []).map(v => `${v.label}||${v.text}`));
        const mergedVariants = [...(match.variants || [])];
        variants.forEach(v => {
          const sig = `${v.label}||${v.text}`;
          if (!seenSigs.has(sig)) { mergedVariants.push(v); seenSigs.add(sig); }
        });
        await window.dbUpdate(match.id, { variants: mergedVariants });
      } else {
        await window.dbAdd({ sector, disease, variants });
      }
    }

    e.target.reset();
    cancelAddToExisting();
    alert("✓ Prescrição salva com sucesso!");
    switchTab("tab-list", document.getElementById("tab-list-btn"));
    renderAdminList();
  } catch(err) {
    console.error(err);
    alert("Erro ao salvar." + (err?.message ? `\n${err.message}` : ""));
  } finally { hideLoading(); }
}

async function startEdit(id) {
  editingId = id;
  showLoading();
  try {
    const p = await window.dbGetById(id);
    if (!p) return;
    const editId = document.getElementById("edit-id");
    const editSector = getEl("edit-sector", "edit-rx-sector");
    const editDisease = getEl("edit-disease", "edit-rx-disease");
    const container = getEl("variants-container", "edit-variants-container");

    if (editId) editId.value = id;
    if (editSector) editSector.value = p.sector;
    if (editDisease) editDisease.value = p.disease;
    
    if (!container) throw new Error("edit container missing");
    container.innerHTML = "";
    
    if (p.variants && p.variants.length) {
      p.variants.forEach(v => addVariantField("variants-container", v.label, v.text, v.images, v.medLines));
    } else {
      addVariantField("variants-container", "Padrão", p.text || "");
    }
    
    switchTab("tab-edit", document.getElementById("tab-edit-btn"));
  } catch(e) {
    alert("Erro ao buscar dados.");
  } finally { hideLoading(); }
}

async function updatePrescription(e) {
  e.preventDefault();
  const form = e.target;
  const id = editingId || document.getElementById("edit-id")?.value;
  if (!id) return;
  
  const sector = getEl("edit-sector", "edit-rx-sector")?.value || "";
  const disease = getEl("edit-disease", "edit-rx-disease")?.value || "";
  const blocks = document.querySelectorAll("#variants-container .variant-form-group, #edit-variants-container .variant-form-group");

  showLoading();
  try {
    const variants = await collectAllVariantsImages(blocks);
    await window.dbUpdate(id, { sector, disease, variants });
    alert("✓ Prescrição atualizada!");
    editingId = null;
    if (document.getElementById("edit-id")) document.getElementById("edit-id").value = "";
    switchTab("tab-list", document.getElementById("tab-list-btn"));
    renderAdminList();
  } catch(e) {
    console.error(e);
    alert("Erro ao atualizar." + (e?.message ? `\n${e.message}` : ""));
  } finally { hideLoading(); }
}

async function deletePrescription() {
  const id = editingId || document.getElementById("edit-id")?.value;
  if (!id || !confirm("Tem certeza que quer excluir permanentemente esta prescrição?")) return;
  showLoading();
  try {
    await window.dbDelete(id);
    alert("Prescrição excluída.");
    editingId = null;
    if (document.getElementById("edit-id")) document.getElementById("edit-id").value = "";
    switchTab("tab-list", document.getElementById("tab-list-btn"));
    renderAdminList();
  } catch(e) {
    alert("Erro ao deletar.");
  } finally { hideLoading(); }
}

// ============================================================
//  PEDIATRIA (Integração e Redirecionamento de Cálculos)
// ============================================================

function openPediatria() {
  showScreen("screen-pediatria");
  if (window.initPedDrugSelect) {
    window.initPedDrugSelect();
  } else {
    renderPedDrugOptions();
  }
  renderPedDiseaseList();
}

function switchPedTab(tabId, btn) {
  document.querySelectorAll(".ped-tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".ped-tab").forEach(t => t.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
  if (btn) btn.classList.add("active");
}

function calculateDose() {
  if (window.onPedInput) {
    window.onPedInput();
    return;
  }

  const weightText = document.getElementById("ped-weight").value;
  const ageText = document.getElementById("ped-age")?.value || "";
  const weight = parseLocaleNumber(weightText);
  const age = parseLocaleNumber(ageText);
  const drugId = document.getElementById("ped-drug").value;
  const result = document.getElementById("ped-result");
  const placeholder = document.getElementById("ped-placeholder");

  pediatricPrescriptionContext.weight = weightText;
  pediatricPrescriptionContext.age = ageText;

  const rxWeight = document.getElementById("rx-ped-weight");
  const rxAge = document.getElementById("rx-ped-age");
  if (rxWeight && isPediatricPrescription()) rxWeight.value = weightText;
  if (rxAge && isPediatricPrescription()) rxAge.value = ageText;
  if (currentPrescription && isPediatricPrescription()) renderVariantContent(currentVariantIndex);

  if (!weight || !drugId || weight < 1 || weight > 150) {
    result.style.display = "none";
    placeholder.style.display = "flex";
    return;
  }

  const list = (typeof pedDrugsGet === "function") ? pedDrugsGet() : (typeof PEDIATRIC_DRUGS !== "undefined" ? PEDIATRIC_DRUGS : []);
  const drug = list.find(d => d.id === drugId);
  if (!drug) return;

  let calc = null;
  if (typeof getPediatricCalculation === "function") {
    calc = getPediatricCalculation(drug, weight, age);
  }
  if (!calc) return;

  document.getElementById("ped-result-drug").textContent = drug.name;
  document.getElementById("ped-result-route").textContent = drug.route || "VO";
  document.getElementById("ped-dose-per-kg").textContent = drug.dose_per_kg ? `${drug.dose_per_kg} mg/kg` : "Fixa";
  document.getElementById("ped-dose-calc").textContent = calc.label;
  document.getElementById("ped-dose-interval").textContent = drug.interval;
  document.getElementById("ped-notes").textContent = drug.notes || "";

  const presList = document.getElementById("ped-pres-list");
  presList.innerHTML = (drug.presentations || []).map(p => {
    if (p.drop_mg) {
      const gotas = Math.round(calc.dosePerDose / p.drop_mg);
      return `<div class="ped-pres-item"><span class="ped-pres-name">${p.label}</span><span class="ped-pres-vol">${gotas} gotas</span></div>`;
    }
    if (p.fixed_mg) {
      const comp = calc.dosePerDose / p.fixed_mg;
      return `<div class="ped-pres-item"><span class="ped-pres-name">${p.label}</span><span class="ped-pres-vol">${comp.toFixed(1)} comp</span></div>`;
    }
    if (p.concentration) {
      const vol = Math.round((calc.dosePerDose / p.concentration) * 10) / 10;
      return `<div class="ped-pres-item"><span class="ped-pres-name">${p.label}</span><span class="ped-pres-vol">${vol} mL</span></div>`;
    }
    return "";
  }).join("");

  result.style.display = "block";
  placeholder.style.display = "none";
}

function copyPedResult() {
  if (window.copyPedRx) {
    window.copyPedRx();
    return;
  }
  const weight = document.getElementById("ped-weight").value;
  const drugId = document.getElementById("ped-drug").value;
  const list = (typeof pedDrugsGet === "function") ? pedDrugsGet() : (typeof PEDIATRIC_DRUGS !== "undefined" ? PEDIATRIC_DRUGS : []);
  const drug = list.find(d => d.id === drugId);
  if (!drug) return;

  const doseCalc = document.getElementById("ped-dose-calc").textContent;
  const interval = document.getElementById("ped-dose-interval").textContent;
  const pres = [...document.querySelectorAll(".ped-pres-item")].map(el => {
    return `  • ${el.querySelector(".ped-pres-name").textContent}: ${el.querySelector(".ped-pres-vol").textContent}`;
  }).join("\n");

  const text = `${drug.name} — Peso: ${weight} kg
Dose: ${doseCalc}
Intervalo: ${interval}
Apresentações:
${pres}`;
  navigator.clipboard.writeText(text).then(() => {
    const fb = document.getElementById("ped-copy-feedback");
    if (fb) {
      fb.classList.add("show");
      setTimeout(() => fb.classList.remove("show"), 2000);
    }
  });
}

async function renderPedDiseaseList(filter = "") {
  const list = document.getElementById("ped-disease-list");
  if (!list) return;
  list.innerHTML = `<div class="empty-state">Carregando...</div>`;
  showLoading();
  try {
    const rawPed = (await window.dbGetBySector("Pediatria"))
      .filter(p => p.disease.toLowerCase().includes(filter.toLowerCase()));
    const items = mergeBySameDisease(rawPed)
      .sort((a, b) => a.disease.localeCompare(b.disease, 'pt-BR', { sensitivity: 'base' }));
    if (!items.length) {
      list.innerHTML = `<div class="empty-state">Nenhuma prescrição pediátrica.<br/>Use ⚙ para adicionar (setor: Pediatria).</div>`;
      return;
    }
    list.innerHTML = items.map(p => `
      <button class="disease-item" onclick="openPrescription('${p.id}')">
        <span class="disease-arrow">→</span>
        <span class="disease-label">${p.disease}</span>
        ${p.variants && p.variants.length > 1 ? `<span class="variant-count">${p.variants.length} variantes</span>` : ''}
      </button>
    `).join("");
  } catch(e) {
    list.innerHTML = `<div class="empty-state">Erro ao carregar diagnósticos pediátricos.</div>`;
  } finally { hideLoading(); }
}

function filterPedDiseases() {
  renderPedDiseaseList(document.getElementById("ped-search").value);
}

// ── Fallback caso Admin de Fármacos Pediátricos falte ──────
function renderPedDrugOptions() {}
function renderPedDrugAdmin() {}
function newPedDrug() {}
function editPedDrug() {}
function addPedPresentationField() {}
function removePedPresentationField() {}
function savePedDrug() {}
function deletePedDrug() {}
function updatePedMarkerPreview() {}

// ============================================================
//  CALCULADORAS DE INFUSÃO (Sala Vermelha / UTI)
// ============================================================

const SEDATION_INFUSIONS = [
  {
    id: "midazolam",
    name: "Midazolam",
    className: "Sedativo benzodiazepínico",
    accent: "#38bdf8",
    rangeLine: "Manutenção: 0,02–0,1 mg/kg/h · Máx: 0,1 mg/kg/h",
    subtitle: "Sem depressão respiratória significativa",
    presentationTitle: "DILUIÇÃO",
    doseUnit: "mg/kg/h",
    presentations: [
      {
        label: "Padrão · 1 mg/mL",
        concentration: 1,
        helper: "Padrão: 100 mg/100 mL · 1 mg/mL"
      },
      {
        label: "Diluída · 0,5 mg/mL",
        concentration: 0.5,
        helper: "Diluída: 50 mg/100 mL · 0,5 mg/mL"
      }
    ]
  },
  {
    id: "fentanil-sed",
    name: "Fentanil",
    className: "Opioide",
    accent: "#f59e0b",
    rangeLine: "Analgesia contínua: 0,01–0,05 mcg/kg/min",
    subtitle: "Titular pela escala de dor",
    presentationTitle: "DILUIÇÃO",
    doseUnit: "mcg/kg/min",
    presentations: [
      {
        label: "Padrão · 10 mcg/mL",
        concentration: 10,
        helper: "Padrão: 5 amp (500 mcg/10 mL) + 40 mL SFO,9% → 50 mL · 10 mcg/mL"
      }
    ]
  },
  {
    id: "propofol-sed",
    name: "Propofol",
    className: "Hipnótico",
    accent: "#8b5cf6",
    rangeLine: "Leve: 0,3–1 mg/kg/h · Profunda: 1–4 mg/kg/h",
    subtitle: "Limite recomendado: 4 mg/kg/h",
    presentationTitle: "APRESENTAÇÃO",
    doseUnit: "mg/kg/h",
    presentations: [
      {
        label: "Sem diluição · 10 mg/mL",
        concentration: 10,
        helper: "Frasco original 200 mg/20 mL · sem diluição · 10 mg/mL"
      }
    ]
  },
  {
    id: "cetamina",
    name: "Cetamina",
    className: "Anestésico dissociativo",
    accent: "#10b981",
    rangeLine: "Dose recomendada: 0,5–1 mg/kg/h",
    presentationTitle: "DILUIÇÃO",
    doseUnit: "mg/kg/h",
    presentations: [
      {
        label: "Padrão · 2 mg/mL",
        concentration: 2,
        helper: "Padrão: 10 mL (50 mg/mL) + 240 mL SFO,9% → 250 mL · 2 mg/mL"
      }
    ]
  },
  {
    id: "dexmedetomidina",
    name: "Dexmedetomidina",
    className: "Alfa-2 agonista",
    accent: "#ec4899",
    rangeLine: "Manutenção: 0,2–0,7 mcg/kg/h · Máx: 1,4 mcg/kg/h",
    subtitle: "Sem depressão respiratória significativa",
    presentationTitle: "DILUIÇÃO",
    doseUnit: "mcg/kg/h",
    presentations: [
      {
        label: "Padrão · 4 mcg/mL",
        concentration: 4,
        helper: "2 amp (400 mcg/4 mL) + 96 mL SFO,9% → 100 mL · 4 mcg/mL"
      }
    ]
  },
  {
    id: "noradrenalina",
    name: "Noradrenalina",
    className: "Vasopressor",
    accent: "#ef4444",
    rangeLine: "PAM alvo: 65–75 mmHg",
    subtitle: "Titular conforme resposta clínica",
    presentationTitle: "DILUIÇÃO",
    doseUnit: "mcg/kg/min",
    presentations: [
      {
        label: "Padrão · 80 mcg/mL",
        concentration: 80,
        helper: "Padrão: 4 mg/50 mL → 80 mcg/mL"
      }
    ]
  }
];

function openIntubacao() {
  showScreen("screen-intubacao");
  calculateIntubacao();
}
function calculateIntubacao() {
  const w = parseLocaleNumber(document.getElementById("iot-weight")?.value);
  const res = document.getElementById("iot-drug-results");
  if (!res) return;

  if (!w || w <= 0) {
    res.innerHTML = `<div class="empty-state">Informe o peso para ver as doses de intubação.</div>`;
    return;
  }

  const drugs = [
    {
      id: "etomidato",
      name: "Etomidato",
      className: "Hipnótico",
      dose: { label: "Indução", value: 0.3, unit: "mg/kg" },
      concentration: { value: 2, unit: "mg/mL" },
      note: "Indutor com menor impacto hemodinâmico. Pode deprimir adrenal transientemente."
    },
    {
      id: "propofol",
      name: "Propofol",
      className: "Hipnótico",
      dose: { label: "Indução", value: 1.5, unit: "mg/kg" },
      concentration: { value: 10, unit: "mg/mL" },
      note: "Útil em pacientes estáveis. Pode causar hipotensão e apneia."
    },
    {
      id: "fentanil",
      name: "Fentanil",
      className: "Opioide",
      dose: { label: "Analgesia pré-indução", value: 3, unit: "mcg/kg" },
      concentration: { value: 50, unit: "mcg/mL" },
      note: "Ajuda na resposta simpática à laringoscopia."
    },
    {
      id: "succinilcolina",
      name: "Succinilcolina",
      className: "Bloqueador neuromuscular",
      dose: { label: "Paralisia", value: 1.5, unit: "mg/kg" },
      concentration: { value: 20, unit: "mg/mL" },
      note: "Evitar em hiperK, queimaduras, doenças neuromusculares e miopatias."
    },
    {
      id: "rocuronio",
      name: "Rocurônio",
      className: "Bloqueador neuromuscular",
      dose: { label: "Paralisia", value: 1.2, unit: "mg/kg" },
      concentration: { value: 10, unit: "mg/mL" },
      note: "Alternativa à succinilcolina; útil quando se deseja duração maior."
    }
  ];

  res.innerHTML = `
    <div class="iot-section">
      <div class="iot-section-head">
        <span class="iot-dot" style="background:#f87171"></span>
        <span>Drogas de intubação</span>
        <span class="iot-line"></span>
      </div>
      <div class="iot-grid">
        ${drugs.map(drug => {
          const totalDose = w * drug.dose.value;
          const totalMl = totalDose / drug.concentration.value;
          const doseLabel = drug.dose.unit === "mcg/kg"
            ? `${formatNumber(totalDose, 0)} mcg`
            : `${formatNumber(totalDose, 1)} mg`;
          return `
            <article class="iot-drug-card">
              <div class="iot-drug-name">${drug.name}</div>
              <div class="iot-drug-class">${drug.className}</div>
              <div class="iot-dose-row">
                <div class="iot-dose-label">${drug.dose.label}</div>
                <div class="iot-dose-value">${doseLabel}</div>
                <div class="iot-dose-unit">${drug.dose.unit}</div>
                <div class="iot-dose-ref">Peso: ${formatNumber(w, 1)} kg</div>
              </div>
              <div class="iot-dose-row">
                <div class="iot-dose-label">Volume</div>
                <div class="iot-dose-value">${formatNumber(totalMl, 2)} mL</div>
                <div class="iot-dose-unit">${drug.concentration.value} ${drug.concentration.unit}</div>
                <div class="iot-dose-ref">Conversão pela concentração da ampola</div>
              </div>
              <div class="iot-drug-note">${drug.note}</div>
            </article>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function openSedacao() {
  showScreen("screen-sedacao");
  renderSedacao();
}

function renderSedacao() {
  const target = document.getElementById("sed-results");
  if (!target) return;

  target.innerHTML = SEDATION_INFUSIONS.map(drug => `
    <article class="sed-drug-card" style="--sed-accent: ${drug.accent || "#38bdf8"}">
      <div class="sed-card-top">
        <div class="sed-kicker">${drug.className}</div>
        <h3 class="sed-title">${drug.name}</h3>
        <p class="sed-range-line">${drug.rangeLine}</p>
        ${drug.subtitle ? `<p class="sed-subtitle">${drug.subtitle}</p>` : ""}
      </div>

      <div class="sed-presentation-block">
        <div class="sed-section-label">${drug.presentationTitle}</div>
        <select id="${drug.id}-presentation" class="sed-select" onchange="calculateSedacao()">
          ${drug.presentations.map((p, idx) => `
            <option value="${idx}" ${idx === 0 ? "selected" : ""}>${p.label}</option>
          `).join("")}
        </select>
        <div class="sed-presentation-note" id="${drug.id}-presentation-note">${drug.presentations[0].helper}</div>
      </div>

      <div class="sed-calc-stack">
        <div class="sed-calc-card">
          <div class="sed-calc-head">DOSE → VAZÃO</div>
          <div class="sed-calc-line">
            <input type="number" id="${drug.id}-dose" min="0" step="0.01" placeholder="${drug.doseUnit}" oninput="calculateSedacao()" />
            <span class="sed-unit">${drug.doseUnit}</span>
            <span class="sed-arrow">→</span>
            <strong id="${drug.id}-flow-result">—</strong>
            <span class="sed-unit">mL/h</span>
          </div>
        </div>

        <div class="sed-calc-card">
          <div class="sed-calc-head">VAZÃO → DOSE</div>
          <div class="sed-calc-line">
            <input type="number" id="${drug.id}-flow" min="0" step="0.01" placeholder="mL/h" oninput="calculateSedacao()" />
            <span class="sed-unit">mL/h</span>
            <span class="sed-arrow">→</span>
            <strong id="${drug.id}-dose-result">—</strong>
            <span class="sed-unit">${drug.doseUnit}</span>
          </div>
        </div>
      </div>
    </article>
  `).join("");

  calculateSedacao();
}

function calculateSedacao() {
  const weight = parseLocaleNumber(document.getElementById("sed-weight")?.value);
  const weightValid = Number.isFinite(weight) && weight > 0;

  SEDATION_INFUSIONS.forEach(drug => {
    const presentationSelect = document.getElementById(`${drug.id}-presentation`);
    const flowInput = document.getElementById(`${drug.id}-flow`);
    const doseInput = document.getElementById(`${drug.id}-dose`);
    const doseResult = document.getElementById(`${drug.id}-dose-result`);
    const flowResult = document.getElementById(`${drug.id}-flow-result`);
    const note = document.getElementById(`${drug.id}-presentation-note`);
    if (!presentationSelect || !flowInput || !doseInput || !doseResult || !flowResult || !note) return;

    const selectedIndex = Number(presentationSelect.value) || 0;
    const presentation = drug.presentations[selectedIndex] || drug.presentations[0];
    const concentration = presentation.concentration;
    const factor = drug.doseUnit.includes("/min") ? 60 : 1;

    const flow = parseLocaleNumber(flowInput.value);
    const desiredDose = parseLocaleNumber(doseInput.value);

    const calculatedDose = weightValid && Number.isFinite(flow) && flow > 0
      ? (flow * concentration) / (weight * factor)
      : NaN;
    const calculatedFlow = weightValid && Number.isFinite(desiredDose) && desiredDose > 0
      ? (desiredDose * weight * factor) / concentration
      : NaN;

    doseResult.textContent = Number.isFinite(calculatedDose) ? formatNumber(calculatedDose, 2) : "—";
    flowResult.textContent = Number.isFinite(calculatedFlow) ? formatNumber(calculatedFlow, 1) : "—";
    note.textContent = presentation.helper;
  });
}
// Compat: mantida para não quebrar chamadas legadas em HTML.
function toggleRxMedLine(checkbox) {
  if (checkbox && checkbox.dataset && checkbox.dataset.line) toggleRxMedText(checkbox.dataset.line);
}
// ── Exportação Amarrada para o Escopo Global ──────────────
Object.assign(window, {
  selectSector, goBack, openPrescription, copyPrescription, editCurrentPrescription, setRxEditMode, saveRxInlineEdit, filterDiseases,
  switchVariant, openAdmin, closeAdmin, closeAdminIfOutside, switchTab,
  renderAdminList, filterAdminList, startEdit, saveNewPrescription, updatePrescription, deletePrescription,
  addVariantField, addNewVariantField, addVariantFieldEdit,
  refreshVariantLinePicker, toggleVariantLineCheck, toggleRxMedLine, renderRxMedPicker, toggleRxMedText, handleRxMarkKey, handleVariantMarkKey, unmarkVariantLine,
  mergeBySameDisease, prepareAddTab, searchExistingDisease, selectExistingDisease, cancelAddToExisting,
  handleVariantImageUpload, addVariantImageEntry, openImageViewer, closeImageViewer,
  openIntubacao, calculateIntubacao, openSedacao, calculateSedacao,
  openPediatria, switchPedTab, calculateDose, copyPedResult, filterPedDiseases, updatePediatricPrescriptionContext,
  renderPedDrugAdmin, newPedDrug, editPedDrug, addPedPresentationField, removePedPresentationField, savePedDrug, deletePedDrug, updatePedMarkerPreview
});
