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
    const raw = (await window.dbGetBySector(currentSector))
      .filter(p => p.disease.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => a.disease.localeCompare(b.disease, 'pt-BR', { sensitivity: 'base' }));
    const seen = new Set();
    const items = raw.filter(p => {
      const key = p.disease.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

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
    btn.className = `rx-tab ${idx === 0 ? 'active' : ''}`;
    btn.textContent = variant.label || `Opção ${idx + 1}`;
    btn.onclick = () => switchVariant(idx, btn);
    container.appendChild(btn);
  });
}

function switchVariant(idx, btn) {
  document.querySelectorAll(".rx-tab").forEach(t => t.classList.remove("active"));
  if (btn) btn.classList.add("active");
  currentVariantIndex = idx;
  renderVariantContent(idx);
}

function renderVariantContent(idx) {
  const body = getEl("rx-text", "rx-body");
  if (!body) return;
  const v = currentPrescription.variants && currentPrescription.variants[idx];
  if (!v) {
    body.innerHTML = "Nenhum texto disponível.";
    return;
  }

  setRxEditMode(false);

  let text = v.text || "";
  if (isPediatricPrescription()) {
    text = applyPediatricMarkers(text);
  }

  body.innerText = text;
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
    body.classList.add("editing");
    if (editBtn) editBtn.style.display = "none";
    if (saveBtn) saveBtn.style.display = "inline-flex";
    if (!saveBtn && editBtn) {
      editBtn.style.display = "inline-flex";
      editBtn.textContent = "Salvar";
      editBtn.onclick = saveRxInlineEdit;
    }
    if (window.openShortcutPicker) {
      body.onfocus = () => window.openShortcutPicker(body);
    }
  } else {
    body.contentEditable = "false";
    body.classList.remove("editing");
    if (editBtn) editBtn.style.display = "inline-flex";
    if (saveBtn) saveBtn.style.display = "none";
    if (!saveBtn && editBtn) {
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
  const body = getEl("rx-text", "rx-body");
  if (!body) return;
  const text = body.innerText;
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
  showScreen("screen-admin");
  switchTab("tab-list", document.querySelector(".tab[data-tab='tab-list']"));
  renderAdminList();
}
function closeAdmin() {
  if (currentSector) {
    showScreen("screen-disease");
    renderDiseaseList();
  } else {
    showScreen("screen-welcome");
  }
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
    const all = (await window.dbGetAll()).sort((a, b) => {
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
        <button class="btn-edit" onclick="startEdit('${p.id}')">Editar</button>
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
function addVariantField(containerId, label = "", text = "") {
  const container = document.getElementById(containerId);
  const div = document.createElement("div");
  div.className = "variant-form-group animate-fade";
  div.innerHTML = `
    <div class="variant-form-header">
      <input type="text" placeholder="Nome da Variante (ex: Sem Comorbidades, Alergia)" class="var-label" value="${label}" required />
      <button type="button" class="btn-remove-var" onclick="this.parentElement.parentElement.remove()">✕ Remover</button>
    </div>
    <textarea rows="6" placeholder="Texto estruturado da prescrição..." class="var-text" required>${text}</textarea>
  `;
  container.appendChild(div);
  
  const textarea = div.querySelector(".var-text");
  if (window.openShortcutPicker) {
    textarea.onfocus = () => window.openShortcutPicker(textarea);
    textarea.onblur = () => setTimeout(window.closeShortcutPicker, 200);
  }
}

function addNewVariantField() { addVariantField("new-variants-container"); }
function addVariantFieldEdit() { addVariantField("edit-variants-container"); }

async function saveNewPrescription(e) {
  e.preventDefault();
  const sector = document.getElementById("new-rx-sector").value;
  const disease = document.getElementById("new-rx-disease").value;
  const blocks = document.querySelectorAll("#new-variants-container .variant-form-group");
  
  const variants = [...blocks].map(b => ({
    label: b.querySelector(".var-label").value,
    text: b.querySelector(".var-text").value
  }));

  if (!variants.length) {
    alert("Adicione ao menos uma variante.");
    return;
  }

  showLoading();
  try {
    await window.dbAdd({ sector, disease, variants });
    e.target.reset();
    document.getElementById("new-variants-container").innerHTML = "";
    addNewVariantField();
    alert("✓ Prescrição incluída com sucesso!");
    switchTab("tab-list", document.querySelector(".tab[data-tab='tab-list']"));
    renderAdminList();
  } catch(err) {
    alert("Erro ao salvar.");
  } finally { hideLoading(); }
}

async function startEdit(id) {
  editingId = id;
  showLoading();
  try {
    const p = await window.dbGetById(id);
    if (!p) return;
    document.getElementById("edit-rx-sector").value = p.sector;
    document.getElementById("edit-rx-disease").value = p.disease;
    
    const container = document.getElementById("edit-variants-container");
    container.innerHTML = "";
    
    if (p.variants && p.variants.length) {
      p.variants.forEach(v => addVariantField("edit-variants-container", v.label, v.text));
    } else {
      addVariantField("edit-variants-container", "Padrão", p.text || "");
    }
    
    switchTab("tab-edit", null);
  } catch(e) {
    alert("Erro ao buscar dados.");
  } finally { hideLoading(); }
}

async function updatePrescription(e) {
  e.preventDefault();
  if (!editingId) return;
  
  const sector = document.getElementById("edit-rx-sector").value;
  const disease = document.getElementById("edit-rx-disease").value;
  const blocks = document.querySelectorAll("#edit-variants-container .variant-form-group");
  
  const variants = [...blocks].map(b => ({
    label: b.querySelector(".var-label").value,
    text: b.querySelector(".var-text").value
  }));

  showLoading();
  try {
    await window.dbUpdate(editingId, { sector, disease, variants });
    alert("✓ Prescrição atualizada!");
    editingId = null;
    switchTab("tab-list", document.querySelector(".tab[data-tab='tab-list']"));
    renderAdminList();
  } catch(e) {
    alert("Erro ao atualizar.");
  } finally { hideLoading(); }
}

async function deletePrescription() {
  if (!editingId || !confirm("Tem certeza que quer excluir permanentemente esta prescrição?")) return;
  showLoading();
  try {
    await window.dbDelete(editingId);
    alert("Prescrição excluída.");
    editingId = null;
    switchTab("tab-list", document.querySelector(".tab[data-tab='tab-list']"));
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
      .filter(p => p.disease.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => a.disease.localeCompare(b.disease, 'pt-BR', { sensitivity: 'base' }));
    const seenPed = new Set();
    const items = rawPed.filter(p => {
      const key = p.disease.trim().toLowerCase();
      if (seenPed.has(key)) return false;
      seenPed.add(key);
      return true;
    });
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
// ── Exportação Amarrada para o Escopo Global ──────────────
Object.assign(window, {
  selectSector, goBack, openPrescription, copyPrescription, editCurrentPrescription, setRxEditMode, saveRxInlineEdit, filterDiseases,
  switchVariant, openAdmin, closeAdmin, closeAdminIfOutside, switchTab,
  renderAdminList, filterAdminList, startEdit, saveNewPrescription, updatePrescription, deletePrescription,
  addVariantField, addNewVariantField, addVariantFieldEdit,
  openIntubacao, calculateIntubacao, openSedacao, calculateSedacao,
  openPediatria, switchPedTab, calculateDose, copyPedResult, filterPedDiseases, updatePediatricPrescriptionContext,
  renderPedDrugAdmin, newPedDrug, editPedDrug, addPedPresentationField, removePedPresentationField, savePedDrug, deletePedDrug, updatePedMarkerPreview
});
