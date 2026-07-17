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

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

// ============================================================
//  ANOTAÇÕES — Auto-exclusão após 48h
// ============================================================

const ANOTACOES_KEY = "prescricoes_anotacoes";
const ANOTACOES_EXPIRY = 48 * 60 * 60 * 1000; // 48 horas em ms

function anotacoesGetAll() {
  try {
    const raw = localStorage.getItem(ANOTACOES_KEY);
    const data = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const valid = data.filter(a => (now - a.timestamp) < ANOTACOES_EXPIRY);
    if (valid.length !== data.length) {
      localStorage.setItem(ANOTACOES_KEY, JSON.stringify(valid));
    }
    return valid;
  } catch(e) {
    return [];
  }
}

function anotacoesAdd(texto) {
  const list = anotacoesGetAll();
  list.push({
    id: Date.now().toString(),
    texto: texto.trim(),
    timestamp: Date.now()
  });
  localStorage.setItem(ANOTACOES_KEY, JSON.stringify(list));
}

function anotacoesDelete(id) {
  const list = anotacoesGetAll().filter(a => a.id !== id);
  localStorage.setItem(ANOTACOES_KEY, JSON.stringify(list));
}

function anotacoesClear() {
  localStorage.removeItem(ANOTACOES_KEY);
}

function openAnotacoes() {
  showScreen("screen-anotacoes");
  renderAnotacoes();
}

function renderAnotacoes() {
  const list = document.getElementById("anotacoes-list");
  const items = anotacoesGetAll();
  
  if (!items.length) {
    list.innerHTML = `<div class="anotacao-vazio">📝 Nenhuma anotação. <br/><span style="font-size:12px;color:var(--text-dim);">As anotações expiram automaticamente após 48 horas.</span></div>`;
    return;
  }

  list.innerHTML = items.sort((a,b) => b.timestamp - a.timestamp).map(a => {
    const data = new Date(a.timestamp);
    const dataStr = data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'});
    const horasRestantes = Math.max(0, Math.floor((ANOTACOES_EXPIRY - (Date.now() - a.timestamp)) / (60 * 60 * 1000)));
    return `
      <div class="anotacao-item">
        <div>
          <div class="anotacao-texto">${escapeHtml(a.texto)}</div>
          <div class="anotacao-data">${dataStr} · expira em ${horasRestantes}h</div>
        </div>
        <button class="anotacao-delete" onclick="anotacoesDelete('${a.id}');renderAnotacoes();" title="Excluir">✕</button>
      </div>
    `;
  }).join("");
}

function salvarAnotacao() {
  const input = document.getElementById("anotacao-input");
  const texto = input.value.trim();
  if (!texto) return;
  anotacoesAdd(texto);
  input.value = "";
  renderAnotacoes();
}

function clearAnotacoes() {
  if (!confirm("Tem certeza que deseja limpar TODAS as anotações?")) return;
  anotacoesClear();
  renderAnotacoes();
}

// ============================================================
//  CUIDADO — Anotação em amarelo no canto direito
// ============================================================

let cuidadoTimeout = null;

function mostrarCuidado(texto) {
  const el = document.getElementById("cuidado-nota");
  const textoEl = document.getElementById("cuidado-texto");
  if (!el || !textoEl) return;
  
  textoEl.textContent = texto;
  el.style.display = "block";
  
  if (cuidadoTimeout) clearTimeout(cuidadoTimeout);
  cuidadoTimeout = setTimeout(() => {
    el.style.display = "none";
  }, 15000);
}

function fecharCuidado() {
  const el = document.getElementById("cuidado-nota");
  if (el) el.style.display = "none";
  if (cuidadoTimeout) {
    clearTimeout(cuidadoTimeout);
    cuidadoTimeout = null;
  }
}

// ============================================================
//  SELEÇÃO DE SETOR
// ============================================================

async function selectSector(btn) {
  currentSector = btn.dataset.sector;
  document.getElementById("active-sector-label").textContent = currentSector;
  
  const screen = document.getElementById("screen-disease");
  const allScreens = document.querySelectorAll(".screen");
  allScreens.forEach(s => s.dataset.sector = "");
  screen.dataset.sector = currentSector;
  
  if (currentSector === "Sala Vermelha") {
    mostrarCuidado("⚠️ ATENÇÃO: Sala Vermelha - Emergências críticas. Priorize atendimento imediato.");
  }
  
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
  renderDiseaseList(document.getElementById("search-input").value);
}

