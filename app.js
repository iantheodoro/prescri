// ============================================================
//  app.js
// ============================================================

let currentSector = "";
let currentPrescription = null;
let currentVariantIndex = 0;
let editingId = null;
let editVariants = [];
let newEditVariants = [];
let pediatricPrescriptionContext = { weight: "", age: "" };
const PED_DRUGS_STORAGE_KEY = "prescricoesmed_pediatric_drugs";

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
    document.querySelector("#screen-prescription .btn-back")
      .setAttribute("onclick", `goBack('${p.sector === "Pediatria" ? "screen-pediatria" : "screen-disease"}')`);
    document.getElementById("rx-sector-label").textContent = p.sector;
    document.getElementById("rx-disease-name").textContent = p.disease;
    document.getElementById("rx-date").textContent = new Date().toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric" });
    setupPediatricPrescriptionContext(p);
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
  document.getElementById("rx-text").textContent = renderPrescriptionText(v.text || "");
}

function copyPrescription() {
  if (!currentPrescription) return;
  const v = currentPrescription.variants
    ? currentPrescription.variants[currentVariantIndex]
    : { text: currentPrescription.prescription || "" };
  navigator.clipboard.writeText(renderPrescriptionText(v.text || "")).then(() => {
    document.getElementById("btn-copy").classList.add("copied");
    document.getElementById("copy-feedback").classList.add("show");
    setTimeout(() => {
      document.getElementById("btn-copy").classList.remove("copied");
      document.getElementById("copy-feedback").classList.remove("show");
    }, 2500);
  });
}

function isPediatricPrescription(p = currentPrescription) {
  return p && p.sector === "Pediatria";
}

function parseLocaleNumber(value) {
  if (value === null || value === undefined) return NaN;
  return parseFloat(String(value).replace(",", "."));
}

function formatPedNumber(value, digits = 1) {
  if (!Number.isFinite(value)) return "";
  return Number(value.toFixed(digits)).toLocaleString("pt-BR", { maximumFractionDigits: digits });
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizePedDrugId(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function setupPediatricPrescriptionContext(p) {
  const panel = document.getElementById("rx-ped-context");
  if (!panel) return;

  if (!isPediatricPrescription(p)) {
    panel.style.display = "none";
    return;
  }

  const calcWeight = document.getElementById("ped-weight")?.value || "";
  const calcAge = document.getElementById("ped-age")?.value || "";
  pediatricPrescriptionContext.weight = pediatricPrescriptionContext.weight || calcWeight;
  pediatricPrescriptionContext.age = pediatricPrescriptionContext.age || calcAge;

  document.getElementById("rx-ped-weight").value = pediatricPrescriptionContext.weight;
  document.getElementById("rx-ped-age").value = pediatricPrescriptionContext.age;
  panel.style.display = "flex";
}

function updatePediatricPrescriptionContext() {
  pediatricPrescriptionContext.weight = document.getElementById("rx-ped-weight")?.value || "";
  pediatricPrescriptionContext.age = document.getElementById("rx-ped-age")?.value || "";

  const calcWeight = document.getElementById("ped-weight");
  const calcAge = document.getElementById("ped-age");
  if (calcWeight) calcWeight.value = pediatricPrescriptionContext.weight;
  if (calcAge) calcAge.value = pediatricPrescriptionContext.age;

  if (currentPrescription) renderVariantContent(currentVariantIndex);
}

function renderPrescriptionText(text) {
  if (!isPediatricPrescription()) return text;
  const markers = buildPediatricMarkerMap();
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    const value = markers[key.toLowerCase()];
    return value === undefined || value === "" ? match : value;
  });
}

