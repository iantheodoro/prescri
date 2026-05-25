// ============================================================
//  pediatria.js — Calculadora de doses pediátricas
// ============================================================

const PEDIATRIC_DRUGS = [
  {
    id: "dipirona",
    name: "Dipirona (Metamizol)",
    category: "Analgésico / Antipirético",
    dose_per_kg: 15,        // mg/kg
    dose_min: null,
    dose_max: 1000,         // mg por dose (máximo)
    interval: "a cada 6 horas",
    max_daily: 4000,        // mg/dia
    weight_min: 3,
    weight_max: 70,
    presentations: [
      { label: "Gotas (500 mg/mL = 25 mg/gota)", unit: "gotas", concentration: 500, drop_mg: 25 },
      { label: "Solução oral (50 mg/mL)", unit: "mL", concentration: 50 },
      { label: "Comprimido 500 mg", unit: "comprimidos", fixed_mg: 500 },
      { label: "Injetável (500 mg/mL)", unit: "mL", concentration: 500 }
    ],
    notes: "Não usar em < 3 meses ou < 5 kg. Máx. 4 doses/dia. Dose máxima: 1g/dose.",
    route: "VO / IM / IV"
  },
  {
    id: "paracetamol",
    name: "Paracetamol",
    category: "Analgésico / Antipirético",
    dose_per_kg: 15,
    dose_max: 1000,
    interval: "a cada 6 horas",
    max_daily: 4000,
    weight_min: 3,
    weight_max: 70,
    presentations: [
      { label: "Gotas (200 mg/mL = 10 mg/gota)", unit: "gotas", concentration: 200, drop_mg: 10 },
      { label: "Solução oral (32 mg/mL)", unit: "mL", concentration: 32 },
      { label: "Comprimido 500 mg", unit: "comprimidos", fixed_mg: 500 },
      { label: "Comprimido 750 mg", unit: "comprimidos", fixed_mg: 750 }
    ],
    notes: "Máx. 5 doses/dia. Intervalo mínimo de 4h. Cuidado em hepatopatias.",
    route: "VO / Retal"
  },
  {
    id: "ibuprofeno",
    name: "Ibuprofeno",
    category: "Anti-inflamatório / Antipirético",
    dose_per_kg: 10,
    dose_max: 600,
    interval: "a cada 6–8 horas",
    max_daily: 2400,
    weight_min: 5,
    weight_max: 70,
    presentations: [
      { label: "Suspensão 50 mg/mL", unit: "mL", concentration: 50 },
      { label: "Suspensão 20 mg/mL", unit: "mL", concentration: 20 },
      { label: "Comprimido 200 mg", unit: "comprimidos", fixed_mg: 200 },
      { label: "Comprimido 400 mg", unit: "comprimidos", fixed_mg: 400 }
    ],
    notes: "Não usar em < 6 meses. Evitar em desidratação, sangramento GI, insuficiência renal.",
    route: "VO"
  },
  {
    id: "amoxicilina",
    name: "Amoxicilina",
    category: "Antibiótico",
    dose_per_kg: 50,
    dose_max: 3000,
    interval: "a cada 8 horas (dividir dose diária em 3x)",
    max_daily: 3000,
    weight_min: 3,
    weight_max: 40,
    presentations: [
      { label: "Suspensão 50 mg/mL", unit: "mL", concentration: 50 },
      { label: "Suspensão 25 mg/mL", unit: "mL", concentration: 25 },
      { label: "Comprimido 500 mg", unit: "comprimidos", fixed_mg: 500 }
    ],
    notes: "Dose: 40–50 mg/kg/dia dividida de 8/8h. Infecções graves: até 80–90 mg/kg/dia. Duração conforme diagnóstico.",
    route: "VO",
    dose_type: "daily" // dose total diária, dividir por 3
  },
  {
    id: "amox_clavulanato",
    name: "Amoxicilina + Clavulanato",
    category: "Antibiótico",
    dose_per_kg: 45,
    dose_max: 1500,
    interval: "a cada 8 horas",
    max_daily: 1500,
    weight_min: 3,
    weight_max: 40,
    presentations: [
      { label: "Suspensão 50/12,5 mg/mL", unit: "mL", concentration: 50 },
      { label: "Comprimido 875/125 mg", unit: "comprimidos", fixed_mg: 875 }
    ],
    notes: "Dose baseada no componente amoxicilina: 40–45 mg/kg/dia em 3 doses. Tomar com alimento.",
    route: "VO",
    dose_type: "daily"
  },
  {
    id: "azitromicina",
    name: "Azitromicina",
    category: "Antibiótico",
    dose_per_kg: 10,
    dose_max: 500,
    interval: "1x ao dia por 3–5 dias",
    max_daily: 500,
    weight_min: 5,
    weight_max: 40,
    presentations: [
      { label: "Suspensão 40 mg/mL", unit: "mL", concentration: 40 },
      { label: "Suspensão 20 mg/mL", unit: "mL", concentration: 20 },
      { label: "Comprimido 500 mg", unit: "comprimidos", fixed_mg: 500 }
    ],
    notes: "1x ao dia. Otite: dose única 30 mg/kg (máx 1,5g). PAC leve: 10 mg/kg/dia por 5 dias.",
    route: "VO"
  },
  {
    id: "dexametasona",
    name: "Dexametasona",
    category: "Corticoide",
    dose_per_kg: 0.15,
    dose_max: 10,
    interval: "dose única ou conforme indicação",
    max_daily: 10,
    weight_min: 3,
    weight_max: 70,
    presentations: [
      { label: "Solução oral 0,1 mg/mL", unit: "mL", concentration: 0.1 },
      { label: "Injetável 4 mg/mL", unit: "mL", concentration: 4 },
      { label: "Injetável 10 mg/mL", unit: "mL", concentration: 10 }
    ],
    notes: "Crupe: 0,15–0,6 mg/kg IM/VO dose única. Máx. 10 mg. Pré-extubação: 0,5 mg/kg de 6/6h.",
    route: "VO / IM / IV"
  },
  {
    id: "prednisolona",
    name: "Prednisolona",
    category: "Corticoide",
    dose_per_kg: 1,
    dose_max: 60,
    interval: "1x ao dia (manhã)",
    max_daily: 60,
    weight_min: 3,
    weight_max: 60,
    presentations: [
      { label: "Solução oral 3 mg/mL", unit: "mL", concentration: 3 },
      { label: "Comprimido 20 mg", unit: "comprimidos", fixed_mg: 20 },
      { label: "Comprimido 5 mg", unit: "comprimidos", fixed_mg: 5 }
    ],
    notes: "Asma aguda: 1–2 mg/kg/dia por 3–5 dias. Máx 60 mg/dia. Tomar pela manhã com alimento.",
    route: "VO"
  },
  {
    id: "salbutamol",
    name: "Salbutamol (Albuterol)",
    category: "Broncodilatador",
    dose_per_kg: 0.15,
    dose_max: 5,
    interval: "a cada 20 min (crise) ou 4–6h (manutenção)",
    max_daily: null,
    weight_min: 3,
    weight_max: 40,
    presentations: [
      { label: "Solução para nebulização 5 mg/mL", unit: "mL", concentration: 5 },
      { label: "Spray (100 mcg/jato)", unit: "jatos", dose_fixed_label: "2–4 jatos com espaçador" }
    ],
    notes: "Nebulização: 0,15 mg/kg (mín. 2,5 mg, máx. 5 mg) em 3–4 mL de SF. Spray com espaçador: 2–4 jatos.",
    route: "Inalatório"
  },
  {
    id: "cetirizina",
    name: "Cetirizina",
    category: "Anti-histamínico",
    dose_per_kg: null,
    dose_max: 10,
    interval: "1x ao dia",
    max_daily: 10,
    weight_min: 5,
    weight_max: 70,
    presentations: [
      { label: "Solução oral 1 mg/mL", unit: "mL", concentration: 1 },
      { label: "Comprimido 10 mg", unit: "comprimidos", fixed_mg: 10 }
    ],
    notes: "2–6 anos: 2,5–5 mg/dia. 6–12 anos: 5–10 mg/dia. > 12 anos: 10 mg/dia. Dose fixa por faixa etária.",
    route: "VO",
    dose_by_age: [
      { age_min: 0, age_max: 2, dose: 2.5 },
      { age_min: 2, age_max: 6, dose: 5 },
      { age_min: 6, age_max: 18, dose: 10 }
    ]
  },
  {
    id: "ondansetrona",
    name: "Ondansetrona",
    category: "Antiemético",
    dose_per_kg: 0.15,
    dose_max: 8,
    interval: "a cada 8 horas",
    max_daily: 24,
    weight_min: 5,
    weight_max: 70,
    presentations: [
      { label: "Solução oral 4 mg/5 mL (0,8 mg/mL)", unit: "mL", concentration: 0.8 },
      { label: "Comprimido 4 mg", unit: "comprimidos", fixed_mg: 4 },
      { label: "Comprimido 8 mg", unit: "comprimidos", fixed_mg: 8 },
      { label: "Injetável 2 mg/mL", unit: "mL", concentration: 2 }
    ],
    notes: "0,15 mg/kg EV/VO. Máx 8 mg/dose, 3x/dia. Não recomendado < 6 meses.",
    route: "VO / IV"
  },
  {
    id: "adrenalina",
    name: "Adrenalina (Epinefrina)",
    category: "Emergência",
    dose_per_kg: 0.01,
    dose_max: 0.5,
    interval: "conforme resposta clínica",
    max_daily: null,
    weight_min: 3,
    weight_max: 70,
    presentations: [
      { label: "Injetável 1:1000 (1 mg/mL) — IM", unit: "mL", concentration: 1 },
      { label: "Solução para nebulização (1 mg/mL)", unit: "mL", concentration: 1 }
    ],
    notes: "Anafilaxia: 0,01 mg/kg IM (máx 0,5 mg). Crupe: 0,4 mg/kg nebulizado (máx 5 mL da sol. 1:1000).",
    route: "IM / Inalatório"
  }
];

window.PEDIATRIC_DRUGS = PEDIATRIC_DRUGS;
