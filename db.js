// ============================================================
//  db.js — Firebase Firestore com suporte a variantes
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCuabgnUiFxWOtAbhnm1lPlgQNqbFGZqXo",
  authDomain: "receita-ea6a4.firebaseapp.com",
  projectId: "receita-ea6a4",
  storageBucket: "receita-ea6a4.firebasestorage.app",
  messagingSenderId: "169846902582",
  appId: "1:169846902582:web:8d44f2a1eb5ee837672d97"
};

firebase.initializeApp(firebaseConfig);
const db  = firebase.firestore();
const COL = "prescricoes";

// Observação: imagens das prescrições são comprimidas no navegador
// e salvas como base64 dentro do próprio documento (ver app.js,
// função compressImageFile). Isso evita depender do Firebase Storage
// (plano Blaze) e mantém o app no plano gratuito (Spark).

// Estrutura: cada prescrição tem "variants": [ { label, text }, ... ]
// Se tiver só uma variante, não mostra abas

const SEED_DATA = [
  {
    sector: "Sala Verde",
    disease: "Pneumonia Adquirida na Comunidade (PAC)",
    variants: [
      {
        label: "Sem Comorbidades",
        text: `USO ORAL:

1) Amoxicilina 500 mg — 15 comprimidos
   Tomar 1 comprimido, via oral, de 8 em 8 horas (3x ao dia) por 5 dias

2) Dipirona 1g — 20 comprimidos
   Tomar 1 comprimido, via oral, de 6 em 6 horas (4x ao dia) se febre ou dor

INDICAÇÕES MÉDICAS:

1) Hidratação oral — 1,5 L por dia
   Tomar 1,5 litro de água ou sucos naturais.
   Não entram: refrigerantes, bebidas alcoólicas ou alimentos.

2) Retorno em 48–72h ou antes se piora do quadro.
   Atenção aos sinais de piora: tosse com sangue, sensação de desmaio,
   dificuldade para respirar. Procure novamente o Pronto Socorro.`
      },
      {
        label: "Com Comorbidades",
        text: `USO ORAL:

1) Amoxicilina-Clavulanato 875/125 mg — 10 comprimidos
   Tomar 1 comprimido, via oral, de 12 em 12 horas (2x ao dia) por 5 dias

2) Azitromicina 500 mg — 3 comprimidos
   Tomar 1 comprimido, via oral, a cada 24 horas (1x ao dia) por 3 dias

INDICAÇÕES MÉDICAS:

1) Hidratação oral — 1,5 L por dia
   Tomar 1,5 litro de água ou sucos naturais.
   Não entram: refrigerantes, bebidas alcoólicas ou alimentos.

2) Retorno em 48–72h ou antes se piora do quadro.
   Atenção aos sinais de piora: tosse com sangue, sensação de desmaio,
   dificuldade para respirar. Procure novamente o Pronto Socorro.`
      },
      {
        label: "Alergia a Penicilina",
        text: `USO ORAL:

1) Levofloxacino 750 mg — 5 comprimidos
   Tomar 1 comprimido, via oral, a cada 24 horas (1x ao dia) por 5 dias

INDICAÇÕES MÉDICAS:

1) Hidratação oral — 1,5 L por dia
   Tomar 1,5 litro de água ou sucos naturais.
   Não entram: refrigerantes, bebidas alcoólicas ou alimentos.

2) Retorno em 48–72h ou antes se piora do quadro.
   Atenção aos sinais de piora: tosse com sangue, sensação de desmaio,
   dificuldade para respirar. Procure novamente o Pronto Socorro.`
      }
    ]
  },
  {
    sector: "Sala Verde",
    disease: "Crise Hipertensiva — Urgência",
    variants: [
      {
        label: "1ª Escolha",
        text: `USO ORAL:

1) Captopril 25 mg — 1 comprimido
   Tomar 1 comprimido sublingual (sob a língua) agora.
   Pode repetir após 30 minutos se PA persistir elevada.

INDICAÇÕES MÉDICAS:

1) Repouso em ambiente calmo por 20–30 minutos.
2) Consulta ambulatorial em 24–48h.
3) Manter medicação anti-hipertensiva habitual regularmente.
4) Retornar SE: cefaleia intensa, déficit neurológico, dor torácica, falta de ar.`
      },
      {
        label: "FC Elevada",
        text: `USO ORAL:

1) Atenolol 25 mg — 1 comprimido
   Tomar 1 comprimido, via oral, agora.

INDICAÇÕES MÉDICAS:

1) Repouso em ambiente calmo por 20–30 minutos.
2) Consulta ambulatorial em 24–48h.
3) Manter medicação anti-hipertensiva habitual regularmente.
4) Retornar SE: cefaleia intensa, déficit neurológico, dor torácica, falta de ar.`
      }
    ]
  },
  {
    sector: "Sala Verde",
    disease: "Crise Asmática — Leve a Moderada",
    variants: [
      {
        label: "Prescrição",
        text: `USO INALATÓRIO:

1) Salbutamol (Aerolin) spray — 4 a 8 jatos com espaçador
   Aplicar agora. Repetir a cada 20 minutos por até 3 doses.

USO ORAL:

2) Prednisolona 20 mg — 3 comprimidos (60 mg dose única)
   Tomar 3 comprimidos, via oral, agora (dose única matinal).
   Continuar 1 comprimido ao dia por mais 4 dias.

INDICAÇÕES MÉDICAS:

1) Usar o spray de alívio (Salbutamol) somente quando sentir falta de ar.
2) Retorno em 24–48h ou antes se piora.
3) Retornar IMEDIATAMENTE se: não conseguir falar frases completas,
   lábios azulados, falta de ar em repouso.`
      }
    ]
  },
  {
    sector: "UTI",
    disease: "Sepse / Choque Séptico",
    variants: [
      {
        label: "Prescrição",
        text: `PRESCRIÇÃO MÉDICA — SEPSE / CHOQUE SÉPTICO

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
      }
    ]
  },
  {
    sector: "UTI",
    disease: "Síndrome de Angústia Respiratória Aguda (SARA)",
    variants: [
      {
        label: "Prescrição",
        text: `PRESCRIÇÃO MÉDICA — SARA

1. VENTILAÇÃO PROTETORA
   - Volume corrente: 4–6 mL/kg (peso predito)
   - PEEP: ajustar conforme tabela ARDSNet
   - Pressão de plateau ≤ 30 cmH₂O
   - FiO₂: titular SpO₂ 88–95%

2. POSIÇÃO PRONA
   - Indicação: PaO₂/FiO₂ < 150 — Duração: 16h/dia

3. SEDAÇÃO E ANALGESIA
   - Fentanil 25–100 mcg/h EV contínuo
   - Midazolam 0,02–0,1 mg/kg/h — RASS alvo: -2 a -3

4. BLOQUEIO NEUROMUSCULAR (primeiras 48h se grave)
   - Cisatracúrio 37,5 mg/h EV contínuo`
      }
    ]
  },
  {
    sector: "UTI",
    disease: "Parada Cardiorrespiratória — Pós-Ressuscitação",
    variants: [
      {
        label: "Prescrição",
        text: `PRESCRIÇÃO MÉDICA — PÓS-PCR

1. CONTROLE TEMPERATURA
   - Hipotermia terapêutica: 32–36°C por 24h

2. HEMODINÂMICA
   - PAM alvo ≥ 65–80 mmHg

3. NEUROPROTEÇÃO
   - Cabeceira 30° / Glicemia 140–180 mg/dL
   - Evitar hiperoxia: SpO₂ 94–98%

4. CONVULSÕES
   - Levetiracetam 1g EV de 12/12h

5. INVESTIGAR CAUSA
   - ECG, troponina, CATE precoce se IAMCSST`
      }
    ]
  },
  {
    sector: "Sala Vermelha",
    disease: "Infarto Agudo do Miocárdio com Supra de ST (IAMCSST)",
    variants: [
      {
        label: "Prescrição",
        text: `PRESCRIÇÃO MÉDICA — IAMCSST

⚡ OBJETIVO: CATE em < 90 min da chegada

1. ANTIAGREGAÇÃO DUPLA
   - AAS 300 mg VO → 100 mg/dia
   - Ticagrelor 180 mg VO → 90 mg 2x/dia

2. ANTICOAGULAÇÃO
   - Heparina não fracionada 70 UI/kg EV (max 5.000 UI)

3. ANALGESIA
   - Morfina 2–4 mg EV (titular dor)

4. SUPORTE
   - O₂ se SpO₂ < 90%
   - Monitorização contínua ECG
   - Acesso venoso calibroso x2

5. BETABLOQUEADOR
   - Metoprolol 25–50 mg VO nas primeiras 24h`
      }
    ]
  },
  {
    sector: "Sala Vermelha",
    disease: "Acidente Vascular Cerebral Isquêmico (AVCi)",
    variants: [
      {
        label: "Com Trombólise",
        text: `PRESCRIÇÃO MÉDICA — AVCI COM TROMBÓLISE

⚡ OBJETIVO: Alteplase em < 60 min da chegada

1. AVALIAÇÃO RÁPIDA
   - TC de crânio sem contraste URGENTE
   - Glicemia capilar, coagulograma, ECG, NIHSS

2. TROMBÓLISE EV (< 4,5h do início)
   - Alteplase 0,9 mg/kg EV (max 90 mg)
   - 10% em bolus → 90% em 60 min

3. CONTROLE PRESSÓRICO
   - Manter PA < 180/105 mmHg

4. ANTITROMBÓTICO (iniciar 24h após)
   - AAS 300 mg VO → 100 mg/dia
   - Atorvastatina 40–80 mg`
      },
      {
        label: "Sem Trombólise",
        text: `PRESCRIÇÃO MÉDICA — AVCI SEM TROMBÓLISE

1. AVALIAÇÃO
   - TC de crânio sem contraste URGENTE
   - Glicemia capilar, coagulograma, ECG, NIHSS

2. CONTROLE PRESSÓRICO
   - Tratar apenas se PA > 220/120 mmHg

3. ANTITROMBÓTICO (iniciar imediatamente)
   - AAS 300 mg VO → 100 mg/dia
   - Atorvastatina 40–80 mg

4. GLICEMIA
   - Alvo: 140–180 mg/dL`
      }
    ]
  },
  {
    sector: "Sala Vermelha",
    disease: "Anafilaxia",
    variants: [
      {
        label: "Prescrição",
        text: `PRESCRIÇÃO MÉDICA — ANAFILAXIA

⚡ ADRENALINA IMEDIATA

1. ADRENALINA 1ª LINHA
   - 1:1000 → 0,3–0,5 mg IM (coxa)
   - Repetir a cada 5–15 min se necessário

2. SUPORTE
   - O₂ 8–15 L/min
   - SF 0,9% 500–1000 mL EV rápido

3. 2ª LINHA
   - Prometazina 25 mg EV
   - Hidrocortisona 200 mg EV

4. BRONCOESPASMO
   - Salbutamol NBZ 5 mg

5. MONITORIZAÇÃO 4–8h após resolução`
      }
    ]
  },
  {
    sector: "ECG",
    disease: "Infarto Agudo do Miocárdio com Supra de ST (IAMCSST)",
    variants: [
      {
        label: "Padrão de Lesão",
        text: `PADRÃO ELETROCARDIOGRÁFICO — IAMCSST

ACHADOS:
- Supradesnivelamento do segmento ST ≥ 1 mm em 2 derivações
  contíguas (≥ 2 mm em V2-V3 para homens ≥ 40 anos / ≥ 1,5 mm
  para mulheres)
- Onda T hiperaguda na fase inicial
- Imagem em espelho (infradesnivelamento) na parede recíproca
- Possível surgimento de onda Q patológica na evolução

LOCALIZAÇÃO PELAS DERIVAÇÕES:
- Anterior: V1-V4
- Lateral: I, aVL, V5-V6
- Inferior: II, III, aVF
- Posterior: V7-V9 (imagem em espelho em V1-V3)

⚡ CONDUTA: ver protocolo de Sala Vermelha — IAMCSST
(CATE em < 90 min da chegada)`,
        images: []
      }
    ]
  },
  {
    sector: "ECG",
    disease: "Fibrilação Atrial",
    variants: [
      {
        label: "Padrão Típico",
        text: `PADRÃO ELETROCARDIOGRÁFICO — FIBRILAÇÃO ATRIAL

ACHADOS:
- Ausência de ondas P organizadas
- Atividade atrial caótica (ondas "f" de fibrilação)
- Intervalos R-R irregularmente irregulares
- Frequência ventricular variável (geralmente 100–180 bpm
  se não controlada)
- Complexo QRS geralmente estreito (a menos que haja bloqueio
  de ramo associado)

OBSERVAÇÕES:
- Avaliar tempo de início para decisão sobre cardioversão
- Calcular CHA₂DS₂-VASc para risco de AVC
- Avaliar necessidade de anticoagulação`,
        images: []
      }
    ]
  },
  {
    sector: "ECG",
    disease: "Bloqueios Atrioventriculares (BAV)",
    variants: [
      {
        label: "BAV de 1º Grau",
        text: `PADRÃO ELETROCARDIOGRÁFICO — BAV 1º GRAU

ACHADOS:
- Intervalo PR prolongado > 200 ms (> 1 quadrado grande)
- Todas as ondas P são seguidas de QRS (1:1)
- Geralmente assintomático, sem necessidade de tratamento
  específico na ausência de outros achados`,
        images: []
      },
      {
        label: "BAV de 2º Grau — Mobitz I",
        text: `PADRÃO ELETROCARDIOGRÁFICO — BAV 2º GRAU MOBITZ I

ACHADOS:
- Prolongamento progressivo do intervalo PR até a ocorrência
  de uma onda P bloqueada (fenômeno de Wenckebach)
- Geralmente benigno, nível de bloqueio no nó AV
- Acompanhamento clínico; raramente necessita marcapasso`,
        images: []
      },
      {
        label: "BAV de 2º Grau — Mobitz II",
        text: `PADRÃO ELETROCARDIOGRÁFICO — BAV 2º GRAU MOBITZ II

ACHADOS:
- Ondas P bloqueadas de forma súbita, sem prolongamento
  progressivo do PR
- Risco de progressão para BAVT — geralmente indicação de
  marcapasso definitivo`,
        images: []
      },
      {
        label: "BAV Total (3º Grau)",
        text: `PADRÃO ELETROCARDIOGRÁFICO — BAV TOTAL (3º GRAU)

ACHADOS:
- Dissociação completa entre ondas P e complexos QRS
- Frequência atrial maior que a frequência ventricular,
  sem relação entre elas
- Ritmo de escape (juncional ou ventricular)
- Geralmente indicação de marcapasso definitivo`,
        images: []
      }
    ]
  }
];

// ============================================================
//  CAMADA OFFLINE — localStorage como fallback do Firestore
// ============================================================

const LOCAL_CACHE_KEY = "rxmed_prescricoes_cache";

function localCacheSave(docs) {
  try { localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(docs)); } catch(e) {}
}

function localCacheGet() {
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

function isOffline() { return !navigator.onLine; }

async function dbInit() {
  try {
    const snap = await db.collection(COL).limit(1).get();
    if (snap.empty) {
      for (const item of SEED_DATA) {
        await db.collection(COL).add(item);
      }
    }
    // Salva cache local após inicializar com sucesso
    const all = await dbGetAll();
    localCacheSave(all);
  } catch(e) {
    console.error("Erro no dbInit:", e);
    // Não mostra alert — pode estar offline com cache disponível
  }
}

async function dbGetAll() {
  if (isOffline()) {
    const cached = localCacheGet();
    if (cached) return cached;
  }
  try {
    const snap = await db.collection(COL).get();
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    localCacheSave(docs);
    return docs;
  } catch(e) {
    const cached = localCacheGet();
    if (cached) return cached;
    throw e;
  }
}

async function dbGetBySector(sector) {
  if (isOffline()) {
    const cached = localCacheGet();
    if (cached) return cached.filter(d => d.sector === sector);
  }
  try {
    const snap = await db.collection(COL).where("sector", "==", sector).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch(e) {
    const cached = localCacheGet();
    if (cached) return cached.filter(d => d.sector === sector);
    throw e;
  }
}

async function dbGetById(id) {
  if (isOffline()) {
    const cached = localCacheGet();
    if (cached) return cached.find(d => d.id === id) || null;
  }
  try {
    const docSnap = await db.collection(COL).doc(id).get();
    return docSnap.exists ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch(e) {
    const cached = localCacheGet();
    if (cached) return cached.find(d => d.id === id) || null;
    throw e;
  }
}

async function dbAdd(entry) {
  await db.collection(COL).add(entry);
}

async function dbUpdate(id, updated) {
  await db.collection(COL).doc(id).update(updated);
}

async function dbDelete(id) {
  await db.collection(COL).doc(id).delete();
}

window.dbInit        = dbInit;
window.dbGetAll      = dbGetAll;
window.dbGetBySector = dbGetBySector;
window.dbGetById     = dbGetById;
window.dbAdd         = dbAdd;
window.dbUpdate      = dbUpdate;
window.dbDelete      = dbDelete;
