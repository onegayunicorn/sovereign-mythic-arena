import { AXIS_WEIGHTS, weightedTotal } from "./scoring.js";
import { initChronosPanel } from "./physics.js";

const AXES=[{key:"mythic",label:"Mythic",weight:AXIS_WEIGHTS.mythic,color:"#e8b44a"},{key:"math",label:"Math",weight:AXIS_WEIGHTS.math,color:"#d8f84b"},{key:"physics",label:"Physics",weight:AXIS_WEIGHTS.physics,color:"#5eead4"},{key:"repro",label:"Repro",weight:AXIS_WEIGHTS.repro,color:"#f2eee3"},{key:"craft",label:"Craft",weight:AXIS_WEIGHTS.craft,color:"#ff8a70"}];
const CONTENDERS=[
{id:"deepseek",name:"DeepSeek",stack:"Open Weight Ontology",artifact:"Chronos Pendulum",proof:"Proposed target: energy drift < 1e-9 over 1e5 steps; period scaling compared with sqrt(L/g).",base:{mythic:88,math:94,physics:84,repro:96,craft:84}},
{id:"grok",name:"Grok",stack:"Overton Window",artifact:"Euler Obelisk",proof:"Proposed target: buckling load compared with Euler prediction; imperfection sweep documented.",base:{mythic:93,math:78,physics:82,repro:74,craft:90}},
{id:"gemini",name:"Gemini",stack:"Halo Clock",artifact:"Kuramoto Array",proof:"Proposed target: order parameter and finite-size scaling recorded across coupling values.",base:{mythic:90,math:84,physics:86,repro:62,craft:92}},
{id:"claude",name:"Claude",stack:"Constitutional Gyroscope",artifact:"Angular Momentum Rig",proof:"Proposed target: angular momentum drift reported; coordinate singularities tested.",base:{mythic:86,math:96,physics:84,repro:91,craft:88}},
{id:"gpt",name:"GPT",stack:"Omni Orrery",artifact:"Symplectic N-Body",proof:"Proposed target: energy error scaling and close-encounter policy documented.",base:{mythic:89,math:90,physics:81,repro:80,craft:94}},
{id:"llama",name:"Llama",stack:"Herd Lattice",artifact:"Spring Lattice",proof:"Proposed target: dispersion relation and scaling compared across declared hardware.",base:{mythic:78,math:82,physics:88,repro:98,craft:76}}
];
const byId=Object.fromEntries(CONTENDERS.map(c=>[c.id,c]));
const KEY="mythic-battle-royal-v1";
let ledger=[];
function fnvHash(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,"0")}
function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function scoreSide(c,r){const out={};AXES.forEach(ax=>out[ax.key]=Math.max(0,Math.min(100,Math.round(c.base[ax.key]+(r()-.5)*13))));return out}
function totalOf(s){return weightedTotal(s)}
function makeBout(aId,bId,nonce,number){if(aId===bId)bId=CONTENDERS.find(c=>c.id!==aId).id;const a=byId[aId],b=byId[bId];const seed=fnvHash(`${aId}:${bId}:${nonce}`);const r=rng(parseInt(seed,16));const sa=scoreSide(a,r),sb=scoreSide(b,r),ta=totalOf(sa),tb=totalOf(sb);const record={bout:number,a:aId,b:bId,scores:{a:sa,b:sb},totals:{a:ta,b:tb},winner:ta>=tb?aId:bId,seed,gates:{build:"demo",units:"demo",headless:"demo",hash:"demo"},evidenceStatus:"demo-seed",artifacts:{a:a.artifact,b:b.artifact}};record.entryHash=fnvHash(JSON.stringify(record)+(ledger.length?ledger[ledger.length-1].entryHash:"genesis"));return record}
function load(){try{const x=JSON.parse(localStorage.getItem(KEY)||"null");return Array.isArray(x)&&x.length?x:null}catch{return null}}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(ledger))}catch{toast("Storage unavailable")}}
function seedLedger(){const saved=load();if(saved){ledger=saved;return}ledger=[];[["deepseek","gemini"],["claude","gpt"],["llama","grok"]].forEach((p,i)=>ledger.push(makeBout(p[0],p[1],i+1,i+1)));persist()}
function standings(){return CONTENDERS.map(c=>{const bouts=ledger.filter(e=>e.a===c.id||e.b===c.id),wins=bouts.filter(e=>e.winner===c.id).length,avg=bouts.length?bouts.reduce((s,e)=>s+(e.a===c.id?e.totals.a:e.totals.b),0)/bouts.length:0;return{...c,bouts:bouts.length,wins,avg:Math.round(avg*10)/10}}).sort((x,y)=>y.avg-x.avg||y.wins-x.wins||x.id.localeCompare(y.id))}
function renderStandings(){document.getElementById("standings").innerHTML=standings().map((c,i)=>{const mini=AXES.map(ax=>`<i title="${ax.label} ${c.base[ax.key]}"><b style="width:${c.base[ax.key]}%;background:${ax.color};opacity:.8"></b></i>`).join("");return`<article class="row ${i===0?"lead":""}"><div class="rank mono">${String(i+1).padStart(2,"0")}</div><div><div class="model-line"><span class="display model-name">${c.name}</span><span class="stack">${c.stack} → ${c.artifact}</span></div><div class="axis-mini">${mini}</div></div><div><div class="display score" style="color:${i===0?"var(--gold)":"var(--bone)"}">${c.avg.toFixed(1)}</div><div class="score-sub">${c.wins}–${c.bouts-c.wins}</div></div></article>`}).join("");document.getElementById("statBouts").textContent=ledger.length}
function renderLedger(){document.getElementById("ledgerBody").innerHTML=ledger.slice().reverse().slice(0,10).map(e=>{const a=byId[e.a],b=byId[e.b],w=byId[e.winner];return`<tr><td>#${String(e.bout).padStart(3,"0")}</td><td>${a.name} <span style="color:var(--muted)">v</span> ${b.name}</td><td style="color:var(--lime)">${w.name}</td><td>${e.totals.a.toFixed(1)}–${e.totals.b.toFixed(1)}</td><td>${e.seed}</td><td class="hash">${e.entryHash}</td></tr>`}).join("")}
function renderSelects(){const opts=CONTENDERS.map(c=>`<option value="${c.id}">${c.name} — ${c.stack}</option>`).join("");const a=document.getElementById("selA"),b=document.getElementById("selB");a.innerHTML=opts;b.innerHTML=opts;a.value="deepseek";b.value="grok"}
function renderResult(e){const el=document.getElementById("result");if(!e){el.innerHTML='<div class="verdict"><div class="verdict-top"><span>No bout loaded</span><span>Awaiting bell</span></div><p class="fine" style="padding:0">Pick two corners and run the forge. Demo gates are not evidence of a physical test.</p></div>';return}const a=byId[e.a],b=byId[e.b],w=byId[e.winner],l=byId[e.winner===e.a?e.b:e.a];const rows=AXES.map(ax=>`<tr><td style="color:${ax.color}">${ax.label}</td><td>${e.scores.a[ax.key]}</td><td>${e.scores.b[ax.key]}</td></tr>`).join("");el.innerHTML=`<div class="verdict"><div class="verdict-top"><span style="color:var(--lime)">Bout #${String(e.bout).padStart(3,"0")} · demo record</span><span>seed ${e.seed}</span></div><div class="display winner">${w.name} takes this bout</div><div class="result-sub">${e.totals.a.toFixed(1)} — ${e.totals.b.toFixed(1)} · ${a.name} vs ${b.name}</div><table class="score-table"><thead><tr><th>Axis</th><th>${a.name.slice(0,3).toUpperCase()}</th><th>${b.name.slice(0,3).toUpperCase()}</th></tr></thead><tbody>${rows}</tbody></table><div class="proof">PROPOSED ARTIFACT // ${w.artifact}: ${w.proof}</div><div class="fine" style="padding:0;margin-top:12px">${l.name} returns to the forge. Scores are seeded illustrations, independent of the Chronos simulation.</div></div>`}
function toast(s){const t=document.getElementById("toast");t.textContent=s;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),1900)}
function runBout(){const a=document.getElementById("selA").value;let b=document.getElementById("selB").value;if(a===b){b=CONTENDERS.find(c=>c.id!==a).id;document.getElementById("selB").value=b;toast("Same corner; opponent adjusted")};const e=makeBout(a,b,ledger.length+1,ledger.length+1);ledger.push(e);persist();renderStandings();renderLedger();renderResult(e);toast(`Demo bout #${String(e.bout).padStart(3,"0")} appended`)}
document.getElementById("run").addEventListener("click",runBout);
document.getElementById("copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(JSON.stringify(ledger,null,2));toast("Demo ledger copied")}catch{const ta=document.createElement("textarea");ta.value=JSON.stringify(ledger,null,2);document.body.appendChild(ta);ta.select();try{document.execCommand("copy");toast("Demo ledger copied")}catch{toast("Copy blocked")}ta.remove()}});
document.getElementById("reset").addEventListener("click",()=>{try{localStorage.removeItem(KEY)}catch{}ledger=[];seedLedger();renderStandings();renderLedger();renderResult(null);toast("Demo ledger reseeded")});
seedLedger();renderSelects();renderStandings();renderLedger();renderResult(null);document.getElementById("clock").textContent=new Date().toISOString().slice(0,16).replace("T"," ")+" UTC";
initChronosPanel();


const inferenceConnection=document.getElementById("inferenceConnection");
const inferenceProvider=document.getElementById("inferenceProvider");
const inferenceModel=document.getElementById("inferenceModel");
const inferenceMode=document.getElementById("inferenceMode");
const inferenceReadiness=document.getElementById("inferenceReadiness");
const inferenceNote=document.getElementById("inferenceNote");
const inferenceForm=document.getElementById("inferenceForm");
const inferencePrompt=document.getElementById("inferencePrompt");
const inferenceResponse=document.getElementById("inferenceResponse");
const inferenceEvidence=document.getElementById("inferenceEvidence");
const inferenceMetadata=document.getElementById("inferenceMetadata");
const generateInference=document.getElementById("generateInference");

function inferenceField(value){return value===null||value===undefined||value===""?"—":String(value)}
function showInferenceDisconnected(){
  inferenceConnection.textContent="Disconnected";
  inferenceProvider.textContent="—";
  inferenceModel.textContent="—";
  inferenceMode.textContent="—";
  inferenceReadiness.textContent="Unavailable";
  inferenceNote.textContent="Local API unavailable. This panel needs the same-origin FastAPI service; GitHub Pages has no local API, so generation is unavailable there.";
}
async function loadInferenceStatus(){
  try{
    const response=await fetch("/api/inference/status",{method:"GET",headers:{Accept:"application/json"},cache:"no-store"});
    if(!response.ok)throw new Error(`Status endpoint returned HTTP ${response.status}.`);
    const data=await response.json();
    inferenceConnection.textContent="Connected";
    inferenceProvider.textContent=inferenceField(data.provider);
    inferenceModel.textContent=inferenceField(data.model);
    inferenceMode.textContent=inferenceField(data.mode);
    inferenceReadiness.textContent=data.real_model_available===true?"Available":"Not available";
    inferenceNote.textContent=inferenceField(data.note)==="—"?"Status received from the local inference API.":String(data.note);
  }catch{
    showInferenceDisconnected();
  }
}
inferenceForm.addEventListener("submit",async(event)=>{
  event.preventDefault();
  const prompt=inferencePrompt.value.trim();
  if(!prompt){inferencePrompt.focus();return}
  generateInference.disabled=true;
  inferenceForm.setAttribute("aria-busy","true");
  inferenceEvidence.classList.remove("actual");
  inferenceEvidence.textContent="REQUEST IN PROGRESS";
  inferenceMetadata.textContent="Waiting for provider/model/mode metadata…";
  inferenceResponse.textContent="Generating…";
  try{
    const response=await fetch("/api/inference/generate",{
      method:"POST",
      headers:{"Content-Type":"application/json",Accept:"application/json"},
      body:JSON.stringify({prompt})
    });
    if(!response.ok)throw new Error(`Generation endpoint returned HTTP ${response.status}.`);
    const data=await response.json();
    const evidenceStatus=typeof data.evidence_status==="string"?data.evidence_status:"";
    const isActualLocalOutput=evidenceStatus==="local_model_output";
    inferenceEvidence.classList.toggle("actual",isActualLocalOutput);
    inferenceEvidence.textContent=isActualLocalOutput
      ?"ACTUAL LOCAL MODEL OUTPUT · local_model_output"
      :`MOCK / NON-LOCAL — NOT ACTUAL LOCAL OUTPUT · ${evidenceStatus||"evidence status missing"}`;
    inferenceMetadata.textContent=`Provider: ${inferenceField(data.provider)} · Model: ${inferenceField(data.model)} · Mode: ${inferenceField(data.mode)} · Evidence: ${inferenceField(evidenceStatus)}`;
    inferenceResponse.textContent=typeof data.response==="string"?data.response:"API returned no text response.";
  }catch(error){
    inferenceEvidence.classList.remove("actual");
    inferenceEvidence.textContent="NO MODEL RESPONSE";
    inferenceMetadata.textContent="No provider/model/mode metadata was received.";
    inferenceResponse.textContent=`Generation unavailable: ${error instanceof Error?error.message:"request failed"}`;
    if(error instanceof TypeError)showInferenceDisconnected();
  }finally{
    generateInference.disabled=false;
    inferenceForm.removeAttribute("aria-busy");
  }
});
loadInferenceStatus();