// ============================================================
//  PRESCRIÇÕES
// ============================================================

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
    
    const screen = document.getElementById("screen-prescription");
    const allScreens = document.querySelectorAll(".screen");
    allScreens.forEach(s => s.dataset.sector = "");
    screen.dataset.sector = p.sector;
    
    if (p.sector === "Sala Vermelha") {
      mostrarCuidado("⚠️ Protocolo Sala Vermelha - Conduta imediata necessária.");
    }
    
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
    btn.className = `variant-tab ${idx === 0 ? 'active' : ''}`;
    btn.textContent = variant.label || `Opção ${idx + 1}`;
    btn.onclick = () => switchVariant(idx, btn);
    container.appendChild(btn);
  });
}

function switchVariant(idx, btn) {
  document.querySelectorAll(".variant-tab").forEach(t => t.classList.remove("active"));
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
    renderRxImageGallery(null);
    return;
  }

  setRxEditMode(false);

  let text = v.text || "";
  if (isPediatricPrescription()) {
    text = applyPediatricMarkers(text);
  }

  body.innerText = text;
  renderRxImageGallery(v.images);
}

function renderRxImageGallery(images) {
  const gallery = document.getElementById("rx-image-gallery");
  if (!gallery) return;
  if (!images || !images.length) {
    gallery.innerHTML = "";
    gallery.style.display = "none";
    return;
  }
  gallery.style.display = "flex";
  gallery.innerHTML = images.map(img => `
    <figure class="rx-image-figure">
      <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.caption || "")}" onclick="openImageViewer('${escapeHtml(img.url)}')" />
      ${img.caption ? `<figcaption>${escapeHtml(img.caption)}</figcaption>` : ""}
    </figure>
  `).join("");
}

function openImageViewer(url) {
  let viewer = document.getElementById("image-viewer-overlay");
  if (!viewer) {
    viewer = document.createElement("div");
    viewer.id = "image-viewer-overlay";
    viewer.className = "image-viewer-overlay";
    viewer.onclick = closeImageViewer;
    viewer.innerHTML = `<img id="image-viewer-img" src="" alt="" />`;
    document.body.appendChild(viewer);
  }
  document.getElementById("image-viewer-img").src = url;
  viewer.classList.add("open");
}

function closeImageViewer() {
  const viewer = document.getElementById("image-viewer-overlay");
  if (viewer) viewer.classList.remove("open");
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

  if (window.onPedInput) {
    window.onPedInput();
  }

  renderVariantContent(currentVariantIndex);
}

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

