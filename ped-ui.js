// ============================================================
//  ped-ui.js — Interface da calculadora pediátrica
// ============================================================

let pedState = {
  weight: null,
  age: null,
  drugId: null,
  route: null,
  presId: null,
  doseOverride: null,   // dose manual em mg
  drug: null
};

function openPediatria() {
  showScreen("screen-pediatria");
  initPedDrugSelect();
  renderPedDiseaseList();
}

function switchPedTab(tabId, btn) {
  document.querySelectorAll(".ped-tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".ped-tab").forEach(t => t.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
  btn.classList.add("active");
}

// ── Popula select de medicamentos ─────────────────────────
function initPedDrugSelect() {
  const sel = document.getElementById("ped-drug");
  const current = sel.value;
  sel.innerHTML = `<option value="">Selecionar medicamento...</option>`;

  // Agrupar por categoria
  const drugs = pedDrugsGet();
  const categories = [...new Set(drugs.map(d => d.category))].sort();
  categories.forEach(cat => {
    const group = document.createElement("optgroup");
    group.label = cat;
    drugs.filter(d => d.category === cat).sort((a,b) => a.name.localeCompare(b.name)).forEach(d => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = d.name;
      if (d.id === current) opt.selected = true;
      group.appendChild(opt);
    });
    sel.appendChild(group);
  });
}

// ── Evento principal: recalcular ao mudar qualquer campo ──
function onPedInput() {
  pedState.weight = parseFloat(document.getElementById("ped-weight").value) || null;
  pedState.age    = parseFloat(document.getElementById("ped-age").value) || null;
  pedState.drugId = document.getElementById("ped-drug").value || null;
  pedState.doseOverride = null; // reset ao trocar droga/peso

  if (!pedState.weight || !pedState.drugId) {
    document.getElementById("ped-result").style.display = "none";
    document.getElementById("ped-placeholder").style.display = "flex";
    return;
  }

  pedState.drug = pedDrugsGetOne(pedState.drugId);
  if (!pedState.drug) return;

  // Calcular dose
  const calc = pedCalcDoseMg(pedState.drug, pedState.weight, pedState.age || 0);
  pedState.doseOverride = calc.dose_mg;

  renderPedResult(calc);
}

function renderPedResult(calc) {
  const drug = pedState.drug;
  document.getElementById("ped-placeholder").style.display = "none";
  document.getElementById("ped-result").style.display = "block";

  // Header
  document.getElementById("ped-drug-name").textContent  = drug.name;
  document.getElementById("ped-drug-cat").textContent   = drug.category;

  // Dose info
  document.getElementById("ped-dose-per-kg-val").textContent =
    drug.dose_mode === "age"
      ? `Dose por faixa etária`
      : `${drug.dose_per_kg} mg/kg/dose`;

  document.getElementById("ped-dose-mg-input").value = pedState.doseOverride;

  if (calc.is_daily) {
    document.getElementById("ped-dose-daily").style.display = "block";
    document.getElementById("ped-dose-daily").textContent = `Dose diária: ${calc.daily_mg} mg → dividir de ${drug.interval}`;
  } else {
    document.getElementById("ped-dose-daily").style.display = "none";
  }

  // Vias
  renderRouteButtons();

  // Apresentações
  renderPresentationOptions();

  // Prescrição editável
  updateEditablePrescription();
}

function renderRouteButtons() {
  const drug = pedState.drug;
  if (!pedState.route || !drug.routes.includes(pedState.route)) {
    pedState.route = drug.default_route || drug.routes[0];
  }
  const container = document.getElementById("ped-routes");
  container.innerHTML = drug.routes.map(r => `
    <button type="button" class="route-btn ${r === pedState.route ? 'active' : ''}"
      onclick="selectRoute('${r}')">${r}</button>
  `).join("");
}

function selectRoute(route) {
  pedState.route = route;
  document.querySelectorAll(".route-btn").forEach(b => b.classList.toggle("active", b.textContent === route));
  updateEditablePrescription();
}

function renderPresentationOptions() {
  const drug = pedState.drug;
  if (!pedState.presId || !drug.presentations.find(p => p.id === pedState.presId)) {
    pedState.presId = drug.presentations[0].id;
  }
  const dose_mg = pedState.doseOverride;
  const container = document.getElementById("ped-presentations");
  container.innerHTML = drug.presentations.map(p => {
    const calc = pedCalcPresentation(p, dose_mg);
    const isActive = p.id === pedState.presId;
    return `
      <button type="button" class="pres-btn ${isActive ? 'active' : ''}"
        onclick="selectPresentation('${p.id}')">
        <span class="pres-btn-label">${p.label}</span>
        <span class="pres-btn-val">${calc.label}</span>
      </button>
    `;
  }).join("");
}

function selectPresentation(presId) {
  pedState.presId = presId;
  document.querySelectorAll(".pres-btn").forEach(b => b.classList.remove("active"));
  event.currentTarget.classList.add("active");
  updateEditablePrescription();
}

// Quando médico ajusta a dose manualmente
function onDoseManualChange() {
  const val = parseFloat(document.getElementById("ped-dose-mg-input").value);
  if (!isNaN(val) && val > 0) {
    pedState.doseOverride = val;
    renderPresentationOptions();
    updateEditablePrescription();
  }
}

