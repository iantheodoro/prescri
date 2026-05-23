// ============================================================
//  app.js — Lógica principal (async/await para Firebase)
// ============================================================

let currentSector = "";
let currentPrescription = null;
let editingId = null;

// ── Loading helper ────────────────────────────────────────
function showLoading() { document.getElementById("loading").classList.add("show"); }
function hideLoading() { document.getElementById("loading").classList.remove("show"); }

// ── Navegação ─────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function goBack(screenId) { showScreen(screenId); }

// ── Seleção de setor ──────────────────────────────────────
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
      list.innerHTML = `<div class="empty-state">Nenhuma prescrição encontrada.<br/>Use o painel ⚙ para adicionar.</div>`;
      return;
    }
    list.innerHTML = items.map(p => `
      <button class="disease-item" onclick="openPrescription('${p.id}')">
        <span class="disease-arrow">→</span>
        <span class="disease-label">${p.disease}</span>
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
    document.getElementById("rx-sector-label").textContent = p.sector;
    document.getElementById("rx-disease-name").textContent = p.disease;
    document.getElementById("rx-text").textContent = p.prescription;
    document.getElementById("rx-date").textContent = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric"
    });
    document.getElementById("btn-copy").classList.remove("copied");
    document.getElementById("copy-feedback").classList.remove("show");
    showScreen("screen-prescription");
  } finally {
    hideLoading();
  }
}

function copyPrescription() {
  if (!currentPrescription) return;
  navigator.clipboard.writeText(currentPrescription.prescription).then(() => {
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
function closeAdminIfOutside(e) { if (e.target === document.getElementById("admin-modal")) closeAdmin(); }

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
        </div>
        <button class="btn-edit-item" onclick="startEdit('${p.id}')">✎ Editar</button>
      </div>
    `).join("");
  } finally {
    hideLoading();
  }
}

async function startEdit(id) {
  showLoading();
  try {
    const p = await window.dbGetById(id);
    if (!p) return;
    editingId = id;
    document.getElementById("edit-id").value        = id;
    document.getElementById("edit-sector").value    = p.sector;
    document.getElementById("edit-disease").value   = p.disease;
    document.getElementById("edit-prescription").value = p.prescription;
    document.getElementById("tab-edit-btn").style.display = "inline-block";
    switchTab("tab-edit", document.getElementById("tab-edit-btn"));
  } finally {
    hideLoading();
  }
}

async function saveNewPrescription(e) {
  e.preventDefault();
  const form = e.target;
  showLoading();
  try {
    await window.dbAdd({
      sector:       form.sector.value,
      disease:      form.disease.value,
      prescription: form.prescription.value
    });
    form.reset();
    await renderAdminList();
    await renderDiseaseList();
    alert("✓ Prescrição salva com sucesso!");
  } finally {
    hideLoading();
  }
}

async function updatePrescription(e) {
  e.preventDefault();
  showLoading();
  try {
    await window.dbUpdate(editingId, {
      sector:       document.getElementById("edit-sector").value,
      disease:      document.getElementById("edit-disease").value,
      prescription: document.getElementById("edit-prescription").value
    });
    await renderAdminList();
    await renderDiseaseList();
    document.getElementById("tab-edit-btn").style.display = "none";
    switchTab("tab-list", document.querySelector(".tab"));
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
    switchTab("tab-list", document.querySelector(".tab"));
  } finally {
    hideLoading();
  }
}

// ── Init ──────────────────────────────────────────────────
window.addEventListener("load", async () => {
  showLoading();
  try { await window.dbInit(); } finally { hideLoading(); }
});

// Expor funções para os onclick do HTML
window.selectSector        = selectSector;
window.goBack              = goBack;
window.openPrescription    = openPrescription;
window.copyPrescription    = copyPrescription;
window.filterDiseases      = filterDiseases;
window.openAdmin           = openAdmin;
window.closeAdmin          = closeAdmin;
window.closeAdminIfOutside = closeAdminIfOutside;
window.switchTab           = switchTab;
window.renderAdminList     = renderAdminList;
window.startEdit           = startEdit;
window.saveNewPrescription = saveNewPrescription;
window.updatePrescription  = updatePrescription;
window.deletePrescription  = deletePrescription;
