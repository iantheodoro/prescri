// ============================================================
//  app.js — Lógica principal do aplicativo
// ============================================================

let currentSector = "";
let currentPrescription = null;
let editingId = null;

// ── Navegação ─────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const target = document.getElementById(id);
  target.classList.add("active");
  // Trigger reflow for animation
  void target.offsetWidth;
  target.classList.add("anim-in");
  setTimeout(() => target.classList.remove("anim-in"), 600);
}

function goBack(screenId) {
  showScreen(screenId);
}

// ── Seleção de setor ──────────────────────────────────────

function selectSector(btn) {
  currentSector = btn.dataset.sector;
  document.getElementById("active-sector-label").textContent = currentSector;
  renderDiseaseList();
  showScreen("screen-disease");
}

// ── Lista de doenças ──────────────────────────────────────

function renderDiseaseList(filter = "") {
  const list = document.getElementById("disease-list");
  const items = dbGetBySector(currentSector).filter(p =>
    p.disease.toLowerCase().includes(filter.toLowerCase())
  );

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
}

function filterDiseases() {
  const q = document.getElementById("search-input").value;
  renderDiseaseList(q);
}

// ── Prescrição ────────────────────────────────────────────

function openPrescription(id) {
  const p = dbGetById(id);
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
}

function copyPrescription() {
  if (!currentPrescription) return;
  const text = currentPrescription.prescription;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById("btn-copy");
    const fb = document.getElementById("copy-feedback");
    btn.classList.add("copied");
    fb.classList.add("show");
    setTimeout(() => {
      btn.classList.remove("copied");
      fb.classList.remove("show");
    }, 2500);
  });
}

// ── Admin ─────────────────────────────────────────────────

function openAdmin() {
  document.getElementById("admin-modal").classList.add("open");
  renderAdminList();
}

function closeAdmin() {
  document.getElementById("admin-modal").classList.remove("open");
}

function closeAdminIfOutside(e) {
  if (e.target === document.getElementById("admin-modal")) closeAdmin();
}

function switchTab(tabId, btn) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
  btn.classList.add("active");
}

function renderAdminList() {
  const filter = document.getElementById("admin-sector-filter").value;
  const all = filter ? dbGetBySector(filter) : dbGetAll();
  const list = document.getElementById("admin-list");

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
}

function startEdit(id) {
  const p = dbGetById(id);
  if (!p) return;
  editingId = id;
  document.getElementById("edit-id").value = id;
  document.getElementById("edit-sector").value = p.sector;
  document.getElementById("edit-disease").value = p.disease;
  document.getElementById("edit-prescription").value = p.prescription;

  document.getElementById("tab-edit-btn").style.display = "inline-block";
  const editTab = document.getElementById("tab-edit-btn");
  switchTab("tab-edit", editTab);
}

function saveNewPrescription(e) {
  e.preventDefault();
  const form = e.target;
  dbAdd({
    sector: form.sector.value,
    disease: form.disease.value,
    prescription: form.prescription.value
  });
  form.reset();
  renderAdminList();
  renderDiseaseList();
  alert("✓ Prescrição salva com sucesso!");
}

function updatePrescription(e) {
  e.preventDefault();
  dbUpdate(editingId, {
    sector: document.getElementById("edit-sector").value,
    disease: document.getElementById("edit-disease").value,
    prescription: document.getElementById("edit-prescription").value
  });
  renderAdminList();
  renderDiseaseList();
  document.getElementById("tab-edit-btn").style.display = "none";
  const listTab = document.querySelector(".tab");
  switchTab("tab-list", listTab);
  alert("✓ Prescrição atualizada!");
}

function deletePrescription() {
  if (!confirm("Confirma exclusão desta prescrição?")) return;
  dbDelete(editingId);
  renderAdminList();
  renderDiseaseList();
  document.getElementById("tab-edit-btn").style.display = "none";
  const listTab = document.querySelector(".tab");
  switchTab("tab-list", listTab);
}
