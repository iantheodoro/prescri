// ============================================================
//  app.js — Lógica principal com variantes + atalhos
// ============================================================

let currentSector = "";
let currentPrescription = null;
let currentVariantIndex = 0;
let editingId = null;
let editVariants = [];
let newEditVariants = [];

// ── Loading ───────────────────────────────────────────────
function showLoading() { document.getElementById("loading").classList.add("show"); }
function hideLoading() { document.getElementById("loading").classList.remove("show"); }

// ── Navegação ─────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}
function goBack(screenId) { showScreen(screenId); }

// ── Setor ─────────────────────────────────────────────────
async function selectSector(btn) {
  currentSector = btn.dataset.sector;
  document.getElementById("active-sector-label").textContent = currentSector;
  showScreen("screen-disease");
  await renderDiseaseList();
}

// ── Lista de doenças ──────────────────────────────────────
async function renderDiseaseList(filter = "") {
  const list = document.getElementById("disease-list");
  list.innerHTML = `<div class="empty-state">Carregando...</div>`;
  showLoading();
  try {
    const items = (await window.dbGetBySector(currentSector))
      .filter(p => p.disease.toLowerCase().includes(filter.toLowerCase()));
    if (items.length === 0) {
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
    list.innerHTML = `<div class="empty-state">Erro ao carregar. Verifique a conexão.</div>`;
  } finally {
    hideLoading();
  }
}

function filterDiseases() {
  renderDiseaseList(document.getElementById("search-input").value);
}

// ── Prescrição ────────────────────────────────────────────
async function openPrescription(id) {
  showLoading();
  try {
    const p = await window.dbGetById(id);
    if (!p) return;
    currentPrescription = p;
    currentVariantIndex = 0;
    document.getElementById("rx-sector-label").textContent = p.sector;
    document.getElementById("rx-disease-name").textContent = p.disease;
    document.getElementById("rx-date").textContent = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric"
    });
    renderVariantTabs();
    renderVariantContent(0);
    document.getElementById("btn-copy").classList.remove("copied");
    document.getElementById("copy-feedback").classList.remove("show");
    showScreen("screen-prescription");
  } finally {
    hideLoading();
  }
}

function renderVariantTabs() {
  const p = currentPrescription;
  const tabsEl = document.getElementById("variant-tabs");
  if (!p.variants || p.variants.length <= 1) { tabsEl.style.display = "none"; return; }
  tabsEl.style.display = "flex";
  tabsEl.innerHTML = p.variants.map((v, i) => `
    <button class="variant-tab ${i === 0 ? 'active' : ''}" onclick="switchVariant(${i}, this)">
      ${v.label}
    </button>
  `).join("");
}

function switchVariant(index, btn) {
  currentVariantIndex = index;
  document.querySelectorAll(".variant-tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  renderVariantContent(index);
  document.getElementById("btn-copy").classList.remove("copied");
  document.getElementById("copy-feedback").classList.remove("show");
}

function renderVariantContent(index) {
  const p = currentPrescription;
  const variant = p.variants ? p.variants[index] : { text: p.prescription || "" };
  document.getElementById("rx-text").textContent = variant.text || "";
}

function copyPrescription() {
  if (!currentPrescription) return;
  const variant = currentPrescription.variants
    ? currentPrescription.variants[currentVariantIndex]
    : { text: currentPrescription.prescription || "" };
  navigator.clipboard.writeText(variant.text || "").then(() => {
    const btn = document.getElementById("btn-copy");
    const fb  = document.getElementById("copy-feedback");
    btn.classList.add("copied");
    fb.classList.add("show");
    setTimeout(() => { btn.classList.remove("copied"); fb.classList.remove("show"); }, 2500);
  });
}

// ── Admin ─────────────────────────────────────────────────
async function openAdmin() {
  document.getElementById("admin-modal").classList.add("open");
  await renderAdminList();
}
function closeAdmin() { document.getElementById("admin-modal").classList.remove("open"); }
function closeAdminIfOutside(e) {
  if (e.target === document.getElementById("admin-modal")) closeAdmin();
}

function switchTab(tabId, btn) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
  btn.classList.add("active");
  if (tabId === "tab-shortcuts") renderShortcutsList();
}

