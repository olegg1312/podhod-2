"use strict";
const PLAN=[["Грудь", "Грудь и трицепс", [["Жим в хаммере", 1, 6, 10, "100"], ["Жим в хаммере вверх", 1, 8, 12, ""], ["Бабочка", 0, 10, 15, ""], ["Французский жим EZ", 0, 8, 12, ""], ["Разгибания на блоке", 0, 10, 15, ""], ["Скручивания в тренажёре", 0, 10, 20, ""]]], ["Спина", "Спина и бицепс", [["Верхний блок широким хватом", 1, 8, 12, ""], ["Горизонтальная тяга", 1, 8, 12, ""], ["Верхний блок узким хватом", 1, 10, 15, ""], ["Бицепс с EZ-грифом", 0, 8, 12, ""], ["Бицепс на скамье Скотта", 0, 10, 15, ""]]], ["Плечи", "Плечи и трицепс", [["Жим над головой в тренажёре", 1, 6, 10, ""], ["Махи в тренажёре", 0, 10, 15, ""], ["Обратная бабочка", 0, 12, 20, ""], ["Разгибания сидя в тренажёре", 0, 10, 15, ""]]], ["Ноги", "Ноги и бицепс", [["Жим ногами", 1, 8, 12, ""], ["Сгибания ног", 0, 10, 15, ""], ["Разгибания ног", 0, 10, 15, ""], ["Икры стоя", 0, 10, 15, ""], ["Икры сидя", 0, 12, 20, ""], ["Бицепс в тренажёре", 0, 10, 15, ""], ["Сведение ног", 0, 12, 20, ""]]]];
const KEY="podhod-v1",REST=180000,PHASES=[[2,3],[3,3],[3,4],[4,4]];
const WRE=/^\d{0,4}([.]\d{0,2})?$/,RRE=/^\d{0,3}$/,DRE=/^\d{4}-\d{2}-\d{2}$/;
const $=id=>document.getElementById(id);
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
function pad(n){return String(n).padStart(2,"0")}
function todayStr(){const d=new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
function parseDate(s){if(!DRE.test(s))return null;const[y,m,d]=s.split("-").map(Number),x=new Date(y,m-1,d);return x.getFullYear()===y&&x.getMonth()===m-1&&x.getDate()===d?x:null}
function isNum(s,re){return typeof s==="string"&&re.test(s)}
function cleanRow(r){if(!r||typeof r!=="object")return null;if(!isNum(r.w,WRE)||!isNum(r.r,RRE)||typeof r.done!=="boolean")return null;return{w:r.w,r:r.r,done:r.done}}
function cleanExercises(list,d){if(!Array.isArray(list)||list.length!==PLAN[d][2].length)return null;const out=[];for(const e of list){if(!e||!Array.isArray(e.rows)||e.rows.length<1||e.rows.length>6)return null;const rows=e.rows.map(cleanRow);if(rows.some(x=>!x))return null;out.push({rows,suggested:e.suggested===true,added:e.added===true})}return out}
function cleanState(v){
 if(!v||typeof v!=="object"||v.version!==1||!parseDate(v.start)||!Number.isInteger(v.day)||v.day<0||v.day>3||!Array.isArray(v.history)||v.history.length>2000)return null;
 const s={version:1,start:v.start,day:v.day,history:[],drafts:{},config:{},timerEnd:null};
 for(const h of v.history){if(!h||!Number.isInteger(h.day)||h.day<0||h.day>3||typeof h.time!=="string"||isNaN(Date.parse(h.time)))return null;const ex=cleanExercises(h.exercises,h.day);if(!ex)return null;s.history.push({day:h.day,time:new Date(h.time).toISOString(),phase:Number.isInteger(h.phase)&&h.phase>=0&&h.phase<=3?h.phase:0,exercises:ex})}
 if(v.drafts&&typeof v.drafts==="object")for(const d of [0,1,2,3]){const x=v.drafts[d];if(!x)continue;const ex=cleanExercises(x.exercises,d);if(ex&&parseDate(x.date))s.drafts[d]={date:x.date,phase:Number.isInteger(x.phase)&&x.phase>=0&&x.phase<=3?x.phase:0,exercises:ex}}
 if(v.config&&typeof v.config==="object")for(const d of [0,1,2,3])PLAN[d][2].forEach((_,i)=>{const c=v.config[d+"-"+i];if(c&&c.step!==null&&c.step!==undefined&&Number.isFinite(Number(c.step))&&Number(c.step)>0&&Number(c.step)<=100)s.config[d+"-"+i]={step:Number(c.step)}});
 if(Number.isFinite(v.timerEnd)&&v.timerEnd>Date.now()&&v.timerEnd<Date.now()+REST+5000)s.timerEnd=v.timerEnd;
 return s}
let state={version:1,start:todayStr(),day:0,history:[],drafts:{},config:{},timerEnd:null},storageOK=true;
try{const raw=localStorage.getItem(KEY);if(raw){if(raw.length>1500000)throw 0;const c=cleanState(JSON.parse(raw));if(c)state=c;else throw 0}}catch(e){if(localStorage.getItem(KEY)){storageOK=false;notice("Сохранённые данные повреждены и не загружены. Не экспортируй их поверх старой копии.")}}
function notice(t){const n=$("notice");n.textContent=t;n.hidden=!t}
function save(){if(!storageOK)return;try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){storageOK=false;notice("Не удалось сохранить данные. Сделай экспорт.")}}
function phase(){const s=parseDate(state.start),t=new Date();const a=new Date(t.getFullYear(),t.getMonth(),t.getDate());const days=Math.max(0,Math.round((a-s)/86400000));const week=Math.floor(days/7)+1;const p=Math.min(3,Math.floor((week-1)/2));return{week,p,sets:PHASES[p]}}
function last(d){for(let i=state.history.length-1;i>=0;i--)if(state.history[i].day===d)return state.history[i];return null}
function ensureDraft(){
 const d=state.day;if(state.drafts[d])return state.drafts[d];
 const ph=phase(),prevWorkout=last(d);
 const exercises=PLAN[d][2].map((ex,i)=>{
  const n=ph.sets[ex[1]],prev=prevWorkout&&prevWorkout.exercises[i],step=(state.config[d+"-"+i]||{}).step;
  let w=prev?prev.rows[0].w:ex[4];
  const sameW=prev&&prev.rows.every(r=>r.done&&r.w===prev.rows[0].w&&Number(r.w)>0&&Number(r.r)>=ex[3]);
  const suggested=!!(sameW&&n<=prev.rows.length&&step>0);
  if(suggested)w=String(Math.round((Number(w)+step)*100)/100);
  return{rows:Array.from({length:n},()=>({w,r:"",done:false})),suggested,added:!!(prev&&n>prev.rows.length)}});
 state.drafts[d]={date:todayStr(),phase:ph.p,exercises};save();return state.drafts[d]}
