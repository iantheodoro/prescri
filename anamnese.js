// ============================================================
//  anamnese.js — Modelos de anamnese prontos para copiar e colar
//  Todos os modelos são editáveis e excluíveis. Ficam no localStorage
//  (uso offline) e são sincronizados com o Firebase (documento
//  "SYS_anamneses" na coleção de prescrições), mesclando por modelo.
//  Os modelos padrão são semeados uma única vez; o que você excluir
//  não volta, a menos que use "Restaurar padrões".
// ============================================================

const ANAM_CUSTOM_KEY = "prescricoes_anamnese_custom";

const ANAM_DEFAULTS = [
  {
    id: "geral",
    title: "Anamnese geral (Pronto Socorro)",
    category: "Geral",
    text: `IDENTIFICAÇÃO: ______ anos, sexo ______, natural/procedente de ______.
ACOMPANHANTE: ______

QUEIXA PRINCIPAL:
______

HDA:
Paciente refere ______ há ______ (início súbito / insidioso), com evolução ______ (piora / melhora / estável).
Fatores de melhora: ______. Fatores de piora: ______.
Sintomas associados: ______.
Nega: ______.
Procurou atendimento/uso de medicações prévias: ______.

ANTECEDENTES PESSOAIS:
- Comorbidades: ______
- Cirurgias prévias: ______
- Internações prévias: ______
- Alergias: ______
- Medicações de uso contínuo: ______

HÁBITOS: tabagismo ______ | etilismo ______ | drogas ______
ANTECEDENTES FAMILIARES: ______
ÚLTIMA REFEIÇÃO / ÚLTIMA MENSTRUAÇÃO (se aplicável): ______`
  },
  {
    id: "dor-toracica",
    title: "Dor torácica",
    category: "Cardiologia",
    text: `QUEIXA PRINCIPAL: Dor torácica há ______.

HDA:
Início: ______ (súbito / gradual) | Duração: ______ | Em repouso / esforço: ______
Localização: ______ | Irradiação: ______ (braço E / mandíbula / dorso / epigástrio)
Caráter: ______ (opressiva / pontada / queimação / ventilatório-dependente / pleurítica)
Intensidade (0-10): ______
Fatores de piora: ______ (esforço / respiração / posição / palpação)
Fatores de melhora: ______ (repouso / nitrato / posição)
Sintomas associados: dispneia ( ) sudorese ( ) náuseas/vômitos ( ) síncope/pré-síncope ( ) palpitações ( ) tosse ( ) febre ( )
Episódios prévios semelhantes: ______

FATORES DE RISCO CARDIOVASCULAR:
HAS ( ) DM ( ) Dislipidemia ( ) Tabagismo ( ) Obesidade ( ) Sedentarismo ( )
Histórico familiar de DAC precoce: ______
Doença coronariana prévia / ICP / CRM: ______

INVESTIGAÇÃO DE DIAGNÓSTICOS DIFERENCIAIS:
- TEP: imobilização / cirurgia / viagem longa / TVP prévia / câncer / uso de ACO: ______
- Dissecção de aorta: dor lancinante / HAS não controlada / síndromes do tecido conjuntivo: ______
- Pericardite: infecção viral recente / dor alivia inclinando para frente: ______
- Pneumotórax / pneumonia / DRGE: ______

ANTECEDENTES: ______
MEDICAÇÕES EM USO (antiagregantes / anticoagulantes): ______
ALERGIAS: ______`
  },
  {
    id: "dispneia",
    title: "Dispneia / Insuficiência respiratória",
    category: "Respiratório",
    text: `QUEIXA PRINCIPAL: Falta de ar há ______.

HDA:
Início: ______ (súbito / progressivo) | Piora: ______ (aos esforços / repouso / decúbito)
Classe funcional (NYHA / mMRC): ______
Ortopneia ( ) DPN ( ) Edema de MMII ( ) Ganho de peso ( )
Tosse: ______ (seca / produtiva) | Expectoração: ______ (cor / volume) | Hemoptise ( )
Febre ( ) Dor torácica ( ) Sibilância ( ) Rouquidão/estridor ( )
Contato com doentes / sintomas gripais: ______
Exposição a alérgenos / irritantes / aspiração: ______
Fatores para TEP: imobilização / cirurgia / viagem / TVP prévia / ACO / neoplasia: ______

ANTECEDENTES:
- Asma / DPOC / ICC / DRC / Cardiopatia: ______
- Internações e IOT prévias por quadro respiratório: ______
- Uso de O2 domiciliar / CPAP / BiPAP: ______
- Vacinação (influenza / pneumococo / COVID-19): ______

MEDICAÇÕES EM USO (broncodilatadores, corticoide, diuréticos): ______
HÁBITOS: tabagismo (maços/ano) ______
ALERGIAS: ______`
  },
  {
    id: "dor-abdominal",
    title: "Dor abdominal",
    category: "Gastro",
    text: `QUEIXA PRINCIPAL: Dor abdominal há ______.

HDA:
Início: ______ (súbito / insidioso) | Localização inicial: ______ | Localização atual: ______
Migração / irradiação: ______
Caráter: ______ (cólica / contínua / em queimação / facada)
Intensidade (0-10): ______
Fatores de piora: ______ | Fatores de melhora: ______
Relação com alimentação: ______
Náuseas ( ) Vômitos ( ) (aspecto: ______) Hematêmese ( )
Hábito intestinal: diarreia ( ) constipação ( ) última evacuação ______ | eliminação de flatos ( )
Melena ( ) Hematoquezia ( ) Esteatorreia ( )
Febre ( ) | Disúria / hematúria / polaciúria ( ) | Icterícia / colúria / acolia ( )
Perda de peso / inapetência: ______
Gineco (se aplicável): DUM ______ | corrimento / sangramento vaginal ( ) | possibilidade de gestação ( ) | dor pélvica ( )

ANTECEDENTES:
- Cirurgias abdominais prévias: ______
- Colelitíase / pancreatite / DRGE / úlcera / DII / diverticulose: ______
- Uso de AINEs / corticoide / anticoagulantes: ______
- Etilismo: ______
- Episódios semelhantes: ______

MEDICAÇÕES EM USO: ______
ALERGIAS: ______`
  },
  {
    id: "cefaleia",
    title: "Cefaleia",
    category: "Neurologia",
    text: `QUEIXA PRINCIPAL: Cefaleia há ______.

HDA:
Início: ______ (súbito "pior dor da vida" / gradual) | Duração do episódio: ______
Padrão: primeira vez ( ) / recorrente ( ) / mudança de padrão ( )
Localização: ______ (holocraniana / unilateral / frontal / occipital)
Caráter: ______ (pulsátil / pressão / pontada / em aperto)
Intensidade (0-10): ______
Fatores de piora: ______ (esforço / Valsalva / luz / ruído / decúbito)
Fatores de melhora: ______
Aura: ______ | Náuseas / vômitos ( ) | Fotofobia / fonofobia ( )

SINAIS DE ALARME (investigar):
Febre ( ) | Rigidez de nuca ( ) | Déficit neurológico focal ( ) | Alteração do nível de consciência ( )
Crise convulsiva ( ) | Papiledema / alteração visual ( ) | Trauma craniano recente ( )
Idade > 50 anos com primeira cefaleia ( ) | Imunossupressão / neoplasia / HIV ( )
Uso de anticoagulantes ( ) | Gestação / puerpério ( ) | Dor em mastigação / claudicação mandibular ( )

ANTECEDENTES: Enxaqueca / HAS / Neoplasia / Sinusopatia / Trauma: ______
MEDICAÇÕES EM USO (analgésicos, frequência de uso): ______
ALERGIAS: ______`
  },
  {
    id: "avc",
    title: "Déficit neurológico agudo (suspeita de AVC)",
    category: "Neurologia",
    text: `QUEIXA PRINCIPAL: ______ (déficit motor / fala / visual / outro) com início em ______.

HORÁRIO DE INÍCIO DOS SINTOMAS (último momento visto bem): ______ h do dia ______
Presenciado por: ______
Despertou com sintomas: ( ) sim ( ) não

HDA:
Déficit: hemiparesia ______ | alteração de fala/afasia/disartria ______ | desvio de rima ______
Alteração visual ______ | vertigem / ataxia ______ | alteração de consciência ______
Cefaleia ( ) | Crise convulsiva ( ) | Vômitos ( ) | Trauma recente ( )
Sintomas em regressão / flutuantes: ______
Episódios prévios semelhantes (AIT): ______

ANTECEDENTES / FATORES DE RISCO:
HAS ( ) DM ( ) Dislipidemia ( ) FA / arritmia ( ) Valvopatia ( ) Tabagismo ( ) Etilismo ( )
AVC / AIT prévios ( ) | Cirurgia ou sangramento recente ( ) | Neoplasia ( )
Uso de anticoagulantes (qual / última dose) ______ | Antiagregantes ______
Mimetizadores: hipoglicemia / crise epiléptica / enxaqueca com aura / intoxicação: ______

ESCALA DE RANKIN PRÉVIA: ______
GLICEMIA CAPILAR: ______
ALERGIAS: ______`
  },
  {
    id: "sincope",
    title: "Síncope / Pré-síncope",
    category: "Cardiologia",
    text: `QUEIXA PRINCIPAL: Perda transitória da consciência em ______.

HDA:
Circunstâncias: ______ (em pé / sentado / deitado / esforço / micção / tosse / após mudança postural)
Pródromos: tontura ( ) sudorese ( ) palidez ( ) náuseas ( ) visão turva ( ) palpitações ( ) dor torácica ( ) dispneia ( )
Duração da perda de consciência: ______ | Recuperação: ______ (rápida e completa / confusão pós-ictal)
Movimentos tônico-clônicos ( ) | Liberação esfincteriana ( ) | Mordedura de língua ( )
Trauma associado: ______
Testemunhas: ______
Episódios prévios: ______

FATORES DE RISCO / ALARME:
Cardiopatia estrutural / ICC / IAM prévio ( ) | Histórico familiar de morte súbita < 50 anos ( )
Síncope aos esforços ou em decúbito ( ) | Palpitações precedendo ( )
Uso de anti-hipertensivos / diuréticos / antiarrítmicos / hipoglicemiantes ( )
Desidratação / sangramento / jejum prolongado ( ) | Melena ( )
Gestação ( ) (DUM: ______)

ANTECEDENTES: ______
MEDICAÇÕES EM USO: ______
ALERGIAS: ______`
  },
  {
    id: "febre",
    title: "Febre / Síndrome infecciosa",
    category: "Infectologia",
    text: `QUEIXA PRINCIPAL: Febre há ______ dias.

HDA:
Febre: aferida ( ) ______ °C | Padrão: contínua / intermitente | Calafrios ( ) | Sudorese ( )
Sintomas por sistema:
- Respiratório: tosse ( ) coriza ( ) odinofagia ( ) dispneia ( ) dor torácica ( )
- Urinário: disúria ( ) polaciúria ( ) dor lombar ( ) hematúria ( )
- Gastrointestinal: diarreia ( ) vômitos ( ) dor abdominal ( ) icterícia ( )
- Neurológico: cefaleia ( ) rigidez de nuca ( ) alteração de consciência ( )
- Pele / partes moles: lesões ( ) celulite ( ) rash ( ) petéquias ( )
- Osteoarticular: mialgia ( ) artralgia ( ) dor retro-orbitária ( )
Uso de antibióticos recentes: ______ | Antitérmicos: ______

EPIDEMIOLOGIA:
Contato com doentes ( ) | Viagem recente ( ) ______ | Picada de inseto ( ) | Contato com animais / água de enchente ( )
Casos semelhantes na família / trabalho ( ) | Relações sexuais desprotegidas ( )
Procedimento invasivo / internação / dispositivos recentes ( )

ANTECEDENTES:
Imunossupressão / HIV / neoplasia / esplenectomia / DM / DRC ( ) | Corticoide / quimioterapia em uso ( )
Vacinação: ______
ALERGIAS: ______`
  },
  {
    id: "trauma",
    title: "Trauma (cinemática e AMPLA)",
    category: "Trauma",
    text: `IDENTIFICAÇÃO: ______ anos, sexo ______.
TRAZIDO POR: ( ) SAMU ( ) bombeiros ( ) familiares ( ) outros ______

MECANISMO DO TRAUMA:
Data/hora: ______ | Local: ______
Tipo: ______ (acidente automobilístico / moto / atropelamento / queda de ______ m / agressão / FAB / FAF / outro)
Cinemática: velocidade ______ | uso de cinto / capacete ( ) | ejeção ( ) | capotamento ( ) | óbito no local ( ) | tempo de extricação ______
Atendimento pré-hospitalar: ______ (imobilização, via aérea, reposição volêmica, medicações)
Perda de consciência ( ) | Amnésia ( ) | Vômitos ( )

QUEIXAS ATUAIS: ______

AMPLA:
A - Alergias: ______
M - Medicações em uso (anticoagulantes?): ______
P - Passado médico / cirúrgico: ______
L - Líquidos e alimentos (última ingesta): ______
A - Ambiente / evento relacionado ao trauma: ______

VACINAÇÃO ANTITETÂNICA: ______
ÁLCOOL / DROGAS: ______`
  },
  {
    id: "intoxicacao",
    title: "Intoxicação exógena",
    category: "Toxicologia",
    text: `IDENTIFICAÇÃO: ______ anos, ______ kg, sexo ______.

CIRCUNSTÂNCIA:
( ) Acidental ( ) Tentativa de autoextermínio ( ) Abuso de substância ( ) Ocupacional ( ) Iatrogênica ( ) Indeterminada
Agente(s): ______ (nome / princípio ativo / concentração)
Quantidade estimada: ______ | Via: ______ (oral / inalatória / cutânea / parenteral)
Horário da exposição: ______ | Tempo decorrido: ______
Local: ______ | Presenciado por: ______ | Embalagens / restos trazidos: ( ) sim ( ) não
Ingestão de múltiplas substâncias / álcool associado: ______

SINTOMAS APÓS EXPOSIÇÃO:
Alteração de consciência ( ) | Vômitos ( ) | Convulsão ( ) | Alteração visual ( ) | Dor torácica ( ) | Palpitações ( ) | Dispneia ( ) | Sialorreia / lacrimejamento ( )
Medidas pré-hospitalares: ______ (indução de vômitos / carvão ativado / lavagem)

ANTECEDENTES:
Transtornos psiquiátricos / tentativas prévias ( ) | Uso crônico de medicações ( ) ______
Comorbidades hepáticas / renais / cardíacas ( )
ALERGIAS: ______

Conduta: contato com o CIATox (0800 722 6001) quando indicado.`
  },
  {
    id: "lombalgia",
    title: "Lombalgia / Dor musculoesquelética",
    category: "Ortopedia",
    text: `QUEIXA PRINCIPAL: Dor em ______ há ______.

HDA:
Início: ______ (trauma / esforço / espontâneo) | Evolução: ______
Localização: ______ | Irradiação: ______ (MMII, trajeto) 
Caráter: ______ | Intensidade (0-10): ______
Fatores de piora: ______ (movimento / repouso / tosse) | Fatores de melhora: ______
Rigidez matinal: ______ | Dor noturna / em repouso: ______

SINAIS DE ALARME:
Déficit motor / parestesia progressiva ( ) | Retenção ou incontinência urinária/fecal ( ) | Anestesia em sela ( )
Febre ( ) | Perda de peso ( ) | Histórico de neoplasia ( ) | Trauma significativo ( )
Uso de corticoide / osteoporose ( ) | Uso de drogas injetáveis / imunossupressão ( )
Idade > 50 anos com primeiro episódio ( )

ANTECEDENTES: ______
MEDICAÇÕES / ANALGÉSICOS JÁ UTILIZADOS: ______
ATIVIDADE LABORAL / ESFORÇO: ______
ALERGIAS: ______`
  },
  {
    id: "pediatria",
    title: "Pediatria — Febre / IVAS",
    category: "Pediatria",
    text: `IDENTIFICAÇÃO: ______ (idade: ______ meses/anos), ______ kg, sexo ______.
INFORMANTE: ______ (mãe / pai / outro)

QUEIXA PRINCIPAL: ______ há ______ dias.

HDA:
Febre: ______ °C, há ______ dias | Antitérmicos (dose / horário): ______
Coriza ( ) Tosse ( ) Dispneia / tiragem ( ) Sibilância ( ) Odinofagia ( ) Otalgia ( )
Vômitos ( ) Diarreia ( ) Dor abdominal ( ) Recusa alimentar ( ) Diurese: ______ (fraldas/dia)
Prostração ( ) Irritabilidade ( ) Convulsão febril ( ) Rash ( )
Contato com doentes / creche / escola: ______

ANTECEDENTES:
- Gestação / parto: ______ (idade gestacional, tipo de parto, intercorrências)
- Prematuridade / internações prévias: ______
- Desenvolvimento neuropsicomotor: ______
- Alimentação: ______ (aleitamento materno / fórmula / introdução alimentar)
- Vacinação: ______ (calendário em dia? ( ) sim ( ) não)
- Comorbidades (asma / cardiopatia / outras): ______
- Medicações em uso: ______
- Alergias: ______
ANTECEDENTES FAMILIARES / MORADIA / TABAGISMO NO DOMICÍLIO: ______`
  },
  {
    id: "ginecologia",
    title: "Gineco-obstétrica — Dor pélvica / Sangramento",
    category: "Ginecologia",
    text: `IDENTIFICAÇÃO: ______ anos, G___ P___ (N___ C___) A___.

QUEIXA PRINCIPAL: ______ há ______.

HDA:
DUM: ______ | Ciclos: ______ (regulares / irregulares) | Possibilidade de gestação ( ) | Teste de gravidez: ______
Gestante: IG ______ semanas | Pré-natal: ______ | Movimentação fetal: ______
Dor: localização ______ | caráter ______ | intensidade (0-10) ______ | início ______
Sangramento vaginal: ______ (volume / coágulos / nº de absorventes/hora)
Perda de líquido ( ) | Corrimento / odor ( ) | Febre ( ) | Disúria ( )
Náuseas / vômitos ( ) | Síncope / tontura ( ) | Dor em ombro ( )
Relação sexual recente / método contraceptivo: ______
Histórico de ISTs / DIP / gravidez ectópica prévia / cirurgias pélvicas: ______

ANTECEDENTES:
Comorbidades: ______ | Cirurgias: ______
Medicações em uso: ______ | Alergias: ______
Tipagem sanguínea / fator Rh (se conhecido): ______`
  }
];