function getPediatricCalculation(drug, weight, age) {
  if (!drug) return null;

  let dosePerDose;
  let dailyDose = null;
  let label = "";

  if (drug.dose_by_age) {
    const ageBucket = Number.isFinite(age)
      ? age
      : Number.isFinite(weight) ? (weight < 15 ? 5 : weight < 30 ? 8 : 14) : NaN;
    const bucket = drug.dose_by_age.find(b => ageBucket >= b.age_min && ageBucket < b.age_max)
      || drug.dose_by_age[drug.dose_by_age.length - 1];
    dosePerDose = bucket.dose;
    label = `${formatPedNumber(dosePerDose)} mg (dose fixa por faixa etária)`;
  } else if (Number.isFinite(weight) && weight > 0 && drug.dose_type === "daily") {
    const rawDailyDose = drug.dose_per_kg * weight;
    dailyDose = drug.dose_max ? Math.min(rawDailyDose, drug.dose_max) : rawDailyDose;
    dosePerDose = Math.round((dailyDose / 3) * 10) / 10;
    label = `${formatPedNumber(dailyDose)} mg/dia -> ${formatPedNumber(dosePerDose)} mg por dose`;
  } else if (Number.isFinite(weight) && weight > 0 && drug.dose_per_kg) {
    const rawDose = drug.dose_per_kg * weight;
    dosePerDose = drug.dose_max ? Math.min(rawDose, drug.dose_max) : rawDose;
    dosePerDose = Math.round(dosePerDose * 10) / 10;
    label = `${formatPedNumber(dosePerDose)} mg`;
  } else {
    return null;
  }

  return { dosePerDose, dailyDose, label };
}

function buildPediatricMarkerMap() {
  const weight = parseLocaleNumber(pediatricPrescriptionContext.weight);
  const age = parseLocaleNumber(pediatricPrescriptionContext.age);
  const map = {
    peso: Number.isFinite(weight) ? `${formatPedNumber(weight)} kg` : "",
    peso_kg: Number.isFinite(weight) ? formatPedNumber(weight) : "",
    idade: Number.isFinite(age) ? `${formatPedNumber(age)} anos` : "",
    idade_anos: Number.isFinite(age) ? formatPedNumber(age) : ""
  };

  PEDIATRIC_DRUGS.forEach(drug => {
    const calc = getPediatricCalculation(drug, weight, age);
    map[`${drug.id}_nome`] = drug.name;
    map[`${drug.id}_rota`] = drug.route;
    map[`${drug.id}_intervalo`] = drug.interval;
    map[`${drug.id}_dose`] = calc ? calc.label : "";
    map[`${drug.id}_mg`] = calc ? formatPedNumber(calc.dosePerDose) : "";

    if (!calc) return;

    drug.presentations.forEach(p => {
      if (p.dose_fixed_label) {
        map[`${drug.id}_${p.unit}`] = p.dose_fixed_label;
        return;
      }
      if (p.drop_mg) {
        const gotas = Math.round(calc.dosePerDose / p.drop_mg);
        map[`${drug.id}_gotas`] = `${gotas} gotas`;
        map[`${drug.id}_gotas_num`] = String(gotas);
        return;
      }
      if (p.fixed_mg) {
        const comprimidos = calc.dosePerDose / p.fixed_mg;
        const value = comprimidos >= 1
          ? `${comprimidos % 1 === 0 ? comprimidos : comprimidos.toFixed(1)} comprimido(s)`
          : `${comprimidos.toFixed(2)} comprimido`;
        if (!map[`${drug.id}_comprimidos`]) map[`${drug.id}_comprimidos`] = value;
        return;
      }
      if (p.concentration) {
        const vol = Math.round((calc.dosePerDose / p.concentration) * 10) / 10;
        if (!map[`${drug.id}_ml`]) map[`${drug.id}_ml`] = `${formatPedNumber(vol)} mL`;
        if (!map[`${drug.id}_ml_num`]) map[`${drug.id}_ml_num`] = formatPedNumber(vol);
      }
    });
  });

  return map;
}

// ── Admin visual de medicamentos pediátricos ─────────────
function loadPedDrugsFromStorage() {
  try {
    const saved = JSON.parse(localStorage.getItem(PED_DRUGS_STORAGE_KEY) || "null");
    if (!Array.isArray(saved)) return;
    PEDIATRIC_DRUGS.splice(0, PEDIATRIC_DRUGS.length, ...saved);
  } catch(e) {
    console.warn("Não foi possível carregar medicamentos pediátricos salvos.", e);
  }
}

