// ============================================================
//  app.js
// ============================================================

let currentSector = "";
let currentPrescription = null;
let currentVariantIndex = 0;
let editingId = null;
let editVariants = [];
let newEditVariants = [];

function showLoading() { document.getElementById("loading").classList.add("show"); }
function hideLoading() { document.getElementById("loading").classList.remove("show"); }

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}
function goBack(id) { showScreen(id); }

async function selectSector(btn) {
  currentSector = btn.dataset.sector;
  document.getElementById("active-sector-label").textContent = currentSector;
  showScreen("screen-disease");
  await renderDiseaseList();
}

async function renderDiseaseList(filter = "") {
  const list = document.getElementById("disease-list");
  list.innerHTML = `<div class="empty-state">Carregando...</div>`;
  showLoading();
  try {
    const items = (await window.dbGetBySector(currentSector))
      .filter(p => p.disease.toLowerCase().includes(filter.toLowerCase()));
    if (!items.length) {
      list.innerHTML = `<div class="empty-state">Nenhuma prescrição encontrada.<br/>Use ⚙ para adicionar.</div>`;
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
    list.innerHTML = `<div class="empty-state">Erro ao carregar.</div>`;
  } finally { hideLoading(); }
}

function filterDiseases() {
  renderDiseaseList(document.getElementById("search-input").value);
}

async function openPrescription(id) {
  showLoading();
  try {
    const p = await window.dbGetById(id);
    if (!p) return;
    currentPrescription = p;
    currentVariantIndex = 0;
    document.getElementById("rx-sector-label").textContent = p.sector;
    document.getElementById("rx-disease-name").textContent = p.disease;
    document.getElementById("rx-date").textContent = new Date().toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric" });
    renderVariantTabs();
    renderVariantContent(0);
    document.getElementById("btn-copy").classList.remove("copied");
    document.getElementById("copy-feedback").classList.remove("show");
    showScreen("screen-prescription");
  } finally { hideLoading(); }
}

function renderVariantTabs() {
  const p = currentPrescription;
  const el = document.getElementById("variant-tabs");
  if (!p.variants || p.variants.length <= 1) { el.style.display = "none"; return; }
  el.style.display = "flex";
  el.innerHTML = p.variants.map((v, i) => `
    <button class="variant-tab ${i===0?'active':''}" onclick="switchVariant(${i}, this)">${v.label}</button>
  `).join("");
}

function switchVariant(i, btn) {
  currentVariantIndex = i;
  document.querySelectorAll(".variant-tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  renderVariantContent(i);
  document.getElementById("btn-copy").classList.remove("copied");
  document.getElementById("copy-feedback").classList.remove("show");
}

function renderVariantContent(i) {
  const p = currentPrescription;
  const v = p.variants ? p.variants[i] : { text: p.prescription || "" };
  document.getElementById("rx-text").textContent = v.text || "";
}

function copyPrescription() {
  if (!currentPrescription) return;
  const v = currentPrescription.variants
    ? currentPrescription.variants[currentVariantIndex]
    : { text: currentPrescription.prescription || "" };
  navigator.clipboard.writeText(v.text || "").then(() => {
    document.getElementById("btn-copy").classList.add("copied");
    document.getElementById("copy-feedback").classList.add("show");
    setTimeout(() => {
      document.getElementById("btn-copy").classList.remove("copied");
      document.getElementById("copy-feedback").classList.remove("show");
    }, 2500);
  });
}

// ── Admin ─────────────────────────────────────────────────
async function openAdmin() {
  document.getElementById("admin-modal").classList.add("open");
  await renderAdminList();
}
function closeAdmin() { document.getElementById("admin-modal").classList.remove("open"); }
function closeAdminIfOutside(e) { if (e.target === document.getElementById("admin-modal")) closeAdmin(); }

function switchTab(tabId, btn) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
  btn.classList.add("active");
  if (tabId === "tab-shortcuts") renderShortcutsList();
}

async function renderAdminList() {
  const filter = document.getElementById("admin-sector-filter").value;
  const list = document.getElementById("admin-list");
  list.innerHTML = `<div class="empty-state">Carregando...</div>`;
  showLoading();
  try {
    const all = filter ? await window.dbGetBySector(filter) : await window.dbGetAll();
    if (!all.length) { list.innerHTML = `<div class="empty-state">Nenhuma prescrição.</div>`; return; }
    list.innerHTML = all.map(p => `
      <div class="admin-item">
        <div class="admin-item-info">
          <span class="admin-item-sector">${p.sector}</span>
          <span class="admin-item-disease">${p.disease}</span>
          ${p.variants && p.variants.length > 1 ? `<span class="admin-item-variants">${p.variants.length} variantes</span>` : ''}
        </div>
        <button class="btn-edit-item" onclick="startEdit('${p.id}')">✎ Editar</button>
      </div>
    `).join("");
  } finally { hideLoading(); }
}

// ── Variantes ─────────────────────────────────────────────
function makeVariantBlock(label, text, idx, removeFn) {
  const div = document.createElement("div");
  div.className = "variant-edit-block";
  div.innerHTML = `
    <div class="variant-edit-header">
      <input type="text" class="variant-label-input" placeholder="Nome da aba (ex: Sem Comorbidades)" value="${label.replace(/"/g,'&quot;')}" />
      ${idx > 0 ? `<button type="button" class="btn-remove-variant" onclick="${removeFn}(${idx})">✕</button>` : ''}
    </div>
    <div class="textarea-wrap">
      <button type="button" class="btn-insert-block" onclick="openShortcutPicker(this.nextElementSibling)">⊕ Inserir Bloco</button>
      <textarea class="variant-text-input" rows="9" placeholder="Digite a prescrição aqui...">${text}</textarea>
    </div>
  `;
  return div;
}

function addVariantField(label="", text="") {
  const idx = editVariants.length;
  editVariants.push({ label, text });
  document.getElementById("variants-container").appendChild(makeVariantBlock(label, text, idx, "removeVariant"));
}

function removeVariant(idx) {
  const blocks = [...document.querySelectorAll("#variants-container .variant-edit-block")];
  editVariants = blocks.map(b => ({
    label: b.querySelector(".variant-label-input").value,
    text:  b.querySelector(".variant-text-input").value
  }));
  editVariants.splice(idx, 1);
  document.getElementById("variants-container").innerHTML = "";
  const saved = [...editVariants]; editVariants = [];
  saved.forEach(v => addVariantField(v.label, v.text));
}

function addNewVariantField(label="", text="") {
  const idx = newEditVariants.length;
  newEditVariants.push({ label, text });
  document.getElementById("new-variants-container").appendChild(makeVariantBlock(label, text, idx, "removeNewVariant"));
}

function removeNewVariant(idx) {
  const blocks = [...document.querySelectorAll("#new-variants-container .variant-edit-block")];
  newEditVariants = blocks.map(b => ({
    label: b.querySelector(".variant-label-input").value,
    text:  b.querySelector(".variant-text-input").value
  }));
  newEditVariants.splice(idx, 1);
  document.getElementById("new-variants-container").innerHTML = "";
  const saved = [...newEditVariants]; newEditVariants = [];
  saved.forEach(v => addNewVariantField(v.label, v.text));
}

function collectVariants(containerId) {
  return [...document.querySelectorAll(`#${containerId} .variant-edit-block`)].map(b => ({
    label: b.querySelector(".variant-label-input").value,
    text:  b.querySelector(".variant-text-input").value
  }));
}

async function startEdit(id) {
  showLoading();
  try {
    const p = await window.dbGetById(id);
    if (!p) return;
    editingId = id;
    document.getElementById("edit-id").value      = id;
    document.getElementById("edit-sector").value  = p.sector;
    document.getElementById("edit-disease").value = p.disease;
    editVariants = [];
    document.getElementById("variants-container").innerHTML = "";
    (p.variants && p.variants.length ? p.variants : [{ label:"Prescrição", text: p.prescription||"" }])
      .forEach(v => addVariantField(v.label, v.text));
    document.getElementById("tab-edit-btn").style.display = "inline-block";
    switchTab("tab-edit", document.getElementById("tab-edit-btn"));
  } finally { hideLoading(); }
}

async function saveNewPrescription(e) {
  e.preventDefault();
  const form = e.target;
  const variants = collectVariants("new-variants-container");
  if (!variants.length || !variants[0].text) { alert("Adicione pelo menos uma prescrição."); return; }
  showLoading();
  try {
    await window.dbAdd({ sector: form.sector.value, disease: form.disease.value, variants });
    form.reset();
    newEditVariants = [];
    document.getElementById("new-variants-container").innerHTML = "";
    addNewVariantField("Prescrição");
    await renderAdminList();
    await renderDiseaseList();
    alert("✓ Prescrição salva!");
  } finally { hideLoading(); }
}

async function updatePrescription(e) {
  e.preventDefault();
  const variants = collectVariants("variants-container");
  showLoading();
  try {
    await window.dbUpdate(editingId, {
      sector:  document.getElementById("edit-sector").value,
      disease: document.getElementById("edit-disease").value,
      variants
    });
    await renderAdminList();
    await renderDiseaseList();
    document.getElementById("tab-edit-btn").style.display = "none";
    switchTab("tab-list", document.getElementById("tab-list-btn"));
    alert("✓ Atualizado!");
  } finally { hideLoading(); }
}

async function deletePrescription() {
  if (!confirm("Excluir esta prescrição?")) return;
  showLoading();
  try {
    await window.dbDelete(editingId);
    await renderAdminList();
    await renderDiseaseList();
    document.getElementById("tab-edit-btn").style.display = "none";
    switchTab("tab-list", document.getElementById("tab-list-btn"));
  } finally { hideLoading(); }
}

// ── Shortcut picker ───────────────────────────────────────
function closeShortcutIfBg(e) {
  if (e.target === document.getElementById("shortcut-picker")) closeShortcutPicker();
}

// ── Gerenciar atalhos ─────────────────────────────────────
function renderShortcutsList() {
  const list = document.getElementById("shortcuts-list");
  const all  = shortcutsGetAll();
  if (!all.length) { list.innerHTML = `<div class="empty-state">Nenhum atalho.</div>`; return; }
  list.innerHTML = all.map(s => `
    <div class="admin-item">
      <div class="admin-item-info">
        <span class="admin-item-disease">${s.label}</span>
      </div>
      <button class="btn-edit-item" onclick="openEditShortcut('${s.id}')">✎ Editar</button>
    </div>
  `).join("");
}

function openNewShortcut() {
  document.getElementById("shortcut-modal-title").textContent = "Novo Atalho";
  document.getElementById("shortcut-edit-id").value = "";
  document.getElementById("shortcut-label").value   = "";
  document.getElementById("shortcut-text").value    = "";
  document.getElementById("shortcut-delete-btn").style.display = "none";
  document.getElementById("shortcut-modal").classList.add("open");
}

function openEditShortcut(id) {
  const s = shortcutsGetAll().find(x => x.id === id);
  if (!s) return;
  document.getElementById("shortcut-modal-title").textContent = "Editar Atalho";
  document.getElementById("shortcut-edit-id").value = s.id;
  document.getElementById("shortcut-label").value   = s.label;
  document.getElementById("shortcut-text").value    = s.text;
  document.getElementById("shortcut-delete-btn").style.display = "inline-block";
  document.getElementById("shortcut-modal").classList.add("open");
}

function closeShortcutModal() { document.getElementById("shortcut-modal").classList.remove("open"); }
function closeShortcutModalIfBg(e) { if (e.target === document.getElementById("shortcut-modal")) closeShortcutModal(); }

function saveShortcut(e) {
  e.preventDefault();
  const id    = document.getElementById("shortcut-edit-id").value;
  const label = document.getElementById("shortcut-label").value.trim();
  const text  = document.getElementById("shortcut-text").value;
  if (id) { shortcutsUpdate(id, { label, text }); }
  else    { shortcutsAdd({ label, text }); }
  closeShortcutModal();
  renderShortcutsList();
}

function deleteShortcut() {
  const id = document.getElementById("shortcut-edit-id").value;
  if (!id || !confirm("Excluir este atalho?")) return;
  shortcutsDelete(id);
  closeShortcutModal();
  renderShortcutsList();
}

// ── Init ──────────────────────────────────────────────────
window.addEventListener("load", async () => {
  showLoading();
  try {
    await window.dbInit();
    addNewVariantField("Prescrição");
  } finally { hideLoading(); }
});

Object.assign(window, {
  selectSector, goBack, openPrescription, copyPrescription, filterDiseases,
  switchVariant, openAdmin, closeAdmin, closeAdminIfOutside, switchTab,
  renderAdminList, startEdit, saveNewPrescription, updatePrescription, deletePrescription,
  addVariantField, removeVariant, addNewVariantField, removeNewVariant,
  closeShortcutIfBg, renderShortcutsList,
  openNewShortcut, openEditShortcut, closeShortcutModal, closeShortcutModalIfBg,
  saveShortcut, deleteShortcut
});

// ══════════════════════════════════════════════════════════
//  PEDIATRIA
// ══════════════════════════════════════════════════════════

function openPediatria() {
  showScreen("screen-pediatria");
  initPedCalculator();
  renderPedDiseaseList();
}

function switchPedTab(tabId, btn) {
  document.querySelectorAll(".ped-tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".ped-tab").forEach(t => t.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
  btn.classList.add("active");
}

function initPedCalculator() {
  const sel = document.getElementById("ped-drug");
  if (sel.options.length > 1) return; // já populado
  PEDIATRIC_DRUGS.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = `${d.name} — ${d.category}`;
    sel.appendChild(opt);
  });
}