async function renderAdminList() {
  const filter = document.getElementById("admin-sector-filter").value;
  const list   = document.getElementById("admin-list");
  list.innerHTML = `<div class="empty-state">Carregando...</div>`;
  showLoading();
  try {
    const all = filter ? await window.dbGetBySector(filter) : await window.dbGetAll();
    if (all.length === 0) {
      list.innerHTML = `<div class="empty-state">Nenhuma prescrição cadastrada.</div>`;
      return;
    }
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
  } finally {
    hideLoading();
  }
}

// ── Variantes ─────────────────────────────────────────────
function makeVariantBlock(label, text, idx, containerId, removeFunc) {
  const div = document.createElement("div");
  div.className = "variant-edit-block";
  div.dataset.idx = idx;
  div.innerHTML = `
    <div class="variant-edit-header">
      <input type="text" class="variant-label-input" placeholder="Nome da aba (ex: Sem Comorbidades)" value="${label.replace(/"/g,'&quot;')}" />
      ${idx > 0 ? `<button type="button" class="btn-remove-variant" onclick="${removeFunc}(${idx})">✕</button>` : ''}
    </div>
    <div class="textarea-wrap">
      <textarea class="variant-text-input" rows="8" placeholder="Digite a prescrição... use /atalho para inserir blocos prontos">${text}</textarea>
      <div class="shortcut-suggestions" style="display:none"></div>
    </div>
  `;
  // Attach shortcut listener
  const ta = div.querySelector(".variant-text-input");
  const sg = div.querySelector(".shortcut-suggestions");
  ta.addEventListener("keyup", () => detectShortcutSuggestion(ta, sg));
  ta.addEventListener("blur", () => setTimeout(() => sg.style.display = "none", 200));
  return div;
}

function addVariantField(label = "", text = "") {
  const container = document.getElementById("variants-container");
  const idx = editVariants.length;
  editVariants.push({ label, text });
  container.appendChild(makeVariantBlock(label, text, idx, "variants-container", "removeVariant"));
}

function removeVariant(idx) {
  editVariants.splice(idx, 1);
  rebuildContainer("variants-container", editVariants, "removeVariant", addVariantField);
}

function addNewVariantField(label = "", text = "") {
  const container = document.getElementById("new-variants-container");
  const idx = newEditVariants.length;
  newEditVariants.push({ label, text });
  container.appendChild(makeVariantBlock(label, text, idx, "new-variants-container", "removeNewVariant"));
}

function removeNewVariant(idx) {
  newEditVariants.splice(idx, 1);
  rebuildContainer("new-variants-container", newEditVariants, "removeNewVariant", addNewVariantField);
}

function rebuildContainer(containerId, list, removeFn, addFn) {
  const saved = list.splice(0);
  document.getElementById(containerId).innerHTML = "";
  if (containerId === "variants-container") editVariants = [];
  else newEditVariants = [];
  saved.forEach(v => addFn(v.label, v.text));
}

function collectVariants(containerId) {
  const variants = [];
  document.querySelectorAll(`#${containerId} .variant-edit-block`).forEach(block => {
    variants.push({
      label: block.querySelector(".variant-label-input").value,
      text:  block.querySelector(".variant-text-input").value
    });
  });
  return variants;
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
    if (p.variants && p.variants.length > 0) {
      p.variants.forEach(v => addVariantField(v.label, v.text));
    } else {
      addVariantField("Prescrição", p.prescription || "");
    }
    document.getElementById("tab-edit-btn").style.display = "inline-block";
    switchTab("tab-edit", document.getElementById("tab-edit-btn"));
  } finally {
    hideLoading();
  }
}

