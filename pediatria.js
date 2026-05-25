// ============================================================
//  pediatria.js — Banco de medicamentos pediátricos
//  Editável pelo usuário via painel de configurações
// ============================================================

const PED_DRUGS_KEY = "ped_drugs_custom";

const PED_DRUGS_DEFAULT = [
  {
    id: "dipirona",
    name: "Dipirona",
    category: "Analgésico / Antipirético",
    dose_mode: "weight",       // "weight" | "age" | "fixed"
    dose_per_kg: 15,           // mg/kg/dose
    dose_min_mg: null,
    dose_max_mg: 1000,
    interval: "6/6h",
    duration: "5 dias",
    routes: ["VO", "IM", "IV"],
    default_route: "VO",
    presentations: [
      { id: "p1", label: "Gotas 500 mg/mL (25 mg/gota)", type: "drops", concentration: 500, drop_mg: 25, unit: "gotas" },
      { id: "p2", label: "Solução oral 50 mg/mL", type: "liquid", concentration: 50, unit: "mL" },
      { id: "p3", label: "Comprimido 500 mg", type: "tablet", fixed_mg: 500, unit: "comprimidos" },
      { id: "p4", label: "Injetável 500 mg/mL", type: "liquid", concentration: 500, unit: "mL" }
    ],
    notes: "Não usar < 3 meses ou < 5 kg. Máx. 4 doses/dia.",
    weight_min: 5, weight_max: 70
  },
  {
    id: "paracetamol",
    name: "Paracetamol",
    category: "Analgésico / Antipirético",
    dose_mode: "weight",
    dose_per_kg: 15,
    dose_max_mg: 1000,
    interval: "6/6h",
    duration: "5 dias",
    routes: ["VO", "Retal"],
    default_route: "VO",
    presentations: [
      { id: "p1", label: "Gotas 200 mg/mL (10 mg/gota)", type: "drops", concentration: 200, drop_mg: 10, unit: "gotas" },
      { id: "p2", label: "Solução oral 32 mg/mL", type: "liquid", concentration: 32, unit: "mL" },
      { id: "p3", label: "Comprimido 500 mg", type: "tablet", fixed_mg: 500, unit: "comprimidos" },
      { id: "p4", label: "Comprimido 750 mg", type: "tablet", fixed_mg: 750, unit: "comprimidos" }
    ],
    notes: "Máx. 5 doses/dia. Intervalo mínimo 4h. Cuidado em hepatopatias.",
    weight_min: 3, weight_max: 70
  },
  {
    id: "ibuprofeno",
    name: "Ibuprofeno",
    category: "Anti-inflamatório / Antipirético",
    dose_mode: "weight",
    dose_per_kg: 10,
    dose_max_mg: 600,
    interval: "6/6h ou 8/8h",
    duration: "5 dias",
    routes: ["VO"],
    default_route: "VO",
    presentations: [
      { id: "p1", label: "Suspensão 50 mg/mL", type: "liquid", concentration: 50, unit: "mL" },
      { id: "p2", label: "Suspensão 20 mg/mL", type: "liquid", concentration: 20, unit: "mL" },
      { id: "p3", label: "Comprimido 200 mg", type: "tablet", fixed_mg: 200, unit: "comprimidos" },
      { id: "p4", label: "Comprimido 400 mg", type: "tablet", fixed_mg: 400, unit: "comprimidos" }
    ],
    notes: "Não usar < 6 meses. Evitar em desidratação, sangramento GI, insuficiência renal.",
    weight_min: 6, weight_max: 70
  },
  {
    id: "amoxicilina",
    name: "Amoxicilina",
    category: "Antibiótico",
    dose_mode: "weight",
    dose_per_kg: 50,
    dose_max_mg: 1500,
    dose_is_daily: true,
    interval: "8/8h",
    duration: "7 dias",
    routes: ["VO"],
    default_route: "VO",
    presentations: [
      { id: "p1", label: "Suspensão 50 mg/mL", type: "liquid", concentration: 50, unit: "mL" },
      { id: "p2", label: "Suspensão 25 mg/mL", type: "liquid", concentration: 25, unit: "mL" },
      { id: "p3", label: "Comprimido 500 mg", type: "tablet", fixed_mg: 500, unit: "comprimidos" }
    ],
    notes: "Dose diária dividida em 3 doses (8/8h). Infecções graves: até 80–90 mg/kg/dia.",
    weight_min: 3, weight_max: 40
  },
  {
    id: "amox_clavulanato",
    name: "Amoxicilina + Clavulanato",
    category: "Antibiótico",
    dose_mode: "weight",
    dose_per_kg: 45,
    dose_max_mg: 1500,
    dose_is_daily: true,
    interval: "8/8h",
    duration: "7 dias",
    routes: ["VO"],
    default_route: "VO",
    presentations: [
      { id: "p1", label: "Suspensão 50/12,5 mg/mL", type: "liquid", concentration: 50, unit: "mL" },
      { id: "p2", label: "Comprimido 875/125 mg", type: "tablet", fixed_mg: 875, unit: "comprimidos" }
    ],
    notes: "Dose baseada na amoxicilina. Tomar com alimento para melhor tolerância.",
    weight_min: 3, weight_max: 40
  },
  {
    id: "azitromicina",
    name: "Azitromicina",
    category: "Antibiótico",
    dose_mode: "weight",
    dose_per_kg: 10,
    dose_max_mg: 500,
    interval: "24h (1x ao dia)",
    duration: "3 dias",
    routes: ["VO"],
    default_route: "VO",
    presentations: [
      { id: "p1", label: "Suspensão 40 mg/mL", type: "liquid", concentration: 40, unit: "mL" },
      { id: "p2", label: "Suspensão 20 mg/mL", type: "liquid", concentration: 20, unit: "mL" },
      { id: "p3", label: "Comprimido 500 mg", type: "tablet", fixed_mg: 500, unit: "comprimidos" }
    ],
    notes: "Tomar 1x ao dia, longe das refeições.",
    weight_min: 5, weight_max: 40
  },
  {
    id: "dexametasona",
    name: "Dexametasona",
    category: "Corticoide",
    dose_mode: "weight",
    dose_per_kg: 0.15,
    dose_max_mg: 10,
    interval: "dose única",
    duration: "dose única",
    routes: ["VO", "IM", "IV"],
    default_route: "IM",
    presentations: [
      { id: "p1", label: "Solução oral 0,1 mg/mL", type: "liquid", concentration: 0.1, unit: "mL" },
      { id: "p2", label: "Injetável 4 mg/mL", type: "liquid", concentration: 4, unit: "mL" },
      { id: "p3", label: "Injetável 10 mg/mL", type: "liquid", concentration: 10, unit: "mL" }
    ],
    notes: "Crupe: 0,15–0,6 mg/kg dose única. Pré-extubação: 0,5 mg/kg 6/6h.",
    weight_min: 3, weight_max: 70
  },
  {
    id: "prednisolona",
    name: "Prednisolona",
    category: "Corticoide",
    dose_mode: "weight",
    dose_per_kg: 1,
    dose_max_mg: 60,
    interval: "24h (1x ao dia)",
    duration: "3–5 dias",
    routes: ["VO"],
    default_route: "VO",
    presentations: [
      { id: "p1", label: "Solução oral 3 mg/mL", type: "liquid", concentration: 3, unit: "mL" },
      { id: "p2", label: "Comprimido 20 mg", type: "tablet", fixed_mg: 20, unit: "comprimidos" },
      { id: "p3", label: "Comprimido 5 mg", type: "tablet", fixed_mg: 5, unit: "comprimidos" }
    ],
    notes: "Asma aguda: 1–2 mg/kg/dia. Máx. 60 mg/dia. Tomar pela manhã com alimento.",
    weight_min: 3, weight_max: 60
  },
  {
    id: "salbutamol",
    name: "Salbutamol",
    category: "Broncodilatador",
    dose_mode: "weight",
    dose_per_kg: 0.15,
    dose_max_mg: 5,
    interval: "a cada 20 min (crise) / 4–6h (manutenção)",
    duration: "conforme resposta",
    routes: ["Inalatório"],
    default_route: "Inalatório",
    presentations: [
      { id: "p1", label: "Nebulização 5 mg/mL", type: "liquid", concentration: 5, unit: "mL" },
      { id: "p2", label: "Spray 100 mcg/jato", type: "fixed", fixed_label: "2–4 jatos com espaçador", unit: "jatos" }
    ],
    notes: "Nebulização: completar para 3–4 mL com SF 0,9%. Mín. 2,5 mg, máx. 5 mg.",
    weight_min: 3, weight_max: 40
  },
  {
    id: "cetirizina",
    name: "Cetirizina",
    category: "Anti-histamínico",
    dose_mode: "age",
    dose_per_kg: null,
    dose_max_mg: 10,
    interval: "24h (1x ao dia)",
    duration: "conforme indicação",
    routes: ["VO"],
    default_route: "VO",
    age_doses: [
      { age_min: 0,  age_max: 2,  dose_mg: 2.5,  label: "< 2 anos" },
      { age_min: 2,  age_max: 6,  dose_mg: 5,    label: "2–6 anos" },
      { age_min: 6,  age_max: 99, dose_mg: 10,   label: "> 6 anos" }
    ],
    presentations: [
      { id: "p1", label: "Solução oral 1 mg/mL", type: "liquid", concentration: 1, unit: "mL" },
      { id: "p2", label: "Comprimido 10 mg", type: "tablet", fixed_mg: 10, unit: "comprimidos" }
    ],
    notes: "Dose por faixa etária, não por peso.",
    weight_min: 5, weight_max: 70
  },
  {
    id: "ondansetrona",
    name: "Ondansetrona",
    category: "Antiemético",
    dose_mode: "weight",
    dose_per_kg: 0.15,
    dose_max_mg: 8,
    interval: "8/8h",
    duration: "2–3 dias",
    routes: ["VO", "IV", "IM"],
    default_route: "VO",
    presentations: [
      { id: "p1", label: "Solução oral 0,8 mg/mL", type: "liquid", concentration: 0.8, unit: "mL" },
      { id: "p2", label: "Comprimido 4 mg", type: "tablet", fixed_mg: 4, unit: "comprimidos" },
      { id: "p3", label: "Injetável 2 mg/mL", type: "liquid", concentration: 2, unit: "mL" }
    ],
    notes: "Não recomendado < 6 meses. Máx. 8 mg/dose, 3x/dia.",
    weight_min: 6, weight_max: 70
  },
  {
    id: "adrenalina",
    name: "Adrenalina",
    category: "Emergência",
    dose_mode: "weight",
    dose_per_kg: 0.01,
    dose_max_mg: 0.5,
    interval: "dose única / repetir conforme resposta",
    duration: "conforme protocolo",
    routes: ["IM", "IV", "Inalatório"],
    default_route: "IM",
    presentations: [
      { id: "p1", label: "Injetável 1:1000 (1 mg/mL)", type: "liquid", concentration: 1, unit: "mL" },
      { id: "p2", label: "Nebulização 1:1000 (1 mg/mL)", type: "liquid", concentration: 1, unit: "mL" }
    ],
    notes: "Anafilaxia: 0,01 mg/kg IM (máx 0,5 mg). Crupe: 0,4 mg/kg nebulizado (máx 5 mL).",
    weight_min: 3, weight_max: 70
  }
];

