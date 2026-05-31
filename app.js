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

    document.getElementById("rx-title").textContent = p.disease;
    
    // Configura inputs de contexto caso seja do setor Pediatria
    const pedCtx = document.getElementById("rx-pediatric-context");
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
  const container = document.getElementById("rx-tabs-container");
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
  const body = document.getElementById("rx-body");
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
  const body = document.getElementById("rx-body");
  const editBtn = document.getElementById("btn-edit-rx");
  const saveBtn = document.getElementById("btn-save-rx");
  
  if (mode) {
    body.contentEditable = "true";
    body.classList.add("editing");
    if (editBtn) editBtn.style.display = "none";
    if (saveBtn) saveBtn.style.display = "inline-flex";
    if (window.openShortcutPicker) {
      body.onfocus = () => window.openShortcutPicker(body);
    }
  } else {
    body.contentEditable = "false";
    body.classList.remove("editing");
    if (editBtn) editBtn.style.display = "inline-flex";
    if (saveBtn) saveBtn.style.display = "none";
    body.onfocus = null;
    if (window.closeShortcutPicker) window.closeShortcutPicker();
  }
}

function editCurrentPrescription() {
  setRxEditMode(true);
  const v = currentPrescription.variants && currentPrescription.variants[currentVariantIndex];
  if (v) {
    document.getElementById("rx-body").innerText = v.text || "";
  }
}

async function saveRxInlineEdit() {
  if (!currentPrescription) return;
  const newText = document.getElementById("rx-body").innerText;
  
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
  const body = document.getElementById("rx-body");
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
  const container = document.getElementById("admin-list-container");
  container.innerHTML = '<div class="empty-state">Carregando...</div>';
  try {
    const all = (await window.dbGetAll()).sort((a, b) => {
      const sec = a.sector.localeCompare(b.sector);
      if (sec !== 0) return sec;
      return a.disease.localeCompare(b.disease);
    });
    
    const filtered = all.filter(x => 
      x.disease.toLowerCase().includes(filter.toLowerCase()) || 
      x.sector.toLowerCase().includes(filter.toLowerCase())
    );

    if (!filtered.length) {
      container.innerHTML = '<div class="empty-state">Nenhuma prescrição cadastrada.</div>';
      return;
    }

    container.innerHTML = filtered.map(p => `
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
  renderAdminList(document.getElementById("admin-search").value);
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
  }).join("
");

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

function openIntubacao() { showScreen("screen-intubacao"); }
function calculateIntubacao() {
  const w = parseLocaleNumber(document.getElementById("int-weight").value);
  const res = document.getElementById("int-results");
  if (!w || w <= 0) { res.style.display = "none"; return; }
  
  document.getElementById("calc-etomidato").textContent = `${(w * 0.3).toFixed(1).replace(".", ",")} mg (${(w * 0.15).toFixed(1).replace(".", ",")} mL)`;
  document.getElementById("calc-propofol").textContent  = `${(w * 1.5).toFixed(1).replace(".", ",")} mg (${(w * 0.15).toFixed(1).replace(".", ",")} mL)`;
  document.getElementById("calc-fentanil").textContent  = `${(w * 3).toFixed(0)} mcg (${((w * 3)/50).toFixed(1).replace(".", ",")} mL)`;
  document.getElementById("calc-succi").textContent     = `${(w * 1.5).toFixed(1).replace(".", ",")} mg (${(w * 0.03).toFixed(1).replace(".", ",")} mL)`;
  document.getElementById("calc-rocuronio").textContent = `${(w * 1.2).toFixed(1).replace(".", ",")} mg (${(w * 0.12).toFixed(1).replace(".", ",")} mL)`;
  
  res.style.display = "block";
}

function openSedacao() { showScreen("screen-sedacao"); }
function calculateSedacao() {
  const w = parseLocaleNumber(document.getElementById("sed-weight").value);
  const fentanilMl = parseLocaleNumber(document.getElementById("sed-fentanil").value) || 0;
  const midazMl = parseLocaleNumber(document.getElementById("sed-midazolam").value) || 0;
  const vazao = parseLocaleNumber(document.getElementById("sed-vazao").value) || 0;
  const label = document.getElementById("sed-range-label");
  
  if (!w || !vazao) { label.style.display = "none"; return; }
  
  const totalVol = 100 + fentanilMl + midazMl;
  const fentanilMcgTotal = fentanilMl * 50;
  const midazMgTotal = midazMl * 5;
  
  const mcgKgMin = ((vazao * (fentanilMcgTotal / totalVol)) / w) / 60;
  const mgKgHora = (vazao * (midazMgTotal / totalVol)) / w;
  
  let msg = `Fentanil: ${mcgKgMin.toFixed(2).replace(".", ",")} mcg/kg/min\nMidazolam: ${mgKgHora.toFixed(2).replace(".", ",")} mg/kg/h`;
  label.innerText = msg;
  label.style.display = "block";
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