function persistPedDrugs() {
  localStorage.setItem(PED_DRUGS_STORAGE_KEY, JSON.stringify(PEDIATRIC_DRUGS));
  renderPedDrugOptions();
}

function renderPedDrugOptions() {
  const sel = document.getElementById("ped-drug");
  if (!sel) return;
  const selected = sel.value;
  sel.innerHTML = `<option value="">Selecionar medicamento...</option>`;
  PEDIATRIC_DRUGS.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = `${d.name} — ${d.category || "Sem categoria"}`;
    sel.appendChild(opt);
  });
  if (PEDIATRIC_DRUGS.some(d => d.id === selected)) sel.value = selected;
}

function renderPedDrugAdmin(selectedId = null) {
  const list = document.getElementById("ped-drug-admin-list");
  if (!list) return;

  list.innerHTML = PEDIATRIC_DRUGS.map(d => `
    <button type="button" class="ped-drug-admin-item" onclick="editPedDrug('${d.id}')">
      <span>
        <strong>${escapeHtml(d.name)}</strong>
        <small>{{${escapeHtml(d.id)}_dose}}</small>
      </span>
      <em>${d.dose_per_kg ? `${escapeHtml(d.dose_per_kg)} mg/kg` : "dose fixa"}</em>
    </button>
  `).join("");

  if (selectedId) editPedDrug(selectedId);
  else if (!document.getElementById("ped-admin-original-id").value) newPedDrug();
}

function newPedDrug() {
  document.getElementById("ped-admin-original-id").value = "";
  document.getElementById("ped-admin-name").value = "";
  document.getElementById("ped-admin-id").value = "";
  document.getElementById("ped-admin-category").value = "";
  document.getElementById("ped-admin-route").value = "VO";
  document.getElementById("ped-admin-dose").value = "";
  document.getElementById("ped-admin-dose-max").value = "";
  document.getElementById("ped-admin-dose-type").value = "";
  document.getElementById("ped-admin-interval").value = "";
  document.getElementById("ped-admin-notes").value = "";
  document.getElementById("ped-admin-delete").style.display = "none";
  document.getElementById("ped-presentations-admin").innerHTML = "";
  addPedPresentationField();
  updatePedMarkerPreview();
}

function editPedDrug(id) {
  const drug = PEDIATRIC_DRUGS.find(d => d.id === id);
  if (!drug) return;
  document.getElementById("ped-admin-original-id").value = drug.id;
  document.getElementById("ped-admin-name").value = drug.name || "";
  document.getElementById("ped-admin-id").value = drug.id || "";
  document.getElementById("ped-admin-category").value = drug.category || "";
  document.getElementById("ped-admin-route").value = drug.route || "";
  document.getElementById("ped-admin-dose").value = drug.dose_per_kg ?? "";
  document.getElementById("ped-admin-dose-max").value = drug.dose_max ?? "";
  document.getElementById("ped-admin-dose-type").value = drug.dose_type || "";
  document.getElementById("ped-admin-interval").value = drug.interval || "";
  document.getElementById("ped-admin-notes").value = drug.notes || "";
  document.getElementById("ped-admin-delete").style.display = "inline-block";

  document.getElementById("ped-presentations-admin").innerHTML = "";
  (drug.presentations && drug.presentations.length ? drug.presentations : [{}])
    .forEach(p => addPedPresentationField(p));
  updatePedMarkerPreview();
}