function pedDrugsGet() {
  try {
    const stored = localStorage.getItem(PED_DRUGS_KEY);
    return stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(PED_DRUGS_DEFAULT));
  } catch { return JSON.parse(JSON.stringify(PED_DRUGS_DEFAULT)); }
}

function pedDrugsSave(list) {
  localStorage.setItem(PED_DRUGS_KEY, JSON.stringify(list));
}

function pedDrugsGetOne(id) {
  return pedDrugsGet().find(d => d.id === id);
}

function pedDrugsUpdate(id, updated) {
  const list = pedDrugsGet().map(d => d.id === id ? { ...d, ...updated } : d);
  pedDrugsSave(list);
}

function pedDrugsAdd(drug) {
  const list = pedDrugsGet();
  drug.id = "custom_" + Date.now();
  list.push(drug);
  pedDrugsSave(list);
  return drug;
}

function pedDrugsDelete(id) {
  const list = pedDrugsGet().filter(d => d.id !== id);
  pedDrugsSave(list);
}

// Calcula dose em mg para um medicamento dado peso e idade
function pedCalcDoseMg(drug, weightKg, ageYears) {
  if (drug.dose_mode === "age" && drug.age_doses) {
    const bucket = drug.age_doses.find(b => ageYears >= b.age_min && ageYears < b.age_max)
                || drug.age_doses[drug.age_doses.length - 1];
    return { dose_mg: bucket.dose_mg, label: bucket.label, is_daily: false };
  }
  if (drug.dose_mode === "weight" && drug.dose_per_kg) {
    let dose = drug.dose_per_kg * weightKg;
    if (drug.dose_max_mg) dose = Math.min(dose, drug.dose_max_mg);
    dose = Math.round(dose * 10) / 10;
    if (drug.dose_is_daily) {
      const perDose = Math.round((dose / 3) * 10) / 10;
      return { dose_mg: perDose, daily_mg: dose, is_daily: true };
    }
    return { dose_mg: dose, is_daily: false };
  }
  return { dose_mg: 0, is_daily: false };
}