function calculateDose() {
  const weight = parseFloat(document.getElementById("ped-weight").value);
  const drugId = document.getElementById("ped-drug").value;
  const result = document.getElementById("ped-result");
  const placeholder = document.getElementById("ped-placeholder");

  if (!weight || !drugId || weight < 1 || weight > 150) {
    result.style.display = "none";
    placeholder.style.display = "flex";
    return;
  }

  const drug = PEDIATRIC_DRUGS.find(d => d.id === drugId);
  if (!drug) return;

  // Calcular dose
  let dosePerDose, label;
  if (drug.dose_by_age) {
    // dose fixa por faixa — usa peso como proxy (sem idade explícita)
    // estimativa: < 15 kg = 2–6 anos, 15–30 kg = 6–12 anos
    let ageBucket = weight < 15 ? 5 : weight < 30 ? 8 : 14;
    const bucket = drug.dose_by_age.find(b => ageBucket >= b.age_min && ageBucket < b.age_max)
                || drug.dose_by_age[drug.dose_by_age.length - 1];
    dosePerDose = bucket.dose;
    label = `${dosePerDose} mg (dose fixa por faixa etária)`;
  } else if (drug.dose_type === "daily") {
    // dose diária total
    const daily = Math.min(drug.dose_per_kg * weight, drug.dose_max);
    dosePerDose = Math.round((daily / 3) * 10) / 10; // dividir em 3
    label = `${Math.round(daily * 10) / 10} mg/dia → ${dosePerDose} mg por dose`;
  } else {
    dosePerDose = Math.min(drug.dose_per_kg * weight, drug.dose_max);
    dosePerDose = Math.round(dosePerDose * 10) / 10;
    label = `${dosePerDose} mg`;
  }

  // Preencher resultado
  document.getElementById("ped-result-drug").textContent = drug.name;
  document.getElementById("ped-result-route").textContent = drug.route;
  document.getElementById("ped-dose-per-kg").textContent =
    drug.dose_per_kg ? `${drug.dose_per_kg} mg/kg` : "Dose fixa por faixa etária";
  document.getElementById("ped-dose-calc").textContent = label;
  document.getElementById("ped-dose-interval").textContent = drug.interval;
  document.getElementById("ped-notes").textContent = drug.notes;

  // Apresentações
  const presList = document.getElementById("ped-pres-list");
  presList.innerHTML = drug.presentations.map(p => {
    if (p.dose_fixed_label) {
      return `<div class="ped-pres-item">
        <span class="ped-pres-name">${p.label}</span>
        <span class="ped-pres-vol">${p.dose_fixed_label}</span>
      </div>`;
    }
    if (p.drop_mg) {
      const gotas = Math.round(dosePerDose / p.drop_mg);
      return `<div class="ped-pres-item">
        <span class="ped-pres-name">${p.label}</span>
        <span class="ped-pres-vol">${gotas} gotas</span>
      </div>`;
    }
    if (p.fixed_mg) {
      const comprimidos = dosePerDose / p.fixed_mg;
      const fracLabel = comprimidos >= 1
        ? `${comprimidos % 1 === 0 ? comprimidos : comprimidos.toFixed(1)} comprimido(s)`
        : `${(comprimidos).toFixed(2)} comprimido — atenção: fracionar`;
      return `<div class="ped-pres-item">
        <span class="ped-pres-name">${p.label}</span>
        <span class="ped-pres-vol">${fracLabel}</span>
      </div>`;
    }
    if (p.concentration) {
      const vol = Math.round((dosePerDose / p.concentration) * 10) / 10;
      return `<div class="ped-pres-item">
        <span class="ped-pres-name">${p.label}</span>
        <span class="ped-pres-vol">${vol} mL</span>
      </div>`;
    }
    return "";
  }).join("");

  result.style.display = "block";
  placeholder.style.display = "none";
}