function setRxEditMode(mode) {
  const body = getEl("rx-text", "rx-body");
  const editBtn = getEl("btn-rx-edit", "btn-edit-rx");
  const saveBtn = getEl("btn-save-rx");
  if (!body) return;
  
  if (mode) {
    body.contentEditable = "true";
    body.spellcheck = true;
    body.classList.add("editing");
    if (editBtn) editBtn.style.display = "none";
    if (saveBtn) saveBtn.style.display = "inline-flex";
    if (!saveBtn && editBtn) {
      editBtn.style.display = "inline-flex";
      editBtn.classList.add("saving");
      editBtn.textContent = "✓ Salvar edição";
      editBtn.onclick = saveRxInlineEdit;
    }
    body.onfocus = null;
    setTimeout(() => body.focus(), 0);
  } else {
    body.contentEditable = "false";
    body.classList.remove("editing");
    body.spellcheck = false;
    if (editBtn) editBtn.style.display = "inline-flex";
    if (saveBtn) saveBtn.style.display = "none";
    if (!saveBtn && editBtn) {
      editBtn.classList.remove("saving");
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
//  ADMIN
// ============================================================

function openAdmin() {
  const modal = document.getElementById("admin-modal");
  if (modal) modal.classList.add("open");
  switchTab("tab-list", document.getElementById("tab-list-btn"));
  renderAdminList();
}

function closeAdmin() {
  const modal = document.getElementById("admin-modal");
  if (modal) modal.classList.remove("open");
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
    const searchFilter = document.getElementById("admin-search")?.value || "";
    
    let filtered = all.filter(x => {
      const matchSector = !sectorFilter || x.sector === sectorFilter;
      const matchSearch = !searchFilter || 
        (x.disease || "").toLowerCase().includes(searchFilter.toLowerCase()) ||
        (x.sector || "").toLowerCase().includes(searchFilter.toLowerCase());
      return matchSector && matchSearch;
    });

    const seen = new Set();
    const grouped = filtered.filter(p => {
      const key = (p.sector + "||" + p.disease).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (!grouped.length) {
      container.innerHTML = '<div class="empty-state">Nenhuma prescrição encontrada.</div>';
      return;
    }

    container.innerHTML = grouped.map(p => `
      <div class="admin-item">
        <div class="admin-item-info">
          <span class="admin-item-sector">${p.sector}</span>
          <strong class="admin-item-disease">${p.disease}</strong>
          <span class="admin-item-variants">${p.variants ? p.variants.length : 1} variante(s)</span>
        </div>
        <button class="btn-edit-item" onclick="startEdit('${p.id}')">Editar</button>
      </div>
    `).join("");
  } catch(e) {
    container.innerHTML = '<div class="empty-state">Erro ao buscar lista.</div>';
  }
}

function filterAdminList() {
  renderAdminList(document.getElementById("admin-search")?.value || "");
}

function addVariantField(containerId = "variants-container", label = "", text = "", images = []) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const div = document.createElement("div");
  div.className = "variant-form-group variant-edit-block animate-fade";
  div.innerHTML = `
    <div class="variant-form-header variant-edit-header">
      <input type="text" placeholder="Nome da Variante (ex: Sem Comorbidades, Alergia)" class="var-label variant-label-input" value="${escapeHtml(label)}" required />
      <button type="button" class="btn-remove-var btn-remove-variant" onclick="this.parentElement.parentElement.remove()">✕ Remover</button>
    </div>
    <textarea rows="10" placeholder="Escreva livremente a prescrição..." class="var-text variant-text-input" required>${escapeHtml(text)}</textarea>
    <div class="var-images-block">
      <div class="var-images-head">
        <span>Imagens</span>
        <label class="btn-add-image">+ Adicionar imagem
          <input type="file" accept="image/*" multiple class="var-image-input" onchange="handleVariantImageUpload(event, this)" hidden />
        </label>
      </div>
      <div class="var-images-list"></div>
    </div>
  `;
  container.appendChild(div);
  const imgList = div.querySelector(".var-images-list");
  (images || []).forEach(img => addVariantImageEntry(imgList, img));
}

const IMG_MAX_DIM = 1000;
const IMG_QUALITY = 0.72;

function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo de imagem."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Falha ao processar a imagem."));
      img.onload = () => {
        let { width, height } = img;
        if (width > IMG_MAX_DIM || height > IMG_MAX_DIM) {
          if (width >= height) {
            height = Math.round(height * (IMG_MAX_DIM / width));
            width = IMG_MAX_DIM;
          } else {
            width = Math.round(width * (IMG_MAX_DIM / height));
            height = IMG_MAX_DIM;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", IMG_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function handleVariantImageUpload(e, input) {
  const list = input.closest(".var-images-block").querySelector(".var-images-list");
  const files = [...(e.target.files || [])];
  files.forEach(async file => {
    const item = addVariantImageEntry(list, { url: "", caption: "" });
    const thumb = item.querySelector(".var-image-thumb");
    const urlInput = item.querySelector(".var-image-url");
    urlInput.disabled = true;
    urlInput.placeholder = "Comprimindo imagem…";
    try {
      const dataUrl = await compressImageFile(file);
      thumb.src = dataUrl;
      item.dataset.embeddedUrl = dataUrl;
      urlInput.value = "";
      urlInput.placeholder = `Imagem incorporada (${formatBytes(dataUrl.length)})`;
      const sizeLabel = item.querySelector(".var-image-size");
      if (sizeLabel) sizeLabel.textContent = formatBytes(dataUrl.length);
    } catch (err) {
      console.error(err);
      alert("Não foi possível processar essa imagem.");
      item.remove();
    } finally {
      urlInput.disabled = false;
    }
  });
  input.value = "";
}

function formatBytes(n) {
  return n > 1024 ? `${Math.round(n / 1024)} KB` : `${n} B`;
}

function addVariantImageEntry(list, img = { url: "", caption: "" }) {
  const item = document.createElement("div");
  item.className = "var-image-item";
  const isEmbedded = (img.url || "").startsWith("data:");
  item.innerHTML = `
    <img class="var-image-thumb" src="${escapeHtml(img.url || "")}" alt="" />
    <div class="var-image-fields">
      <input type="text" class="var-image-url" placeholder="URL da imagem (ou envie um arquivo)" value="${isEmbedded ? "" : escapeHtml(img.url || "")}" />
      <input type="text" class="var-image-caption" placeholder="Legenda (opcional)" value="${escapeHtml(img.caption || "")}" />
      ${isEmbedded ? `<span class="var-image-size">${formatBytes(img.url.length)}</span>` : ""}
    </div>
    <button type="button" class="btn-remove-var" onclick="this.parentElement.remove()">✕</button>
  `;
  const urlInput = item.querySelector(".var-image-url");
  const thumb = item.querySelector(".var-image-thumb");
  if (isEmbedded) {
    item.dataset.embeddedUrl = img.url;
    urlInput.placeholder = `Imagem incorporada (${formatBytes(img.url.length)})`;
  }
  urlInput.addEventListener("input", () => {
    delete item.dataset.embeddedUrl;
    thumb.src = urlInput.value;
    urlInput.placeholder = "URL da imagem (ou envie um arquivo)";
    const sizeLabel = item.querySelector(".var-image-size");
    if (sizeLabel) sizeLabel.remove();
  });
  list.appendChild(item);
  return item;
}

function addNewVariantField() { addVariantField("new-variants-container"); }
function addVariantFieldEdit() { addVariantField("variants-container"); }

function collectVariantImages(block) {
  return [...block.querySelectorAll(".var-image-item")]
    .map(item => ({
      url: item.dataset.embeddedUrl || item.querySelector(".var-image-url").value.trim(),
      caption: item.querySelector(".var-image-caption").value.trim()
    }))
    .filter(img => img.url);
}

function collectAllVariantsImages(blocks) {
  return [...blocks].map(b => ({
    label: b.querySelector(".var-label").value,
    text: b.querySelector(".var-text").value,
    images: collectVariantImages(b)
  }));
}

async function saveNewPrescription(e) {
  e.preventDefault();
  const form = e.target;
  const sector = form.querySelector('[name="sector"]')?.value || "";
  const disease = form.querySelector('[name="disease"]')?.value || "";
  const blocks = document.querySelectorAll("#new-variants-container .variant-form-group");

  if (!blocks.length) {
    alert("Adicione ao menos uma variante.");
    return;
  }

  showLoading();
  try {
    const variants = await collectAllVariantsImages(blocks);
    await window.dbAdd({ sector, disease, variants });
    e.target.reset();
    document.getElementById("new-variants-container").innerHTML = "";
    addNewVariantField();
    alert("✓ Prescrição incluída com sucesso!");
    switchTab("tab-list", document.getElementById("tab-list-btn"));
    renderAdminList();
  } catch(err) {
    console.error(err);
    alert("Erro ao salvar." + (err?.message ? `\n${err.message}` : ""));
  } finally { hideLoading(); }
}

async function startEdit(id) {
  editingId = id;
  showLoading();
  try {
    const p = await window.dbGetById(id);
    if (!p) return;
    const editId = document.getElementById("edit-id");
    const editSector = getEl("edit-sector", "edit-rx-sector");
    const editDisease = getEl("edit-disease", "edit-rx-disease");
    const container = getEl("variants-container", "edit-variants-container");

    if (editId) editId.value = id;
    if (editSector) editSector.value = p.sector;
    if (editDisease) editDisease.value = p.disease;
    
    if (!container) throw new Error("edit container missing");
    container.innerHTML = "";
    
    if (p.variants && p.variants.length) {
      p.variants.forEach(v => addVariantField("variants-container", v.label, v.text, v.images));
    } else {
      addVariantField("variants-container", "Padrão", p.text || "");
    }
    
    switchTab("tab-edit", document.getElementById("tab-edit-btn"));
  } catch(e) {
    alert("Erro ao buscar dados.");
  } finally { hideLoading(); }
}

async function updatePrescription(e) {
  e.preventDefault();
  const form = e.target;
  const id = editingId || document.getElementById("edit-id")?.value;
  if (!id) return;
  
  const sector = getEl("edit-sector", "edit-rx-sector")?.value || "";
  const disease = getEl("edit-disease", "edit-rx-disease")?.value || "";
  const blocks = document.querySelectorAll("#variants-container .variant-form-group, #edit-variants-container .variant-form-group");

  showLoading();
  try {
    const variants = await collectAllVariantsImages(blocks);
    await window.dbUpdate(id, { sector, disease, variants });
    alert("✓ Prescrição atualizada!");
    editingId = null;
    if (document.getElementById("edit-id")) document.getElementById("edit-id").value = "";
    switchTab("tab-list", document.getElementById("tab-list-btn"));
    renderAdminList();
  } catch(e) {
    console.error(e);
    alert("Erro ao atualizar." + (e?.message ? `\n${e.message}` : ""));
  } finally { hideLoading(); }
}

async function deletePrescription() {
  const id = editingId || document.getElementById("edit-id")?.value;
  if (!id || !confirm("Tem certeza que quer excluir permanentemente esta prescrição?")) return;
  showLoading();
  try {
    await window.dbDelete(id);
    alert("Prescrição excluída.");
    editingId = null;
    if (document.getElementById("edit-id")) document.getElementById("edit-id").value = "";
    switchTab("tab-list", document.getElementById("tab-list-btn"));
    renderAdminList();
  } catch(e) {
    alert("Erro ao deletar.");
  } finally { hideLoading(); }
}

// ============================================================
//  PEDIATRIA
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