// Calcula volume/quantidade para cada apresentação
function pedCalcPresentation(pres, dose_mg) {
  if (pres.type === "fixed") return { value: null, label: pres.fixed_label };
  if (pres.type === "drops") {
    const gotas = Math.round(dose_mg / pres.drop_mg);
    return { value: gotas, label: `${gotas} gotas` };
  }
  if (pres.type === "liquid") {
    const vol = Math.round((dose_mg / pres.concentration) * 10) / 10;
    return { value: vol, label: `${vol} mL` };
  }
  if (pres.type === "tablet") {
    const qty = dose_mg / pres.fixed_mg;
    const label = qty % 1 === 0
      ? `${qty} comprimido${qty > 1 ? 's' : ''}`
      : `${qty.toFixed(2)} comprimido${qty > 1 ? 's' : ''} (fracionar)`;
    return { value: qty, label };
  }
  return { value: null, label: "—" };
}

// Gera texto de prescrição automaticamente
function pedGeneratePrescriptionText(drug, weightKg, ageYears, route, presId, doseOverride) {
  const calc = pedCalcDoseMg(drug, weightKg, ageYears);
  const dose_mg = doseOverride !== null && doseOverride !== undefined ? doseOverride : calc.dose_mg;
  const pres = drug.presentations.find(p => p.id === presId) || drug.presentations[0];
  const presCalc = pedCalcPresentation(pres, dose_mg);

  let quantityLine = "";
  if (pres.type === "fixed") {
    quantityLine = presCalc.label;
  } else if (pres.type === "drops") {
    quantityLine = `${presCalc.label} (${dose_mg} mg)`;
  } else if (pres.type === "liquid") {
    quantityLine = `${presCalc.label} (${dose_mg} mg)`;
  } else if (pres.type === "tablet") {
    quantityLine = presCalc.label;
  }

  const dailyNote = calc.is_daily
    ? `\n   Dose diária total: ${calc.daily_mg} mg dividida de ${drug.interval}`
    : "";

  return `${drug.name} — ${pres.label}
   Peso: ${weightKg} kg${ageYears ? ` | Idade: ${ageYears} ${ageYears === 1 ? 'ano' : 'anos'}` : ''}
   Dose: ${drug.dose_per_kg ? drug.dose_per_kg + ' mg/kg → ' : ''}${quantityLine}${dailyNote}
   Via: ${route} | Intervalo: ${drug.interval}
   Duração: ${drug.duration}
   Obs: ${drug.notes}`;
}

window.pedDrugsGet             = pedDrugsGet;
window.pedDrugsSave            = pedDrugsSave;
window.pedDrugsGetOne          = pedDrugsGetOne;
window.pedDrugsUpdate          = pedDrugsUpdate;
window.pedDrugsAdd             = pedDrugsAdd;
window.pedDrugsDelete          = pedDrugsDelete;
window.pedCalcDoseMg           = pedCalcDoseMg;
window.pedCalcPresentation     = pedCalcPresentation;
window.pedGeneratePrescriptionText = pedGeneratePrescriptionText;
