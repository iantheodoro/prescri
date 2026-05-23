// ============================================================
//  db.js — Banco de dados Firebase Firestore
//  Sincronizado em todos os dispositivos
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB3rh1_H4hNFRauNV57_1-aWivG_HF7wUY",
  authDomain: "qbank-e58b5.firebaseapp.com",
  projectId: "qbank-e58b5",
  storageBucket: "qbank-e58b5.firebasestorage.app",
  messagingSenderId: "968458765807",
  appId: "1:968458765807:web:65faa5479c03b30532e21a"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const COL = "prescricoes";

// ── Prescrições iniciais ──────────────────────────────────
const SEED_DATA = [
  {
    sector: "UTI", disease: "Sepse / Choque Séptico",
    prescription: `PRESCRIÇÃO MÉDICA — SEPSE / CHOQUE SÉPTICO

1. CRISTALOIDE
   - SF 0,9% 30 mL/kg EV em bolus (reavaliação a cada 30 min)

2. ANTIBIÓTICOS (iniciar em até 1h)
   - Piperacilina-Tazobactam 4,5g EV de 6/6h
   - OU Meropeném 1g EV de 8/8h (se risco de MDR)
   + Vancomicina 25-30 mg/kg/dia (se suspeita MRSA)

3. VASOPRESSOR (se PAM < 65 após ressuscitação)
   - Noradrenalina 0,01–0,5 mcg/kg/min (titular PAM ≥ 65)

4. CORTICOIDE (se choque refratário)
   - Hidrocortisona 200 mg/dia EV contínuo

5. MONITORIZAÇÃO
   - Lactato sérico a cada 2h
   - Hemocultura 2 pares ANTES dos antibióticos
   - Débito urinário ≥ 0,5 mL/kg/h`
  },
  {
    sector: "UTI", disease: "Síndrome de Angústia Respiratória Aguda (SARA)",
    prescription: `PRESCRIÇÃO MÉDICA — SARA

1. VENTILAÇÃO PROTETORA
   - Volume corrente: 4–6 mL/kg (peso predito)
   - PEEP: ajustar conforme tabela ARDSNet
   - Pressão de plateau ≤ 30 cmH₂O
   - FiO₂: titular SpO₂ 88–95%

2. POSIÇÃO PRONA
   - Indicação: PaO₂/FiO₂ < 150 — Duração: 16h/dia

3. SEDAÇÃO E ANALGESIA
   - Fentanil 25–100 mcg/h EV contínuo
   - Midazolam 0,02–0,1 mg/kg/h EV contínuo — RASS alvo: -2 a -3

4. BLOQUEIO NEUROMUSCULAR (primeiras 48h se grave)
   - Cisatracúrio 37,5 mg/h EV contínuo`
  },
  {
    sector: "UTI", disease: "Parada Cardiorrespiratória — Pós-Ressuscitação",
    prescription: `PRESCRIÇÃO MÉDICA — PÓS-PCR

1. CONTROLE TEMPERATURA
   - Hipotermia terapêutica: 32–36°C por 24h

2. HEMODINÂMICA
   - PAM alvo ≥ 65–80 mmHg

3. NEUROPROTEÇÃO
   - Cabeceira 30° / Controle glicêmico 140–180 mg/dL
   - Evitar hiperoxia: SpO₂ 94–98%

4. CONVULSÕES
   - Levetiracetam 1g EV de 12/12h

5. INVESTIGAR CAUSA
   - ECG, troponina, CATE precoce se IAMCSST`
  },
  {
    sector: "Sala Vermelha", disease: "Infarto Agudo do Miocárdio com Supra de ST (IAMCSST)",
    prescription: `PRESCRIÇÃO MÉDICA — IAMCSST

⚡ OBJETIVO: CATE em < 90 min da chegada

1. ANTIAGREGAÇÃO DUPLA
   - AAS 300 mg VO → 100 mg/dia
   - Ticagrelor 180 mg VO → 90 mg 2x/dia

2. ANTICOAGULAÇÃO
   - Heparina não fracionada 70 UI/kg EV (max 5.000 UI)

3. ANALGESIA
   - Morfina 2–4 mg EV (titular dor)

4. SUPORTE
   - O₂ se SpO₂ < 90% / Monitorização contínua ECG
   - Acesso venoso calibroso x2 / Desfibrilador à beira-leito

5. BETABLOQUEADOR
   - Metoprolol 25–50 mg VO nas primeiras 24h`
  },
  {
    sector: "Sala Vermelha", disease: "Acidente Vascular Cerebral Isquêmico (AVCi)",
    prescription: `PRESCRIÇÃO MÉDICA — AVCI AGUDO

⚡ OBJETIVO: Trombólise em < 60 min da chegada

1. AVALIAÇÃO RÁPIDA
   - TC de crânio sem contraste URGENTE
   - Glicemia capilar, coagulograma, ECG, NIHSS

2. TROMBÓLISE EV (se elegível, < 4,5h)
   - Alteplase 0,9 mg/kg EV (max 90 mg)
   - 10% em bolus → 90% em 60 min

3. CONTROLE PRESSÓRICO
   - Com trombólise: PA < 180/105
   - Sem trombólise: tratar se PA > 220/120

4. ANTITROMBÓTICO (24h após trombólise)
   - AAS 300 mg VO → 100 mg/dia + Atorvastatina 40–80 mg`
  },
  {
    sector: "Sala Vermelha", disease: "Anafilaxia",
    prescription: `PRESCRIÇÃO MÉDICA — ANAFILAXIA

⚡ ADRENALINA IMEDIATA

1. ADRENALINA 1ª LINHA
   - 1:1000 → 0,3–0,5 mg IM (coxa) — repetir 5–15 min se necessário

2. SUPORTE
   - O₂ 8–15 L/min / SF 0,9% 500–1000 mL EV rápido

3. 2ª LINHA
   - Prometazina 25 mg EV
   - Hidrocortisona 200 mg EV

4. BRONCOESPASMO
   - Salbutamol NBZ 5 mg

5. MONITORIZAÇÃO 4–8h após resolução`
  },
  {
    sector: "Sala Verde", disease: "Pneumonia Adquirida na Comunidade (PAC) — Leve",
    prescription: `PRESCRIÇÃO MÉDICA — PAC LEVE

1. ANTIBIOTICOTERAPIA
   A (sem comorbidades): Amoxicilina 500 mg VO 8/8h × 5–7 dias
   B (com comorbidades): Amoxicilina-Clavulanato 875/125 mg 12/12h
                        + Azitromicina 500 mg/dia × 5 dias
   C (alergia penicilina): Levofloxacino 750 mg/dia × 5 dias

2. SINTOMÁTICOS
   - Dipirona 1g VO de 6/6h se febre/dor

3. SUPORTE
   - Hidratação oral ≥ 1,5 L/dia / Retorno em 48–72h`
  },
  {
    sector: "Sala Verde", disease: "Crise Hipertensiva — Urgência",
    prescription: `PRESCRIÇÃO MÉDICA — URGÊNCIA HIPERTENSIVA

OBJETIVO: Reduzir PA ≤ 25% nas primeiras horas

1. REPOUSO 20–30 min antes de 2ª medida

2. MEDICAÇÃO VO
   Opção 1: Captopril 25 mg SL ou VO
   Opção 2: Atenolol 25–50 mg VO (se FC elevada)
   Opção 3: Clonidina 0,1–0,2 mg VO

3. ALTA
   - Manter medicação habitual / Consulta em 24–48h
   - Retornar SE: cefaleia intensa, déficit neurológico, dor torácica`
  },
  {
    sector: "Sala Verde", disease: "Crise Asmática — Leve a Moderada",
    prescription: `PRESCRIÇÃO MÉDICA — ASMA LEVE A MODERADA

1. BRONCODILATADOR (imediato)
   - Salbutamol 2,5 mg NBZ a cada 20 min (3 doses)
   + Ipratrópio 0,25 mg NBZ junto

2. CORTICOIDE
   - Prednisolona 1–2 mg/kg VO (max 60 mg) por 3–5 dias

3. OXIGÊNIO
   - Se SpO₂ < 92% → alvo 93–95%

4. REAVALIAÇÃO 1h
   - Boa resposta → alta com corticoide oral + resgate
   - Sem resposta → Sala Vermelha`
  }
];

// ── Seed automático se banco vazio ────────────────────────
async function dbInit() {
  const snap = await getDocs(collection(db, COL));
  if (snap.empty) {
    for (const item of SEED_DATA) {
      await addDoc(collection(db, COL), item);
    }
  }
}

// ── CRUD ──────────────────────────────────────────────────
async function dbGetAll() {
  const snap = await getDocs(collection(db, COL));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function dbGetBySector(sector) {
  const q = query(collection(db, COL), where("sector", "==", sector));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function dbGetById(id) {
  const all = await dbGetAll();
  return all.find(p => p.id === id);
}

async function dbAdd(entry) {
  await addDoc(collection(db, COL), entry);
}

async function dbUpdate(id, updated) {
  await updateDoc(doc(db, COL, id), updated);
}

async function dbDelete(id) {
  await deleteDoc(doc(db, COL, id));
}

window.dbInit        = dbInit;
window.dbGetAll      = dbGetAll;
window.dbGetBySector = dbGetBySector;
window.dbGetById     = dbGetById;
window.dbAdd         = dbAdd;
window.dbUpdate      = dbUpdate;
window.dbDelete      = dbDelete;