function addPedPresentationField(p = {}) {
  const wrap = document.getElementById("ped-presentations-admin");
  const idx = wrap.querySelectorAll(".ped-presentation-row").length;
  const div = document.createElement("div");
  div.className = "ped-presentation-row";
  div.innerHTML = `
    <input type="text" class="ped-pres-label-input" placeholder="Nome. Ex: Gotas 200 mg/mL" value="${escapeHtml(p.label || "")}" />
    <select class="ped-pres-kind" onchange="updatePedMarkerPreview()">
      <option value="ml" ${p.concentration && !p.drop_mg ? "selected" : ""}>mL</option>
      <option value="gotas" ${p.drop_mg ? "selected" : ""}>gotas</option>
      <option value="comprimidos" ${p.fixed_mg ? "selected" : ""}>comprimido</option>
      <option value="fixo" ${p.dose_fixed_label ? "selected" : ""}>texto fixo</option>
    </select>
    <input type="number" class="ped-pres-concentration" min="0" step="0.01" placeholder="mg/mL" value="${p.concentration ?? ""}" />
    <input type="number" class="ped-pres-drop" min="0" step="0.01" placeholder="mg/gota" value="${p.drop_mg ?? ""}" />
    <input type="number" class="ped-pres-fixed" min="0" step="0.01" placeholder="mg/comp" value="${p.fixed_mg ?? ""}" />
    <input type="text" class="ped-pres-fixed-label" placeholder="ex: 2-4 jatos" value="${escapeHtml(p.dose_fixed_label || "")}" />
    ${idx > 0 ? `<button type="button" class="btn-remove-variant" onclick="removePedPresentationField(this)">x</button>` : ""}
  `;
  wrap.appendChild(div);
  updatePedMarkerPreview();
}

function removePedPresentationField(btn) {
  btn.closest(".ped-presentation-row").remove();
  updatePedMarkerPreview();
}

function collectPedPresentations() {
  return [...document.querySelectorAll("#ped-presentations-admin .ped-presentation-row")]
    .map(row => {
      const kind = row.querySelector(".ped-pres-kind").value;
      const base = { label: row.querySelector(".ped-pres-label-input").value.trim() };
      if (!base.label) return null;
      if (kind === "gotas") {
        base.unit = "gotas";
        base.concentration = parseLocaleNumber(row.querySelector(".ped-pres-concentration").value);
        base.drop_mg = parseLocaleNumber(row.querySelector(".ped-pres-drop").value);
      } else if (kind === "comprimidos") {
        base.unit = "comprimidos";
        base.fixed_mg = parseLocaleNumber(row.querySelector(".ped-pres-fixed").value);
      } else if (kind === "fixo") {
        base.unit = "jatos";
        base.dose_fixed_label = row.querySelector(".ped-pres-fixed-label").value.trim();
      } else {
        base.unit = "mL";
        base.concentration = parseLocaleNumber(row.querySelector(".ped-pres-concentration").value);
      }
      Object.keys(base).forEach(key => {
        if (Number.isNaN(base[key]) || base[key] === "") delete base[key];
      });
      return base;
    })
    .filter(Boolean);
}

function getPedAdminDrugFromForm() {
  const id = normalizePedDrugId(document.getElementById("ped-admin-id").value);
  return {
    id,
    name: document.getElementById("ped-admin-name").value.trim(),
    category: document.getElementById("ped-admin-category").value.trim(),
    dose_per_kg: parseLocaleNumber(document.getElementById("ped-admin-dose").value) || null,
    dose_max: parseLocaleNumber(document.getElementById("ped-admin-dose-max").value) || null,
    interval: document.getElementById("ped-admin-interval").value.trim(),
    max_daily: null,
    weight_min: 1,
    weight_max: 100,
    presentations: collectPedPresentations(),
    notes: document.getElementById("ped-admin-notes").value.trim(),
    route: document.getElementById("ped-admin-route").value.trim(),
    dose_type: document.getElementById("ped-admin-dose-type").value || undefined
  };
}

function savePedDrug(e) {
  e.preventDefault();
  const originalId = document.getElementById("ped-admin-original-id").value;
  const drug = getPedAdminDrugFromForm();
  if (!drug.id || !drug.name) {
    alert("Preencha nome e código do marcador.");
    return;
  }
  if (!drug.dose_per_kg && !drug.presentations.some(p => p.dose_fixed_label)) {
    alert("Informe a dose mg/kg ou uma apresentação com texto fixo.");
    return;
  }

  const duplicate = PEDIATRIC_DRUGS.find(d => d.id === drug.id && d.id !== originalId);
  if (duplicate) {
    alert("Já existe um medicamento com esse código de marcador.");
    return;
  }

  const index = PEDIATRIC_DRUGS.findIndex(d => d.id === originalId);
  if (index >= 0) PEDIATRIC_DRUGS[index] = drug;
  else PEDIATRIC_DRUGS.push(drug);

  persistPedDrugs();
  renderPedDrugAdmin(drug.id);
  alert("Medicamento pediátrico salvo.");
}