function copyPedResult() {
  const weight = document.getElementById("ped-weight").value;
  const drugId = document.getElementById("ped-drug").value;
  const drug = PEDIATRIC_DRUGS.find(d => d.id === drugId);
  if (!drug) return;

  const doseCalc = document.getElementById("ped-dose-calc").textContent;
  const interval = document.getElementById("ped-dose-interval").textContent;
  const pres = [...document.querySelectorAll(".ped-pres-item")].map(el => {
    const name = el.querySelector(".ped-pres-name").textContent;
    const vol  = el.querySelector(".ped-pres-vol").textContent;
    return `  • ${name}: ${vol}`;
  }).join("\n");

  const text = `${drug.name} — Peso: ${weight} kg
Dose: ${doseCalc}
Intervalo: ${interval}
Apresentações:
${pres}
Obs: ${drug.notes}`;

  navigator.clipboard.writeText(text).then(() => {
    const fb = document.getElementById("ped-copy-feedback");
    fb.classList.add("show");
    setTimeout(() => fb.classList.remove("show"), 2500);
  });
}

async function renderPedDiseaseList(filter = "") {
  const list = document.getElementById("ped-disease-list");
  list.innerHTML = `<div class="empty-state">Carregando...</div>`;
  showLoading();
  try {
    const items = (await window.dbGetBySector("Pediatria"))
      .filter(p => p.disease.toLowerCase().includes(filter.toLowerCase()));
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
    list.innerHTML = `<div class="empty-state">Erro ao carregar.</div>`;
  } finally { hideLoading(); }
}

function filterPedDiseases() {
  renderPedDiseaseList(document.getElementById("ped-search").value);
}

window.openPediatria     = openPediatria;
window.switchPedTab      = switchPedTab;
window.calculateDose     = calculateDose;
window.copyPedResult     = copyPedResult;
window.filterPedDiseases = filterPedDiseases;
