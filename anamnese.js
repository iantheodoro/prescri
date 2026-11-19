// ============================================================
//  anamnese.js — Modelos de anamnese prontos para copiar e colar
//  Modelos padrão + modelos próprios (salvos em localStorage).
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

// ── Persistência dos modelos próprios ─────────────────────
function anamCustomGet() {
  try {
    const raw = localStorage.getItem(ANAM_CUSTOM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}
function anamCustomSave(list) {
  try { localStorage.setItem(ANAM_CUSTOM_KEY, JSON.stringify(list)); } catch (e) {}
}

function anamEscape(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function anamAll() {
  const custom = anamCustomGet().map(c => ({ ...c, custom: true, category: c.category || "Meus modelos" }));
  return [...custom, ...ANAM_DEFAULTS.map(d => ({ ...d, custom: false }))];
}

// ── Navegação ────────────────────────────────────────────
let anamOpenId = null;

function openAnamnese() {
  showScreen("screen-anamnese");
  const s = document.getElementById("anam-search");
  if (s) s.value = "";
  renderAnamnese();
}

// ── Renderização ─────────────────────────────────────────
function renderAnamnese() {
  const wrap = document.getElementById("anam-list");
  if (!wrap) return;
  const q = (document.getElementById("anam-search")?.value || "").trim().toLowerCase();

  const items = anamAll().filter(t =>
    !q || t.title.toLowerCase().includes(q) ||
    (t.category || "").toLowerCase().includes(q) ||
    t.text.toLowerCase().includes(q)
  );

  if (!items.length) {
    wrap.innerHTML = `<div class="empty-state">Nenhum modelo encontrado.</div>`;
    return;
  }

  wrap.innerHTML = items.map(t => {
    const open = anamOpenId === t.id || (q && items.length === 1);
    return `
      <div class="anam-card${open ? " open" : ""}" data-id="${anamEscape(t.id)}">
        <button type="button" class="anam-head" onclick="anamToggle('${anamEscape(t.id)}')">
          <span class="anam-title">${anamEscape(t.title)}</span>
          <span class="anam-tag">${anamEscape(t.category)}</span>
          <span class="anam-chevron">▾</span>
        </button>
        ${open ? `
          <div class="anam-body">
            <textarea class="anam-textarea" id="anam-ta-${anamEscape(t.id)}" spellcheck="false"
              oninput="anamAutoSize(this)">${anamEscape(t.text)}</textarea>
            <div class="anam-actions">
              <button type="button" class="anam-btn anam-btn-primary" onclick="anamCopy('${anamEscape(t.id)}', this)">📋 Copiar</button>
              ${t.custom
                ? `<button type="button" class="anam-btn" onclick="anamSaveEdit('${anamEscape(t.id)}')">💾 Salvar alterações</button>
                   <button type="button" class="anam-btn anam-btn-danger" onclick="anamDelete('${anamEscape(t.id)}')">🗑 Excluir</button>`
                : `<button type="button" class="anam-btn" onclick="anamReset('${anamEscape(t.id)}')">↺ Restaurar original</button>
                   <button type="button" class="anam-btn" onclick="anamDuplicate('${anamEscape(t.id)}')">＋ Salvar como meu modelo</button>`}
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

function anamReset(id) {
  const base = ANAM_DEFAULTS.find(d => d.id === id);
  const ta = document.getElementById("anam-ta-" + id);
  if (!base || !ta) return;
  ta.value = base.text;
  anamAutoSize(ta);
}

function anamDuplicate(id) {
  const base = ANAM_DEFAULTS.find(d => d.id === id);
  const ta = document.getElementById("anam-ta-" + id);
  if (!base) return;
  const list = anamCustomGet();
  const newId = "c" + Date.now();
  list.unshift({ id: newId, title: base.title + " (meu)", category: "Meus modelos", text: ta ? ta.value : base.text });
  anamCustomSave(list);
  anamOpenId = newId;
  renderAnamnese();
}

function anamSaveEdit(id) {
  const ta = document.getElementById("anam-ta-" + id);
  const list = anamCustomGet();
  const item = list.find(x => x.id === id);
  if (!item || !ta) return;
  item.text = ta.value;
  anamCustomSave(list);
  const btn = document.querySelector(`.anam-card[data-id="${id}"] .anam-btn:nth-child(2)`);
  if (btn) {
    const old = btn.textContent;
    btn.textContent = "✓ Salvo!";
    setTimeout(() => { btn.textContent = old; }, 1800);
  }
}

function anamDelete(id) {
  if (!confirm("Excluir este modelo?")) return;
  anamCustomSave(anamCustomGet().filter(x => x.id !== id));
  anamOpenId = null;
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
  const text = document.getElementById("anam-new-text").value;
  if (!title || !text.trim()) {
    alert("Preencha o título e o texto do modelo.");
    return;
  }
  const list = anamCustomGet();
  const id = "c" + Date.now();
  list.unshift({ id, title, category: "Meus modelos", text });
  anamCustomSave(list);
  document.getElementById("anam-new-title").value = "";
  document.getElementById("anam-new-text").value = "";
  document.getElementById("anam-new-form").classList.remove("open");
  anamOpenId = id;
  renderAnamnese();
}

window.openAnamnese = openAnamnese;
window.renderAnamnese = renderAnamnese;
window.anamToggle = anamToggle;
window.anamAutoSize = anamAutoSize;
window.anamCopy = anamCopy;
window.anamReset = anamReset;
window.anamDuplicate = anamDuplicate;
window.anamSaveEdit = anamSaveEdit;
window.anamDelete = anamDelete;
window.anamToggleNewForm = anamToggleNewForm;
window.anamCreateNew = anamCreateNew;