function deletePedDrug() {
  const id = document.getElementById("ped-admin-original-id").value;
  if (!id || !confirm("Excluir este medicamento pediátrico?")) return;
  const index = PEDIATRIC_DRUGS.findIndex(d => d.id === id);
  if (index >= 0) PEDIATRIC_DRUGS.splice(index, 1);
  persistPedDrugs();
  newPedDrug();
  renderPedDrugAdmin();
}

function updatePedMarkerPreview() {
  const id = normalizePedDrugId(document.getElementById("ped-admin-id")?.value || "");
  const el = document.getElementById("ped-marker-preview");
  if (!el) return;
  if (!id) {
    el.innerHTML = `<code>{{medicamento_dose}}</code>`;
    return;
  }
  const markers = [`{{${id}_dose}}`, `{{${id}_mg}}`, `{{${id}_intervalo}}`, `{{${id}_rota}}`];
  collectPedPresentations().forEach(p => {
    if (p.drop_mg) markers.push(`{{${id}_gotas}}`);
    else if (p.fixed_mg) markers.push(`{{${id}_comprimidos}}`);
    else if (p.concentration) markers.push(`{{${id}_ml}}`);
    else if (p.dose_fixed_label) markers.push(`{{${id}_${p.unit}}}`);
  });
  el.innerHTML = [...new Set(markers)].map(m => `<code onclick="navigator.clipboard.writeText('${m}')">${m}</code>`).join("");
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
  if (tabId === "tab-ped-drugs") renderPedDrugAdmin();
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
    loadPedDrugsFromStorage();
    renderPedDrugOptions();
    await window.dbInit();
    addNewVariantField("Prescrição");
    ["ped-admin-id", "ped-admin-name"].forEach(id => {
      document.getElementById(id)?.addEventListener("input", () => {
        if (id === "ped-admin-name" && !document.getElementById("ped-admin-id").value) {
          document.getElementById("ped-admin-id").value = normalizePedDrugId(document.getElementById("ped-admin-name").value);
        }
        updatePedMarkerPreview();
      });
    });
    document.getElementById("ped-presentations-admin")?.addEventListener("input", updatePedMarkerPreview);
  } finally { hideLoading(); }
});

Object.assign(window, {
  selectSector, goBack, openPrescription, copyPrescription, filterDiseases,
  switchVariant, openAdmin, closeAdmin, closeAdminIfOutside, switchTab,
  renderAdminList, startEdit, saveNewPrescription, updatePrescription, deletePrescription,
  addVariantField, removeVariant, addNewVariantField, removeNewVariant,
  closeShortcutIfBg, renderShortcutsList,
  openNewShortcut, openEditShortcut, closeShortcutModal, closeShortcutModalIfBg,
  saveShortcut, deleteShortcut, updatePediatricPrescriptionContext,
  renderPedDrugAdmin, newPedDrug, editPedDrug, addPedPresentationField,
  removePedPresentationField, savePedDrug, deletePedDrug, updatePedMarkerPreview
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
  renderPedDrugOptions();
}

function calculateDose() {
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

  const drug = PEDIATRIC_DRUGS.find(d => d.id === drugId);
  if (!drug) return;

  const calc = getPediatricCalculation(drug, weight, age);
  if (!calc) return;
  const { dosePerDose, label } = calc;

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
  const age = document.getElementById("ped-age")?.value || "";
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

  const text = `${drug.name} — Peso: ${weight} kg${age ? ` — Idade: ${age} anos` : ""}
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
window.updatePediatricPrescriptionContext = updatePediatricPrescriptionContext;
window.renderPedDrugAdmin = renderPedDrugAdmin;
window.newPedDrug = newPedDrug;
window.editPedDrug = editPedDrug;
window.addPedPresentationField = addPedPresentationField;
window.removePedPresentationField = removePedPresentationField;
window.savePedDrug = savePedDrug;
window.deletePedDrug = deletePedDrug;
window.updatePedMarkerPreview = updatePedMarkerPreview;