// ── Persistência ─────────────────────────────────────────
const ANAM_SEEDED_KEY = "prescricoes_anamnese_seeded";
const ANAM_NO_TAG = "Sem etiqueta";

function anamCustomGet() {
  try {
    const raw = localStorage.getItem(ANAM_CUSTOM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}
function anamCustomSave(list) {
  try { localStorage.setItem(ANAM_CUSTOM_KEY, JSON.stringify(list)); } catch (e) {}
}
function anamSeededGet() {
  try { return JSON.parse(localStorage.getItem(ANAM_SEEDED_KEY)) || []; } catch (e) { return []; }
}

// Semeia os modelos padrão que ainda não foram semeados neste dispositivo.
function anamSeed() {
  const list = anamCustomGet();
  const seeded = anamSeededGet();
  const have = new Set(list.map(x => x.id));
  let changed = false;
  ANAM_DEFAULTS.forEach(d => {
    if (seeded.includes(d.id)) return;
    if (!have.has(d.id)) list.push({ id: d.id, title: d.title, category: d.category, text: d.text, updatedAt: 0 });
    seeded.push(d.id);
    changed = true;
  });
  if (changed) {
    anamCustomSave(list);
    try { localStorage.setItem(ANAM_SEEDED_KEY, JSON.stringify(seeded)); } catch (e) {}
  }
}

// ── Sincronização com o Firebase ─────────────────────────
// Local-first: tudo funciona offline; ao conectar, mescla com a nuvem.
// Cada modelo tem "updatedAt"; exclusões viram "tombstones" (id → hora),
// e vence sempre a versão mais recente de cada modelo.
const ANAM_TOMB_KEY = "prescricoes_anamnese_deleted";
const ANAM_CLOUD_DOC = "SYS_anamneses";
const ANAM_TOMB_TTL = 90 * 24 * 60 * 60 * 1000; // 90 dias

let anamSyncing = false;
let anamSyncAgain = false;
let anamSyncTimer = null;
let anamDirty = false;

function anamTombGet() {
  try { return JSON.parse(localStorage.getItem(ANAM_TOMB_KEY)) || {}; } catch (e) { return {}; }
}
function anamTombSave(t) {
  try { localStorage.setItem(ANAM_TOMB_KEY, JSON.stringify(t)); } catch (e) {}
}

function anamCleanItem(i) {
  return {
    id: String((i && i.id) || ""),
    title: String((i && i.title) || ""),
    category: String((i && i.category) || ""),
    text: String((i && i.text) || ""),
    updatedAt: +(i && i.updatedAt) || 0
  };
}

function anamLocalState() {
  return { items: anamCustomGet(), deleted: anamTombGet(), seeded: anamSeededGet() };
}
function anamApplyState(st) {
  anamCustomSave(st.items);
  anamTombSave(st.deleted);
  try { localStorage.setItem(ANAM_SEEDED_KEY, JSON.stringify(st.seeded)); } catch (e) {}
}

// Mescla dois estados (a = local, b = nuvem)
function anamMerge(a, b) {
  a = a || {}; b = b || {};
  const now = Date.now();

  const tomb = {};
  [b.deleted, a.deleted].forEach(src => Object.entries(src || {}).forEach(([id, ts]) => {
    ts = +ts || 0;
    if (now - ts > ANAM_TOMB_TTL) return;
    if (!(tomb[id] >= ts)) tomb[id] = ts;
  }));

  const byId = new Map();
  const order = [];
  (b.items || []).forEach(raw => {
    const it = anamCleanItem(raw);
    if (!it.id || byId.has(it.id)) return;
    byId.set(it.id, it);
    order.push(it.id);
  });
  const localOnly = [];
  (a.items || []).forEach(raw => {
    const it = anamCleanItem(raw);
    if (!it.id) return;
    const cur = byId.get(it.id);
    if (!cur) { byId.set(it.id, it); localOnly.push(it.id); }
    else if (it.updatedAt > cur.updatedAt) byId.set(it.id, it);
  });

  const items = [];
  [...localOnly, ...order].forEach(id => {
    const it = byId.get(id);
    const t = tomb[id];
    if (t !== undefined && t >= it.updatedAt) return; // excluído depois da última edição
    items.push(it);
  });
  Object.keys(tomb).forEach(id => {
    const it = byId.get(id);
    if (it && it.updatedAt > tomb[id]) delete tomb[id]; // restaurado depois de excluído
  });

  const seeded = [...new Set([...(a.seeded || []), ...(b.seeded || [])])];
  return { items, deleted: tomb, seeded };
}

function anamSig(st) {
  return JSON.stringify([
    (st.items || []).map(i => { const c = anamCleanItem(i); return [c.id, c.title, c.category, c.text, c.updatedAt]; }),
    Object.entries(st.deleted || {}).map(([k, v]) => [k, +v || 0]).sort((x, y) => (x[0] < y[0] ? -1 : 1)),
    [...(st.seeded || [])].sort()
  ]);
}

function anamCloudAvailable() {
  return typeof firebase !== "undefined" && typeof db !== "undefined" && typeof COL !== "undefined";
}

function anamSetStatus(kind, msg) {
  const el = document.getElementById("anam-sync-status");
  if (!el) return;
  el.className = "anam-sync " + kind;
  el.textContent = msg;
}

// Salva localmente e agenda a sincronização
function anamCommit(list) {
  anamCustomSave(list);
  anamSyncSoon();
}
function anamSyncSoon() {
  clearTimeout(anamSyncTimer);
  anamSyncTimer = setTimeout(anamSyncNow, 500);
}

// Evita apagar o que o usuário está digitando por causa de uma sincronização em segundo plano
function anamRefreshIfIdle() {
  const screen = document.getElementById("screen-anamnese");
  if (!screen || !screen.classList.contains("active")) return;
  const ae = document.activeElement;
  const typing = ae && ["INPUT", "TEXTAREA"].includes(ae.tagName) && screen.contains(ae);
  if (typing || anamDirty) return;
  renderAnamnese();
}

async function anamSyncNow() {
  if (!anamCloudAvailable()) { anamSetStatus("off", "Nuvem indisponível — salvo só neste dispositivo"); return; }
  if (!navigator.onLine) { anamSetStatus("off", "Offline — sincroniza ao reconectar"); return; }
  if (anamSyncing) { anamSyncAgain = true; return; }

  anamSyncing = true;
  anamSetStatus("busy", "Sincronizando…");
  try {
    const ref = db.collection(COL).doc(ANAM_CLOUD_DOC);
    const merged = await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      const cloud = snap.exists ? snap.data() : {};
      const m = anamMerge(anamLocalState(), cloud);
      if (!snap.exists || anamSig(m) !== anamSig(cloud)) {
        tx.set(ref, { items: m.items, deleted: m.deleted, seeded: m.seeded, updatedAt: Date.now() });
      }
      return m;
    });
    // Reaplica o que foi alterado localmente enquanto a sincronização rodava
    anamApplyState(anamMerge(anamLocalState(), merged));
    anamSetStatus("ok", "☁ Sincronizado");
    anamRefreshIfIdle();
  } catch (e) {
    console.error("Erro ao sincronizar anamneses:", e);
    anamSetStatus("err", "Falha ao sincronizar — toque em ↻ para tentar de novo");
  } finally {
    anamSyncing = false;
    if (anamSyncAgain) { anamSyncAgain = false; anamSyncSoon(); }
  }
}