// Gera e preenche o textarea editável
function updateEditablePrescription() {
  if (!pedState.drug) return;
  const text = pedGeneratePrescriptionText(
    pedState.drug,
    pedState.weight,
    pedState.age,
    pedState.route,
    pedState.presId,
    pedState.doseOverride
  );
  document.getElementById("ped-rx-textarea").value = text;
}

function copyPedRx() {
  const text = document.getElementById("ped-rx-textarea").value;
  navigator.clipboard.writeText(text).then(() => {
    const fb = document.getElementById("ped-copy-feedback");
    fb.classList.add("show");
    setTimeout(() => fb.classList.remove("show"), 2500);
  });
}

// ── Prescrições pediátricas ───────────────────────────────
async function renderPedDiseaseList(filter = "") {
  const list = document.getElementById("ped-disease-list");
  list.innerHTML = `<div class="empty-state">Carregando...</div>`;
  showLoading();
  try {
    let items = await window.dbGetBySector("Pediatria");
    items = items
      .filter(p => p.disease.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => a.disease.localeCompare(b.disease));
    if (!items.length) {
      list.innerHTML = `<div class="empty-state">Nenhuma prescrição pediátrica.<br/>Use ⚙ Gerenciar → setor Pediatria.</div>`;
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

// ── Gerenciar medicamentos ────────────────────────────────
function openDrugManager() {
  renderDrugManagerList();
  document.getElementById("drug-manager-modal").classList.add("open");
}
function closeDrugManager() {
  document.getElementById("drug-manager-modal").classList.remove("open");
}
function closeDrugManagerIfBg(e) {
  if (e.target === document.getElementById("drug-manager-modal")) closeDrugManager();
}

function renderDrugManagerList() {
  const list = document.getElementById("drug-manager-list");
  const drugs = pedDrugsGet().sort((a,b) => a.name.localeCompare(b.name));
  list.innerHTML = drugs.map(d => `
    <div class="admin-item">
      <div class="admin-item-info">
        <span class="admin-item-sector">${d.category}</span>
        <span class="admin-item-disease">${d.name}</span>
      </div>
      <button class="btn-edit-item" onclick="openEditDrug('${d.id}')">✎ Editar</button>
    </div>
  `).join("");
}

let _editingDrugId = null;

function openEditDrug(id) {
  _editingDrugId = id;
  const d = pedDrugsGetOne(id);
  if (!d) return;

  document.getElementById("dm-name").value      = d.name;
  document.getElementById("dm-category").value  = d.category;
  document.getElementById("dm-dose-kg").value   = d.dose_per_kg || "";
  document.getElementById("dm-dose-max").value  = d.dose_max_mg || "";
  document.getElementById("dm-interval").value  = d.interval || "";
  document.getElementById("dm-duration").value  = d.duration || "";
  document.getElementById("dm-routes").value    = (d.routes || []).join(", ");
  document.getElementById("dm-notes").value     = d.notes || "";

  document.getElementById("dm-edit-title").textContent = "Editar: " + d.name;
  document.getElementById("dm-delete-btn").style.display = "inline-block";

  document.querySelectorAll(".dm-tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".dm-tab").forEach(t => t.classList.remove("active"));
  document.getElementById("dm-tab-edit").classList.add("active");
  document.querySelector(".dm-tab[data-tab='dm-tab-edit']").classList.add("active");
}

function saveDrugEdit(e) {
  e.preventDefault();
  if (!_editingDrugId) return;
  pedDrugsUpdate(_editingDrugId, {
    name:      document.getElementById("dm-name").value,
    category:  document.getElementById("dm-category").value,
    dose_per_kg: parseFloat(document.getElementById("dm-dose-kg").value) || null,
    dose_max_mg: parseFloat(document.getElementById("dm-dose-max").value) || null,
    interval:  document.getElementById("dm-interval").value,
    duration:  document.getElementById("dm-duration").value,
    routes:    document.getElementById("dm-routes").value.split(",").map(s => s.trim()).filter(Boolean),
    notes:     document.getElementById("dm-notes").value
  });
  renderDrugManagerList();
  initPedDrugSelect();
  alert("✓ Medicamento atualizado!");
}

function deleteDrug() {
  if (!_editingDrugId || !confirm("Excluir este medicamento?")) return;
  pedDrugsDelete(_editingDrugId);
  renderDrugManagerList();
  initPedDrugSelect();
  _editingDrugId = null;
  switchDmTab("dm-tab-list", document.querySelector(".dm-tab[data-tab='dm-tab-list']"));
}

function switchDmTab(tabId, btn) {
  document.querySelectorAll(".dm-tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".dm-tab").forEach(t => t.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
  btn.classList.add("active");
}

window.openPediatria         = openPediatria;
window.switchPedTab          = switchPedTab;
window.onPedInput            = onPedInput;
window.selectRoute           = selectRoute;
window.selectPresentation    = selectPresentation;
window.onDoseManualChange    = onDoseManualChange;
window.copyPedRx             = copyPedRx;
window.filterPedDiseases     = filterPedDiseases;
window.renderPedDiseaseList  = renderPedDiseaseList;
window.openDrugManager       = openDrugManager;
window.closeDrugManager      = closeDrugManager;
window.closeDrugManagerIfBg  = closeDrugManagerIfBg;
window.renderDrugManagerList = renderDrugManagerList;
window.openEditDrug          = openEditDrug;
window.saveDrugEdit          = saveDrugEdit;
window.deleteDrug            = deleteDrug;
window.switchDmTab           = switchDmTab;