async function saveNewPrescription(e) {
  e.preventDefault();
  const form = e.target;
  const variants = collectVariants("new-variants-container");
  if (!variants.length || !variants[0].text) { alert("Adicione pelo menos uma variante com texto."); return; }
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
      sector:   document.getElementById("edit-sector").value,
      disease:  document.getElementById("edit-disease").value,
      variants
    });
    await renderAdminList();
    await renderDiseaseList();
    document.getElementById("tab-edit-btn").style.display = "none";
    switchTab("tab-list", document.getElementById("tab-list-btn"));
    alert("✓ Prescrição atualizada!");
  } finally { hideLoading(); }
}

async function deletePrescription() {
  if (!confirm("Confirma exclusão?")) return;
  showLoading();
  try {
    await window.dbDelete(editingId);
    await renderAdminList();
    await renderDiseaseList();
    document.getElementById("tab-edit-btn").style.display = "none";
    switchTab("tab-list", document.getElementById("tab-list-btn"));
  } finally { hideLoading(); }
}

// ── Atalhos ───────────────────────────────────────────────
function renderShortcutsList() {
  const list = document.getElementById("shortcuts-list");
  const all  = shortcutsGetAll();
  if (!all.length) { list.innerHTML = `<div class="empty-state">Nenhum atalho cadastrado.</div>`; return; }
  list.innerHTML = all.map(s => `
    <div class="admin-item">
      <div class="admin-item-info">
        <span class="admin-item-sector" style="color:var(--yellow)">${s.trigger}</span>
        <span class="admin-item-disease">${s.label}</span>
      </div>
      <button class="btn-edit-item" onclick="openEditShortcut('${s.id}')">✎ Editar</button>
    </div>
  `).join("");
}

function openNewShortcut() {
  document.getElementById("shortcut-modal-title").textContent = "Novo Atalho";
  document.getElementById("shortcut-edit-id").value = "";
  document.getElementById("shortcut-trigger").value = "/";
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
  document.getElementById("shortcut-trigger").value = s.trigger;
  document.getElementById("shortcut-label").value   = s.label;
  document.getElementById("shortcut-text").value    = s.text;
  document.getElementById("shortcut-delete-btn").style.display = "inline-block";
  document.getElementById("shortcut-modal").classList.add("open");
}

function closeShortcutModal() { document.getElementById("shortcut-modal").classList.remove("open"); }
function closeShortcutIfOutside(e) {
  if (e.target === document.getElementById("shortcut-modal")) closeShortcutModal();
}

function saveShortcut(e) {
  e.preventDefault();
  const id      = document.getElementById("shortcut-edit-id").value;
  let trigger   = document.getElementById("shortcut-trigger").value.trim();
  const label   = document.getElementById("shortcut-label").value.trim();
  const text    = document.getElementById("shortcut-text").value;

  if (!trigger.startsWith("/")) trigger = "/" + trigger;

  if (id) {
    shortcutsUpdate(id, { trigger, label, text });
  } else {
    shortcutsAdd({ trigger, label, text });
  }
  closeShortcutModal();
  renderShortcutsList();
}

function deleteShortcut() {
  const id = document.getElementById("shortcut-edit-id").value;
  if (!id || !confirm("Confirma exclusão do atalho?")) return;
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

// Expor globais
Object.assign(window, {
  selectSector, goBack, openPrescription, copyPrescription, filterDiseases,
  switchVariant, openAdmin, closeAdmin, closeAdminIfOutside, switchTab,
  renderAdminList, startEdit, saveNewPrescription, updatePrescription, deletePrescription,
  addVariantField, removeVariant, addNewVariantField, removeNewVariant,
  renderShortcutsList, openNewShortcut, openEditShortcut,
  closeShortcutModal, closeShortcutIfOutside, saveShortcut, deleteShortcut
});
