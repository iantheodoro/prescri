// ============================================================
//  app.js — Lógica principal com suporte a variantes
// ============================================================

let currentSector = "";
let currentPrescription = null;
let currentVariantIndex = 0;
let editingId = null;

function showLoading() { document.getElementById("loading").classList.add("show"); }
function hideLoading() { document.getElementById("loading").classList.remove("show"); }

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function goBack(screenId) { showScreen(screenId); }

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
    if (items.length === 0) {
      list.innerHTML = `<div class="empty-state">Nenhuma prescrição encontrada.<br/>Use o painel ⚙ para adicionar.</div>`;
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

  if (!p.variants || p.variants.length <= 1) {
    tabsEl.style.display = "none";
    return;
  }

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
  const text = variant.text || "";

  navigator.clipboard.writeText(text).then(() => {
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

// ── Editor de variantes ───────────────────────────────────
let editVariants = [];

function addVariantField(label = "", text = "") {
  const container = document.getElementById("variants-container");
  const idx = editVariants.length;
  editVariants.push({ label, text });

  const div = document.createElement("div");
  div.className = "variant-edit-block";
  div.dataset.idx = idx;
  div.innerHTML = `
    <div class="variant-edit-header">
      <input type="text" class="variant-label-input" placeholder="Nome da aba (ex: Sem Comorbidades)"
        value="${label}" onchange="updateVariantLabel(${idx}, this.value)" />
      ${idx > 0 ? `<button type="button" class="btn-remove-variant" onclick="removeVariant(${idx})">✕</button>` : ''}
    </div>
    <textarea class="variant-text-input" rows="8" placeholder="Texto da prescrição..."
      onchange="updateVariantText(${idx}, this.value)">${text}</textarea>
  `;
  container.appendChild(div);
}

function updateVariantLabel(idx, val) { editVariants[idx].label = val; }
function updateVariantText(idx, val)  { editVariants[idx].text  = val; }

function removeVariant(idx) {
  editVariants.splice(idx, 1);
  rebuildVariantFields();
}

function rebuildVariantFields() {
  const saved = [...editVariants];
  editVariants = [];
  document.getElementById("variants-container").innerHTML = "";
  saved.forEach(v => addVariantField(v.label, v.text));
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

  // Coletar variantes do formulário de nova prescrição
  const newVariants = [];
  document.querySelectorAll("#tab-add .variant-edit-block").forEach((block, i) => {
    const label = block.querySelector(".variant-label-input").value;
    const text  = block.querySelector(".variant-text-input").value;
    newVariants.push({ label, text });
  });

  if (newVariants.length === 0 || !newVariants[0].text) {
    alert("Adicione pelo menos uma variante com texto.");
    return;
  }

  showLoading();
  try {
    await window.dbAdd({
      sector:   form.sector.value,
      disease:  form.disease.value,
      variants: newVariants
    });
    form.reset();
    document.getElementById("new-variants-container").innerHTML = "";
    newEditVariants = [];
    addNewVariantField();
    await renderAdminList();
    await renderDiseaseList();
    alert("✓ Prescrição salva com sucesso!");
  } finally {
    hideLoading();
  }
}

async function updatePrescription(e) {
  e.preventDefault();

  // Sincronizar valores atuais dos textareas
  document.querySelectorAll("#variants-container .variant-edit-block").forEach((block, i) => {
    if (editVariants[i]) {
      editVariants[i].label = block.querySelector(".variant-label-input").value;
      editVariants[i].text  = block.querySelector(".variant-text-input").value;
    }
  });

  showLoading();
  try {
    await window.dbUpdate(editingId, {
      sector:   document.getElementById("edit-sector").value,
      disease:  document.getElementById("edit-disease").value,
      variants: editVariants
    });
    await renderAdminList();
    await renderDiseaseList();
    document.getElementById("tab-edit-btn").style.display = "none";
    switchTab("tab-list", document.getElementById("tab-list-btn"));
    alert("✓ Prescrição atualizada!");
  } finally {
    hideLoading();
  }
}

async function deletePrescription() {
  if (!confirm("Confirma exclusão desta prescrição?")) return;
  showLoading();
  try {
    await window.dbDelete(editingId);
    await renderAdminList();
    await renderDiseaseList();
    document.getElementById("tab-edit-btn").style.display = "none";
    switchTab("tab-list", document.getElementById("tab-list-btn"));
  } finally {
    hideLoading();
  }
}

// ── Nova prescrição — variantes ───────────────────────────
let newEditVariants = [];

function addNewVariantField(label = "", text = "") {
  const container = document.getElementById("new-variants-container");
  const idx = newEditVariants.length;
  newEditVariants.push({ label, text });

  const div = document.createElement("div");
  div.className = "variant-edit-block";
  div.dataset.idx = idx;
  div.innerHTML = `
    <div class="variant-edit-header">
      <input type="text" class="variant-label-input" placeholder="Nome da aba (ex: Sem Comorbidades)"
        value="${label}" />
      ${idx > 0 ? `<button type="button" class="btn-remove-variant" onclick="removeNewVariant(${idx})">✕</button>` : ''}
    </div>
    <textarea class="variant-text-input" rows="8" placeholder="Texto da prescrição...">${text}</textarea>
  `;
  container.appendChild(div);
}

function removeNewVariant(idx) {
  newEditVariants.splice(idx, 1);
  const saved = [...newEditVariants];
  newEditVariants = [];
  document.getElementById("new-variants-container").innerHTML = "";
  saved.forEach(v => addNewVariantField(v.label, v.text));
}

// ── Init ──────────────────────────────────────────────────
window.addEventListener("load", async () => {
  showLoading();
  try {
    await window.dbInit();
    addNewVariantField("Prescrição");
  } finally {
    hideLoading();
  }
});

// Expor funções globais
window.selectSector        = selectSector;
window.goBack              = goBack;
window.openPrescription    = openPrescription;
window.copyPrescription    = copyPrescription;
window.filterDiseases      = filterDiseases;
window.switchVariant       = switchVariant;
window.openAdmin           = openAdmin;
window.closeAdmin          = closeAdmin;
window.closeAdminIfOutside = closeAdminIfOutside;
window.switchTab           = switchTab;
window.renderAdminList     = renderAdminList;
window.startEdit           = startEdit;
window.saveNewPrescription = saveNewPrescription;
window.updatePrescription  = updatePrescription;
window.deletePrescription  = deletePrescription;
window.addVariantField     = addVariantField;
window.removeVariant       = removeVariant;
window.updateVariantLabel  = updateVariantLabel;
window.updateVariantText   = updateVariantText;
window.addNewVariantField  = addNewVariantField;
window.removeNewVariant    = removeNewVariant;
