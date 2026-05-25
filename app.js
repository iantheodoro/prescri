// ============================================================
//  app.js — lógica principal completa
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
function goBack(id) { showScreen(id); }

// ── Setor ─────────────────────────────────────────────────
async function selectSector(btn) {
  currentSector = btn.dataset.sector;
  document.getElementById("active-sector-label").textContent = currentSector;
  showScreen("screen-disease");
  await renderDiseaseList();
}

// ── Lista doenças (alfabética) ────────────────────────────
async function renderDiseaseList(filter = "") {
  const list = document.getElementById("disease-list");
  list.innerHTML = `<div class="empty-state">Carregando...</div>`;
  showLoading();
  try {
    let items = await window.dbGetBySector(currentSector);
    items = items
      .filter(p => p.disease.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => a.disease.localeCompare(b.disease, "pt"));
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
    <button class="variant-tab ${i===0?'active':''}" onclick="switchVariant(${i},this)">${v.label}</button>
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
  if (tabId === "tab-ped-drugs") renderPedDrugsList();
}

async function renderAdminList() {
  const filter = document.getElementById("admin-sector-filter").value;
  const list = document.getElementById("admin-list");
  list.innerHTML = `<div class="empty-state">Carregando...</div>`;
  showLoading();
  try {
    let all = filter ? await window.dbGetBySector(filter) : await window.dbGetAll();
    all = all.sort((a, b) => a.disease.localeCompare(b.disease, "pt"));
    if (!all.length) { list.innerHTML = `<div class="empty-state">Nenhuma prescrição.</div>`; return; }
    list.innerHTML = all.map(p => `
      <div class="admin-item">
        <div class="admin-item-info">
          <span class="admin-item-sector">${p.sector}</span>
          <span class="admin-item-disease">${p.disease}</span>
          ${p.variants && p.variants.length > 1 ? `<span class="admin-item-variants">${p.variants.length} var.</span>` : ''}
        </div>
        <button class="btn-edit-item" onclick="startEdit('${p.id}')">✎</button>
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
      <input type="text" class="variant-label-input" placeholder="Nome da aba" value="${label.replace(/"/g,'&quot;')}"/>
      ${idx > 0 ? `<button type="button" class="btn-remove-variant" onclick="${removeFn}(${idx})">✕</button>` : ''}
    </div>
    <div class="textarea-wrap">
      <button type="button" class="btn-insert-block" onclick="openShortcutPicker(this.nextElementSibling)">⊕ Inserir Bloco</button>
      <textarea class="variant-text-input" rows="9" placeholder="Digite a prescrição...">${text}</textarea>
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
  const saved = collectVariants("variants-container");
  saved.splice(idx, 1);
  editVariants = [];
  document.getElementById("variants-container").innerHTML = "";
  saved.forEach(v => addVariantField(v.label, v.text));
}

function addNewVariantField(label="", text="") {
  const idx = newEditVariants.length;
  newEditVariants.push({ label, text });
  document.getElementById("new-variants-container").appendChild(makeVariantBlock(label, text, idx, "removeNewVariant"));
}

function removeNewVariant(idx) {
  const saved = collectVariants("new-variants-container");
  saved.splice(idx, 1);
  newEditVariants = [];
  document.getElementById("new-variants-container").innerHTML = "";
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
    if (currentSector === form.sector.value) await renderDiseaseList();
    alert("✓ Salvo!");
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
  if (!confirm("Excluir?")) return;
  showLoading();
  try {
    await window.dbDelete(editingId);
    await renderAdminList();
    await renderDiseaseList();
    document.getElementById("tab-edit-btn").style.display = "none";
    switchTab("tab-list", document.getElementById("tab-list-btn"));
  } finally { hideLoading(); }
}

// ── Shortcuts ─────────────────────────────────────────────
function closeShortcutIfBg(e) { if (e.target === document.getElementById("shortcut-picker")) closeShortcutPicker(); }

function renderShortcutsList() {
  const list = document.getElementById("shortcuts-list");
  const all  = shortcutsGetAll();
  list.innerHTML = all.length ? all.map(s => `
    <div class="admin-item">
      <div class="admin-item-info"><span class="admin-item-disease">${s.label}</span></div>
      <button class="btn-edit-item" onclick="openEditShortcut('${s.id}')">✎</button>
    </div>
  `).join("") : `<div class="empty-state">Nenhum atalho.</div>`;
}

function openNewShortcut() {
  document.getElementById("shortcut-modal-title").textContent = "Novo Atalho";
  document.getElementById("shortcut-edit-id").value = "";
  document.getElementById("shortcut-label").value = "";
  document.getElementById("shortcut-text").value = "";
  document.getElementById("shortcut-delete-btn").style.display = "none";
  document.getElementById("shortcut-modal").classList.add("open");
}

function openEditShortcut(id) {
  const s = shortcutsGetAll().find(x => x.id === id);
  if (!s) return;
  document.getElementById("shortcut-modal-title").textContent = "Editar Atalho";
  document.getElementById("shortcut-edit-id").value = s.id;
  document.getElementById("shortcut-label").value = s.label;
  document.getElementById("shortcut-text").value = s.text;
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
  id ? shortcutsUpdate(id, { label, text }) : shortcutsAdd({ label, text });
  closeShortcutModal();
  renderShortcutsList();
}

function deleteShortcut() {
  const id = document.getElementById("shortcut-edit-id").value;
  if (!id || !confirm("Excluir atalho?")) return;
  shortcutsDelete(id);
  closeShortcutModal();
  renderShortcutsList();
}


window.openDrugManager       = openDrugManager;
window.closeDrugManager      = closeDrugManager;
window.closeDrugManagerIfBg  = closeDrugManagerIfBg;
window.renderDrugManagerList = renderDrugManagerList;
window.openEditDrug          = openEditDrug;
window.saveDrugEdit          = saveDrugEdit;
window.deleteDrug            = deleteDrug;
window.switchDmTab           = switchDmTab;