function anamEscape(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function anamNormTag(v) {
  return (v || "").trim() || ANAM_NO_TAG;
}

// ── Estado ───────────────────────────────────────────────
let anamOpenId = null;
let anamFilterTag = "";

function openAnamnese() {
  anamSeed();
  showScreen("screen-anamnese");
  const s = document.getElementById("anam-search");
  if (s) s.value = "";
  anamFilterTag = "";
  anamOpenId = null;
  renderAnamnese();
  anamSyncNow();
}

// ── Renderização ─────────────────────────────────────────
function anamTagList(all) {
  const counts = new Map();
  all.forEach(t => {
    const tag = anamNormTag(t.category);
    counts.set(tag, (counts.get(tag) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
}

function renderAnamnese() {
  const wrap = document.getElementById("anam-list");
  if (!wrap) return;
  anamDirty = false;

  const all = anamCustomGet();
  const tags = anamTagList(all);
  if (anamFilterTag && !tags.some(([t]) => t === anamFilterTag)) anamFilterTag = "";

  // Chips de etiqueta (filtro)
  const chips = document.getElementById("anam-tags");
  if (chips) {
    chips.innerHTML = all.length ? `
      <button type="button" class="anam-chip${anamFilterTag === "" ? " active" : ""}" data-tag="" onclick="anamSetTag(this.dataset.tag)">Todas (${all.length})</button>
      ${tags.map(([t, n]) => `
        <button type="button" class="anam-chip${anamFilterTag === t ? " active" : ""}" data-tag="${anamEscape(t)}" onclick="anamSetTag(this.dataset.tag)">${anamEscape(t)} (${n})</button>
      `).join("")}` : "";
  }

  const q = (document.getElementById("anam-search")?.value || "").trim().toLowerCase();
  const items = all.filter(t =>
    (!anamFilterTag || anamNormTag(t.category) === anamFilterTag) &&
    (!q || t.title.toLowerCase().includes(q) ||
      anamNormTag(t.category).toLowerCase().includes(q) ||
      (t.text || "").toLowerCase().includes(q))
  );

  const datalist = `<datalist id="anam-tags-list">${tags.map(([t]) => `<option value="${anamEscape(t)}"></option>`).join("")}</datalist>`;

  if (!all.length) {
    wrap.innerHTML = datalist + `<div class="empty-state">Nenhum modelo salvo.<br/>Use “+ Novo modelo” ou “Restaurar padrões”.</div>`;
    return;
  }
  if (!items.length) {
    wrap.innerHTML = datalist + `<div class="empty-state">Nenhum modelo encontrado.</div>`;
    return;
  }

  wrap.innerHTML = datalist + items.map(t => {
    const id = anamEscape(t.id);
    const open = anamOpenId === t.id;
    return `
      <div class="anam-card${open ? " open" : ""}" data-id="${id}">
        <button type="button" class="anam-head" onclick="anamToggle('${id}')">
          <span class="anam-title">${anamEscape(t.title)}</span>
          <span class="anam-tag">${anamEscape(anamNormTag(t.category))}</span>
          <span class="anam-chevron">▾</span>
        </button>
        ${open ? `
          <div class="anam-body">
            <div class="anam-edit-row">
              <label>Título
                <input type="text" id="anam-ti-${id}" value="${anamEscape(t.title)}" />
              </label>
              <label>Etiqueta
                <input type="text" id="anam-tg-${id}" list="anam-tags-list" value="${anamEscape(t.category === ANAM_NO_TAG ? "" : (t.category || ""))}" placeholder="Ex: Cardiologia" />
              </label>
            </div>
            <textarea class="anam-textarea" id="anam-ta-${id}" spellcheck="false"
              oninput="anamAutoSize(this)">${anamEscape(t.text)}</textarea>
            <div class="anam-actions">
              <button type="button" class="anam-btn anam-btn-primary" onclick="anamCopy('${id}', this)">📋 Copiar</button>
              <button type="button" class="anam-btn anam-btn-save" onclick="anamSaveEdit('${id}')">💾 Salvar alterações</button>
              <button type="button" class="anam-btn" onclick="anamDuplicate('${id}')">⧉ Duplicar</button>
              <button type="button" class="anam-btn anam-btn-danger" onclick="anamDelete('${id}')">🗑 Excluir</button>
            </div>
          </div>` : ""}
      </div>`;
  }).join("");

  const ta = wrap.querySelector(".anam-textarea");
  if (ta) anamAutoSize(ta);
}

function anamAutoSize(ta) {
  ta.style.height = "auto";
  ta.style.height = Math.min(ta.scrollHeight + 4, 640) + "px";
}

function anamToggle(id) {
  anamOpenId = anamOpenId === id ? null : id;
  renderAnamnese();
}

function anamSetTag(tag) {
  anamFilterTag = tag || "";
  anamOpenId = null;
  renderAnamnese();
}

// ── Ações ────────────────────────────────────────────────
async function anamCopy(id, btn) {
  const ta = document.getElementById("anam-ta-" + id);
  if (!ta) return;
  const text = ta.value;
  let ok = false;
  try {
    await navigator.clipboard.writeText(text);
    ok = true;
  } catch (e) {
    ta.select();
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
  }
  if (btn) {
    const old = btn.textContent;
    btn.textContent = ok ? "✓ Copiado!" : "Falha ao copiar";
    setTimeout(() => { btn.textContent = old; }, 2000);
  }
}

function anamSaveEdit(id) {
  const ta = document.getElementById("anam-ta-" + id);
  const ti = document.getElementById("anam-ti-" + id);
  const tg = document.getElementById("anam-tg-" + id);
  const list = anamCustomGet();
  const item = list.find(x => x.id === id);
  if (!item || !ta || !ti || !tg) return;
  const title = ti.value.trim();
  if (!title) {
    alert("O modelo precisa de um título.");
    ti.focus();
    return;
  }
  item.title = title;
  item.category = anamNormTag(tg.value);
  item.text = ta.value;
  item.updatedAt = Date.now();
  anamCommit(list);
  renderAnamnese();
  const btn = document.querySelector(`.anam-card[data-id="${id}"] .anam-btn-save`);
  if (btn) {
    const old = btn.textContent;
    btn.textContent = "✓ Salvo!";
    setTimeout(() => { btn.textContent = old; }, 1800);
  }
}

function anamDuplicate(id) {
  const list = anamCustomGet();
  const base = list.find(x => x.id === id);
  if (!base) return;
  const ta = document.getElementById("anam-ta-" + id);
  const newId = "c" + Date.now();
  const idx = list.findIndex(x => x.id === id);
  list.splice(idx + 1, 0, {
    id: newId,
    title: base.title + " (cópia)",
    category: base.category,
    text: ta ? ta.value : base.text,
    updatedAt: Date.now()
  });
  anamCommit(list);
  anamOpenId = newId;
  renderAnamnese();
}

function anamDelete(id) {
  const item = anamCustomGet().find(x => x.id === id);
  if (!item) return;
  if (!confirm(`Excluir o modelo "${item.title}"?`)) return;
  const tomb = anamTombGet();
  tomb[id] = Date.now();
  anamTombSave(tomb);
  anamCommit(anamCustomGet().filter(x => x.id !== id));
  anamOpenId = null;
  renderAnamnese();
}

function anamRestoreDefaults() {
  const list = anamCustomGet();
  const have = new Set(list.map(x => x.id));
  const missing = ANAM_DEFAULTS.filter(d => !have.has(d.id));
  if (!missing.length) {
    alert("Todos os modelos padrão já estão na sua lista.");
    return;
  }
  if (!confirm(`Restaurar ${missing.length} modelo(s) padrão que foram excluídos? Os que você já tem não serão alterados.`)) return;
  const now = Date.now();
  const tomb = anamTombGet();
  missing.forEach(d => {
    list.push({ id: d.id, title: d.title, category: d.category, text: d.text, updatedAt: now });
    delete tomb[d.id];
  });
  anamTombSave(tomb);
  anamCommit(list);
  try { localStorage.setItem(ANAM_SEEDED_KEY, JSON.stringify(ANAM_DEFAULTS.map(d => d.id))); } catch (e) {}
  renderAnamnese();
}

function anamToggleNewForm() {
  const f = document.getElementById("anam-new-form");
  if (!f) return;
  f.classList.toggle("open");
  if (f.classList.contains("open")) document.getElementById("anam-new-title").focus();
}

function anamCreateNew() {
  const title = document.getElementById("anam-new-title").value.trim();
  const tag = document.getElementById("anam-new-tag").value;
  const text = document.getElementById("anam-new-text").value;
  if (!title || !text.trim()) {
    alert("Preencha o título e o texto do modelo.");
    return;
  }
  const list = anamCustomGet();
  const id = "c" + Date.now();
  list.unshift({ id, title, category: anamNormTag(tag), text, updatedAt: Date.now() });
  anamCommit(list);
  document.getElementById("anam-new-title").value = "";
  document.getElementById("anam-new-tag").value = "";
  document.getElementById("anam-new-text").value = "";
  document.getElementById("anam-new-form").classList.remove("open");
  anamFilterTag = "";
  anamOpenId = id;
  renderAnamnese();
}

window.openAnamnese = openAnamnese;
window.renderAnamnese = renderAnamnese;
window.anamToggle = anamToggle;
window.anamSetTag = anamSetTag;
window.anamAutoSize = anamAutoSize;
window.anamCopy = anamCopy;
window.anamSaveEdit = anamSaveEdit;
window.anamDuplicate = anamDuplicate;
window.anamDelete = anamDelete;
window.anamRestoreDefaults = anamRestoreDefaults;
window.anamToggleNewForm = anamToggleNewForm;
window.anamCreateNew = anamCreateNew;
window.anamSyncNow = anamSyncNow;

// Marca edição em andamento e reage a mudanças de conexão/visibilidade
document.addEventListener("input", e => {
  if (e.target && e.target.closest && e.target.closest("#anam-list")) anamDirty = true;
});
window.addEventListener("online", () => {
  const screen = document.getElementById("screen-anamnese");
  if (screen && screen.classList.contains("active")) anamSyncNow();
});
window.addEventListener("offline", () => anamSetStatus("off", "Offline — sincroniza ao reconectar"));
document.addEventListener("visibilitychange", () => {
  const screen = document.getElementById("screen-anamnese");
  if (!document.hidden && screen && screen.classList.contains("active")) anamSyncNow();
});
