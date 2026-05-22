// ============================================================
//  db.js — Banco de dados local (localStorage)
//  Edite as prescrições pelo painel de administração do site
//  ou diretamente neste array SEED_DATA para defaults.
// ============================================================

const STORAGE_KEY = "prescricoes_med_db";

const SEED_DATA = [
  // ── UTI ─────────────────────────────────────────────────
  {
    id: "1",
    sector: "UTI",
    disease: "Sepse / Choque Séptico",
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
   - Débito urinário ≥ 0,5 mL/kg/h

6. METAS 6 HORAS (Surviving Sepsis)
   - PAM ≥ 65 mmHg
   - ScvO2 ≥ 70%
   - Clearance de lactato ≥ 10%`
  },
  {
    id: "2",
    sector: "UTI",
    disease: "Síndrome de Angústia Respiratória Aguda (SARA)",
    prescription: `PRESCRIÇÃO MÉDICA — SARA

1. VENTILAÇÃO PROTETORA
   - Volume corrente: 4–6 mL/kg (peso predito)
   - PEEP: ajustar conforme tabela ARDSNet
   - Pressão de plateau ≤ 30 cmH₂O
   - FR: 14–20 irpm
   - FiO₂: titular SpO₂ 88–95%

2. POSIÇÃO PRONA
   - Indicação: PaO₂/FiO₂ < 150
   - Duração: 16h/dia

3. SEDAÇÃO E ANALGESIA
   - Fentanil 25–100 mcg/h EV contínuo
   - Midazolam 0,02–0,1 mg/kg/h EV contínuo
   - RASS alvo: -2 a -3

4. BLOQUEIO NEUROMUSCULAR (primeiras 48h se grave)
   - Cisatracúrio 37,5 mg/h EV contínuo

5. CONTROLE HÍDRICO
   - Estratégia conservadora: balanço zero a negativo após estabilização

6. CORTICOIDE (controverso — decisão individual)
   - Metilprednisolona 1–2 mg/kg/dia (se < 14 dias)`
  },
  {
    id: "3",
    sector: "UTI",
    disease: "Parada Cardiorrespiratória (PCR) — Pós-Ressuscitação",
    prescription: `PRESCRIÇÃO MÉDICA — PÓS-PCR

1. CONTROLE TEMPERATURA
   - Hipotermia terapêutica: 32–36°C por 24h
   - Evitar febre nas primeiras 72h

2. HEMODINÂMICA
   - PAM alvo ≥ 65–80 mmHg
   - Noradrenalina se necessário (ver choque séptico)

3. NEUROPROTEÇÃO
   - Cabeceira 30°
   - Controle glicêmico: 140–180 mg/dL
   - Evitar hiperoxia: SpO₂ 94–98% / PaO₂ 75–100 mmHg

4. CONVULSÕES
   - Levetiracetam 1g EV de 12/12h (profilático se indicado)
   - Monitorização EEG contínuo se coma

5. INVESTIGAR CAUSA
   - ECG, troponina, CATE precoce se IAMCSST
   - TC de crânio se causa neurológica suspeita

6. PROGNÓSTICO
   - Reavaliação neurológica após 72h de normotermia`
  },

  // ── SALA VERMELHA ────────────────────────────────────────
  {
    id: "4",
    sector: "Sala Vermelha",
    disease: "Infarto Agudo do Miocárdio com Supra de ST (IAMCSST)",
    prescription: `PRESCRIÇÃO MÉDICA — IAMCSST

⚡ OBJETIVO: CATE em < 90 min da chegada

1. ANTIAGREGAÇÃO (DUPLA)
   - AAS 300 mg VO (dose de ataque) → 100 mg/dia
   - Ticagrelor 180 mg VO (ataque) → 90 mg 2x/dia
   - OU Clopidogrel 600 mg VO se CATE imediato planejado

2. ANTICOAGULAÇÃO
   - Heparina não fracionada 70 UI/kg EV (max 5.000 UI)
   
3. ANALGESIA / ANSIEDADE
   - Morfina 2–4 mg EV (titular dor)
   - Nitrato se PAS > 90 e sem uso de inibidores de PDE5

4. SUPORTE
   - O₂ se SpO₂ < 90%
   - Monitorização contínua ECG
   - Acesso venoso calibroso x2
   - Desfibrilador à beira-leito

5. BETABLOQUEADOR (se sem contraindicação)
   - Metoprolol 25–50 mg VO nas primeiras 24h

6. NÃO USAR: Nitratos se Killip IV / hipotensão / bradicardia`
  },
  {
    id: "5",
    sector: "Sala Vermelha",
    disease: "Acidente Vascular Cerebral Isquêmico (AVCi)",
    prescription: `PRESCRIÇÃO MÉDICA — AVCI AGUDO

⚡ OBJETIVO: Trombólise em < 60 min da chegada

1. AVALIAÇÃO RÁPIDA
   - TC de crânio sem contraste URGENTE
   - Glicemia capilar, coagulograma, ECG
   - NIH Stroke Scale (NIHSS)

2. TROMBÓLISE EV (se elegível, < 4,5h do início)
   - Alteplase 0,9 mg/kg EV (max 90 mg)
   - 10% em bolus → 90% em 60 min

3. CONTROLE PRESSÓRICO
   - Se trombólise: manter PA < 180/105 antes; < 180/105 por 24h após
   - Se SEM trombólise: tratar apenas se PA > 220/120

4. GLICEMIA
   - Alvo: 140–180 mg/dL
   - Tratar hipoglicemia imediatamente (< 60 mg/dL)

5. TEMPERATURA
   - Tratar febre com Dipirona 1g EV se Tax > 37,5°C

6. ANTITROMBÓTICO (iniciar 24h após trombólise)
   - AAS 300 mg VO → 100 mg/dia
   - Estatina de alta potência: Atorvastatina 40–80 mg

7. CONTRAINDICAÇÕES à Alteplase: verificar lista completa`
  },
  {
    id: "6",
    sector: "Sala Vermelha",
    disease: "Anafilaxia",
    prescription: `PRESCRIÇÃO MÉDICA — ANAFILAXIA

⚡ PRIORIDADE ABSOLUTA: ADRENALINA IMEDIATA

1. ADRENALINA (1ª LINHA — imediata)
   - Adrenalina 1:1000 → 0,3–0,5 mg IM (face ântero-lateral da coxa)
   - Repetir a cada 5–15 min se necessário

2. POSIÇÃO
   - Decúbito dorsal + MMII elevados (se hipotensão)
   - Semissentado (se dispneia/vômitos)

3. OXIGÊNIO
   - O₂ alto fluxo: 8–15 L/min (máscara não reinalante)

4. ACESSO VENOSO + VOLUME
   - SF 0,9%: 500–1000 mL EV em bolus rápido

5. ANTI-HISTAMÍNICO (2ª LINHA — após adrenalina)
   - Prometazina 25 mg EV OU
   - Difenidramina 25–50 mg EV

6. CORTICOIDE (previne reação bifásica)
   - Hidrocortisona 200 mg EV em bolus

7. BRONCOESPASMO PERSISTENTE
   - Salbutamol NBZ 5 mg

8. MONITORIZAÇÃO 4–8 HORAS após resolução (risco bifásico)`
  },

  // ── SALA VERDE ──────────────────────────────────────────
  {
    id: "7",
    sector: "Sala Verde",
    disease: "Pneumonia Adquirida na Comunidade (PAC) — Leve",
    prescription: `PRESCRIÇÃO MÉDICA — PAC LEVE (ambulatorial/enfermaria)

AVALIAÇÃO: CURB-65 = 0–1 → tratamento ambulatorial

1. ANTIBIOTICOTERAPIA (escolha 1 esquema)
   
   Esquema A (sem comorbidades):
   - Amoxicilina 500 mg VO de 8/8h por 5–7 dias
   
   Esquema B (com comorbidades ou suspeita de atípicos):
   - Amoxicilina-Clavulanato 875/125 mg VO de 12/12h
   + Azitromicina 500 mg VO 1x/dia por 5 dias
   
   Esquema C (alergia a penicilina):
   - Levofloxacino 750 mg VO 1x/dia por 5 dias

2. SINTOMÁTICOS
   - Dipirona 1g VO de 6/6h se febre/dor
   - Ibuprofeno 400 mg VO de 8/8h (se necessário)

3. SUPORTE
   - Hidratação oral adequada (≥ 1,5 L/dia)
   - Repouso relativo
   - Retorno em 48–72h ou antes se piora

4. CRITÉRIOS DE INTERNAÇÃO
   - CURB-65 ≥ 2 → avaliar internação
   - SpO₂ < 94% → internação / O₂ suplementar`
  },
  {
    id: "8",
    sector: "Sala Verde",
    disease: "Crise Hipertensiva — Urgência",
    prescription: `PRESCRIÇÃO MÉDICA — URGÊNCIA HIPERTENSIVA

(PA elevada SEM lesão aguda de órgão-alvo)

OBJETIVO: Reduzir PA ≤ 25% nas primeiras horas
          → Meta: < 160/100 em 24–48h

1. REPOUSO + AMBIENTE CALMO
   - Aguardar 20–30 min em repouso antes de 2ª medida

2. MEDICAÇÃO VO (preferencial)
   
   Opção 1 (1ª escolha):
   - Captopril 25 mg SL ou VO — pode repetir em 30 min
   
   Opção 2 (se FC elevada):
   - Atenolol 25–50 mg VO
   
   Opção 3 (se não disponível):
   - Clonidina 0,1–0,2 mg VO — pode repetir em 1h

3. INVESTIGAR CAUSA
   - Aderência ao tratamento habitual
   - Uso de AINES, descongestionantes, estimulantes
   - Dor, ansiedade, bexiga cheia

4. ALTA COM ORIENTAÇÕES
   - Manter medicação habitual regularmente
   - Consulta ambulatorial em 24–48h
   - Retornar SE: cefaleia intensa, déficit neurológico, dor torácica, dispneia`
  },
  {
    id: "9",
    sector: "Sala Verde",
    disease: "Crise Asmática — Leve a Moderada",
    prescription: `PRESCRIÇÃO MÉDICA — ASMA LEVE A MODERADA

AVALIAÇÃO: SpO₂ ≥ 92%, fala em frases, sem uso de mm acessórios

1. BRONCODILATADOR (imediato)
   - Salbutamol (Aerolin) 2,5 mg NBZ em SF 0,9% 3mL
   - Repetir a cada 20 min por 3 doses (1ª hora)
   - OU Salbutamol spray 4–8 jatos com espaçador

2. IPRATRÓPIO (associar nas primeiras doses)
   - Ipratrópio 0,25 mg NBZ junto com salbutamol

3. CORTICOIDE SISTÊMICO
   - Prednisolona 1–2 mg/kg VO (max 60 mg) — dose única matinal
   - OU Hidrocortisona 4 mg/kg EV (se não tolera VO)
   - Manter por 3–5 dias

4. OXIGÊNIO
   - Se SpO₂ < 92%: O₂ suplementar → alvo 93–95%

5. REAVALIAÇÃO APÓS 1 HORA
   - Boa resposta → alta + plano de ação
   - Resposta parcial → nova série de broncodilatadores
   - Sem resposta → transferir para Sala Vermelha

6. ALTA: Corticoide oral + broncodilatador de resgate
          Retorno em 24–48h / seguimento ambulatorial`
  }
];

// ── Funções de banco de dados ─────────────────────────────

function dbInit() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
  }
}

function dbGetAll() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function dbGetBySector(sector) {
  return dbGetAll().filter(p => p.sector === sector);
}

function dbAdd(entry) {
  const all = dbGetAll();
  entry.id = Date.now().toString();
  all.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function dbUpdate(id, updated) {
  const all = dbGetAll().map(p => p.id === id ? { ...p, ...updated } : p);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function dbDelete(id) {
  const all = dbGetAll().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function dbGetById(id) {
  return dbGetAll().find(p => p.id === id);
}

// Inicializar banco na carga
dbInit();