function render(){
 const d=state.day,ph=phase(),draft=ensureDraft(),prevWorkout=last(d);
 $("start").value=state.start;
 $("phase").textContent="Неделя "+ph.week+" · этап "+(ph.p+1)+"/4"+(ph.week>8?" · цикл завершён":"");
 const tabs=$("tabs");tabs.replaceChildren();
 PLAN.forEach((p,i)=>{const b=el("button","tab"+(i===d?" active":""),p[0]);b.dataset.day=i;b.setAttribute("aria-pressed",String(i===d));tabs.append(b)});
 $("dayTitle").textContent=PLAN[d][1];
 $("dayMeta").textContent="Изоляция "+ph.sets[0]+" · основные "+ph.sets[1]+" подхода";
 const root=$("exercises");root.replaceChildren();
 PLAN[d][2].forEach((ex,i)=>{
  const de=draft.exercises[i],prev=prevWorkout&&prevWorkout.exercises[i],card=el("section","card");
  const head=el("div","card-head");const left=el("div");left.append(el("h2","",ex[0]),el("div","muted",de.rows.length+" × "+ex[2]+"–"+ex[3]));head.append(left,el("span","badge"+(ex[1]?" main":""),ex[1]?"Основное":"Изоляция"));card.append(head);
  card.append(el("div","muted small prev","Прошлый раз: "+(prev?prev.rows.map(r=>(r.w||"—")+" кг × "+(r.r||"—")).join(" / "):"нет записи")));
  if(de.suggested)card.append(el("p","hint","Все подходы дошли до верхней границы — предложена прибавка веса."));
  if(de.added)card.append(el("p","hint add","Добавлен подход — вес сохранён, цель: все подходы до верха диапазона."));
  const sh=el("div","set-head");["№","Вес, кг","Повторы",""].forEach(t=>sh.append(el("span","",t)));card.append(sh);
  de.rows.forEach((r,j)=>{
   const row=el("div","set"+(r.done?" done":""));row.append(el("span","num",String(j+1)));
   for(const f of ["w","r"]){const inp=el("input");inp.type="text";inp.inputMode=f==="w"?"decimal":"numeric";inp.autocomplete="off";inp.maxLength=f==="w"?7:3;inp.value=r[f];inp.dataset.i=i;inp.dataset.j=j;inp.dataset.f=f;inp.setAttribute("aria-label",(f==="w"?"Вес":"Повторы")+", "+ex[0]+", подход "+(j+1));row.append(inp)}
   const t=el("button","tick",r.done?"✓":"○");t.dataset.i=i;t.dataset.j=j;t.setAttribute("aria-label","Отметить подход "+(j+1));row.append(t);card.append(row)});
  const sr=el("label","step");sr.append(el("span","","Шаг прибавки, кг"));const si=el("input");si.type="text";si.inputMode="decimal";si.placeholder="2.5";si.maxLength=6;si.dataset.step=i;si.value=(state.config[d+"-"+i]||{}).step||"";sr.append(si);card.append(sr);root.append(card)});
 progress();
 const h=$("history");h.replaceChildren();state.history.slice(-30).reverse().forEach(x=>{const sets=x.exercises.reduce((a,e)=>a+e.rows.filter(r=>r.done).length,0);h.append(el("p","",new Date(x.time).toLocaleDateString("ru")+" · "+PLAN[x.day][1]+" · "+sets+" подх."))});
 if(!state.history.length)h.append(el("p","","Пока пусто"));
}
function progress(){const rows=ensureDraft().exercises.flatMap(e=>e.rows),done=rows.filter(r=>r.done).length,p=rows.length?Math.round(done/rows.length*100):0;$("bar").style.width=p+"%";$("ring").style.setProperty("--p",p+"%");$("ringText").textContent=done+"/"+rows.length}
let audio=null;
function ring(){try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);g.gain.value=.12;o.frequency.value=880;o.start();o.stop(audio.currentTime+.5)}catch(e){}if(navigator.vibrate)navigator.vibrate(200)}
function startTimer(){try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();audio.resume()}catch(e){}state.timerEnd=Date.now()+REST;save();tick()}
function tick(){
 const dock=$("dock");
 if(!state.timerEnd){$("clock").textContent="03:00";$("timerBar").style.width="0%";return}
 const left=Math.max(0,Math.ceil((state.timerEnd-Date.now())/1000));
 $("clock").textContent=pad(Math.floor(left/60))+":"+pad(left%60);$("timerBar").style.width=(100-left/(REST/1000)*100)+"%";dock.className="dock active";$("timerLabel").textContent="Отдых";
 if(!left){state.timerEnd=null;save();dock.className="dock ready";$("timerLabel").textContent="Готово к следующему подходу";$("timerBar").style.width="100%";ring()}}
$("tabs").addEventListener("click",e=>{const b=e.target.closest(".tab");if(!b)return;state.day=Number(b.dataset.day);save();render()});
$("exercises").addEventListener("input",e=>{
 const t=e.target;if(!(t instanceof HTMLInputElement))return;const v=t.value.replace(",",".");
 if(t.dataset.step!==undefined){const key=state.day+"-"+Number(t.dataset.step);if(v===""){delete state.config[key]}else if(WRE.test(v)&&Number(v)>0){state.config[key]={step:Number(v)}}else{t.value=t.value.slice(0,-1);return}save();return}
 const f=t.dataset.f,i=Number(t.dataset.i),j=Number(t.dataset.j);if(!f)return;
 if(!(f==="w"?WRE:RRE).test(v)){t.value=t.value.slice(0,-1);return}
 t.value=v;const r=ensureDraft().exercises[i].rows[j];r[f]=v;r.done=false;const row=t.closest(".set");row.classList.remove("done");row.querySelector(".tick").textContent="○";save();progress()});
$("exercises").addEventListener("click",e=>{
 const b=e.target.closest(".tick");if(!b)return;const r=ensureDraft().exercises[Number(b.dataset.i)].rows[Number(b.dataset.j)];
 if(!r.done&&(!(Number(r.w)>0)||!(Number(r.r)>=1))){notice("Укажи вес и повторы перед отметкой подхода.");setTimeout(()=>notice(""),2500);return}
 r.done=!r.done;save();if(r.done)startTimer();render()});
$("finish").addEventListener("click",()=>{
 const d=state.day,dr=ensureDraft(),rows=dr.exercises.flatMap(e=>e.rows);
 if(!rows.some(r=>r.done)){notice("Сначала отметь хотя бы один подход.");setTimeout(()=>notice(""),2500);return}
 if(!confirm(rows.every(r=>r.done)?"Сохранить тренировку?":"Есть невыполненные подходы. Сохранить как есть?"))return;
 state.history.push(JSON.parse(JSON.stringify({day:d,time:new Date().toISOString(),phase:dr.phase,exercises:dr.exercises})));
 if(state.history.length>2000)state.history.shift();
 delete state.drafts[d];state.timerEnd=null;state.day=(d+1)%4;save();render();tick();scrollTo({top:0,behavior:"smooth"})});
$("start").addEventListener("change",e=>{const v=e.target.value;if(!parseDate(v)){e.target.value=state.start;return}if(Object.keys(state.drafts).length&&!confirm("Незавершённые тренировки будут пересозданы. Продолжить?")){e.target.value=state.start;return}state.start=v;state.drafts={};save();render()});
$("restart").addEventListener("click",startTimer);
$("skip").addEventListener("click",()=>{state.timerEnd=null;save();$("dock").className="dock";$("timerLabel").textContent="Отдых";tick()});
$("export").addEventListener("click",()=>{const u=URL.createObjectURL(new Blob([JSON.stringify(state)],{type:"application/json"}));const a=document.createElement("a");a.href=u;a.download="podhod-backup-"+todayStr()+".json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000)});
$("import").addEventListener("click",()=>$("file").click());
$("file").addEventListener("change",async e=>{
 const f=e.target.files[0];e.target.value="";if(!f)return;
 try{if(f.size>1000000)throw 0;const c=cleanState(JSON.parse(await f.text()));if(!c)throw 0;if(!confirm("Заменить текущие данные резервной копией?"))return;state=c;storageOK=true;notice("");save();render();tick()}catch(err){notice("Файл не подходит или повреждён. Данные не изменены.");setTimeout(()=>notice(""),3500)}});
document.addEventListener("visibilitychange",()=>{if(!document.hidden)tick()});
setInterval(tick,500);render();tick();
if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
