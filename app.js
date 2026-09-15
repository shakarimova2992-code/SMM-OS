const STORAGE = "smmOS_v03";
const state = JSON.parse(localStorage.getItem(STORAGE) || '{"projects":[],"currentProjectId":null,"calendar":{},"ideas":{}}');

function save(){ localStorage.setItem(STORAGE, JSON.stringify(state)); }
function projects(){ return state.projects || []; }
function currentProject(){ return projects().find(p=>p.id===state.currentProjectId) || projects()[0] || null; }

function navigate(view){
  if(view !== "home" && !currentProject()){
    openProjectModal(); showToast("Сначала создай проект"); return;
  }
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  const target=document.getElementById("view-"+view); if(target) target.classList.add("active");
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active", b.dataset.view===view));
  const titles={home:"Главная",content:"Content Factory",reels:"Reels Factory",posts:"Post Generator",stories:"Stories",calendar:"Контент-план",ideas:"Банк идей"};
  document.getElementById("pageTitle").textContent=titles[view]||"SMM OS";
  refreshHeader();
  if(view==="calendar") renderCalendar();
  if(view==="ideas") renderIdeas();
}

document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>navigate(btn.dataset.view)));

function refreshHeader(){
  const p=currentProject();
  document.getElementById("headerProject").textContent=p ? p.name : "нет проекта";
  document.getElementById("currentProjectButton").innerHTML=p ? `${escapeHtml(p.name)} <b>⌄</b>` : `Выберите проект <b>⌄</b>`;
}

function renderHome(){
  const has=projects().length>0;
  document.getElementById("homeEmpty").classList.toggle("hidden",has);
  document.getElementById("homeContent").classList.toggle("hidden",!has);
  if(!has)return;
  const p=currentProject();
  document.getElementById("welcomeTitle").textContent=`Контент для ${p.name}.`;
  document.getElementById("statReels").textContent=countSaved("reels");
  document.getElementById("statPosts").textContent=countSaved("posts");
  document.getElementById("statStories").textContent=countSaved("stories");
  document.getElementById("statIdeas").textContent=(state.ideas[p.id]||[]).filter(x=>x.saved).length;
  const list=document.getElementById("projectList"); list.innerHTML="";
  projects().forEach(project=>{
    const el=document.createElement("div"); el.className="project-card";
    el.onclick=()=>{state.currentProjectId=project.id;save();refreshHeader();navigate("home")};
    el.innerHTML=`<div class="project-avatar">${escapeHtml(project.name[0].toUpperCase())}</div><h3>${escapeHtml(project.name)}</h3><p>${escapeHtml(project.niche)}</p><p>${escapeHtml(project.audience||"ЦА не указана")}</p>`;
    list.appendChild(el);
  });
}
function countSaved(type){ const p=currentProject(); if(!p)return 0; return Number(localStorage.getItem(`smm_${type}_${p.id}`)||0); }
function incrementSaved(type){ const p=currentProject(); if(!p)return; localStorage.setItem(`smm_${type}_${p.id}`,String(countSaved(type)+1)); renderHome(); }

function openProjectModal(){document.getElementById("projectModal").classList.add("show")}
function closeProjectModal(){document.getElementById("projectModal").classList.remove("show")}
function createProject(){
  const name=document.getElementById("projectName").value.trim(), niche=document.getElementById("projectNiche").value, audience=document.getElementById("projectAudience").value.trim(), tone=document.getElementById("projectTone").value;
  if(!name||!niche){showToast("Заполни название и нишу");return}
  const p={id:Date.now(),name,niche,audience,tone}; state.projects.push(p);state.currentProjectId=p.id;state.calendar[p.id]=[];state.ideas[p.id]=[];save();
  ["projectName","projectAudience"].forEach(id=>document.getElementById(id).value="");document.getElementById("projectNiche").value="";
  closeProjectModal();refreshHeader();renderHome();navigate("home");showToast("Проект создан ✦");
}
function openProjectPicker(){
  if(!projects().length){openProjectModal();return}
  const names=projects().map((p,i)=>`${i+1}. ${p.name}`).join("\n"), answer=prompt("Выбери номер проекта:\n\n"+names), idx=Number(answer)-1;
  if(Number.isInteger(idx)&&projects()[idx]){state.currentProjectId=projects()[idx].id;save();refreshHeader();renderHome();showToast("Проект переключён")}
}
function projectContext(){ const p=currentProject(); return p ? `Бренд: ${p.name}\nНиша: ${p.niche}\nЦелевая аудитория: ${p.audience||"не указана"}\nTone of Voice: ${p.tone}` : ""; }

async function generateAI(task,payload){
  const buttons=document.querySelectorAll("button[type='submit']"); buttons.forEach(b=>{if(!b.dataset.originalText)b.dataset.originalText=b.textContent;b.disabled=true;b.textContent="AI генерирует…"});
  try{
    const res=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({task,project:projectContext(),...payload})});
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.error||`Ошибка AI (${res.status})`);
    if(!data.text) throw new Error("AI не вернул текст");
    return data.text.trim();
  }catch(err){
    console.error(err); showToast(err.message||"Не удалось получить ответ AI"); throw err;
  }finally{
    buttons.forEach(b=>{b.disabled=false;if(b.dataset.originalText)b.textContent=b.dataset.originalText});
  }
}

function renderAIResult(elId,title,text,label){
  const el=document.getElementById(elId); el.classList.remove("empty-result");
  el.innerHTML=`<div class="result-header"><div><p class="eyebrow">${escapeHtml(label||"AI RESULT")}</p><h3>${escapeHtml(title)}</h3></div><button class="copy-btn" onclick="copyResult('${elId}')">Копировать</button></div><div class="ai-result-text">${formatAIText(text)}</div>`;
}
function formatAIText(text){
  return escapeHtml(text).replace(/^###\s*(.+)$/gm,"<h4>$1</h4>").replace(/^##\s*(.+)$/gm,"<h3>$1</h3>").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/^\s*[-•]\s+(.+)$/gm,"<div class=\"ai-bullet\">• $1</div>").replace(/\n{2,}/g,"<br><br>").replace(/\n/g,"<br>");
}

async function generateReel(e){
  e.preventDefault(); const topic=document.getElementById("reelTopic").value.trim(); if(!topic)return;
  try{ const text=await generateAI("reels",{topic,goal:document.getElementById("reelGoal").value,style:document.getElementById("reelStyle").value,length:document.getElementById("reelLength").value}); renderAIResult("reelResult",topic,text,"AI REELS SCRIPT"); incrementSaved("reels"); }catch(_){ }
}
async function generatePost(e){
  e.preventDefault(); const topic=document.getElementById("postTopic").value.trim(); if(!topic)return;
  try{ const text=await generateAI("post",{topic,type:document.getElementById("postType").value,tone:document.getElementById("postTone").value}); renderAIResult("postResult",topic,text,"AI POST"); incrementSaved("posts"); }catch(_){ }
}
async function generateStories(e){
  e.preventDefault(); const topic=document.getElementById("storyTopic").value.trim(); if(!topic)return;
  try{ const text=await generateAI("stories",{topic,goal:document.getElementById("storyGoal").value,count:Number(document.getElementById("storyCount").value)}); renderAIResult("storyResult",topic,text,"AI STORIES"); incrementSaved("stories"); }catch(_){ }
}
async function generateFactory(e){
  e.preventDefault(); const topic=document.getElementById("factoryTopic").value.trim();
  const formats=[];if(document.getElementById("factoryReels").checked)formats.push("Reels");if(document.getElementById("factoryPosts").checked)formats.push("Посты");if(document.getElementById("factoryStories").checked)formats.push("Stories");
  if(!topic){showToast("Укажи тему или продукт");return} if(!formats.length){showToast("Выбери хотя бы один формат");return}
  try{ const text=await generateAI("content_factory",{topic,goal:document.getElementById("factoryGoal").value,formats}); renderAIResult("factoryResult",topic,text,"AI CONTENT SET"); }catch(_){ }
}

async function generateIdeas(){
  const p=currentProject();if(!p)return; const category=document.getElementById("ideaCategory").value;
  try{
    const text=await generateAI("ideas",{category,count:10});
    const arr=state.ideas[p.id]||[];
    const lines=text.split("\n").map(x=>x.trim()).filter(Boolean).filter(x=>/^\d+[.)]/.test(x));
    const ideas=(lines.length?lines:[text]).map((line,i)=>{
      const clean=line.replace(/^\d+[.)]\s*/,""); const parts=clean.split(" — ");
      return {id:Date.now()+i+Math.random(),category:category==="Все"?"AI":category,title:parts[0].slice(0,140),details:parts.slice(1).join(" — ")||clean,saved:false};
    });
    state.ideas[p.id]=[...ideas,...arr].slice(0,50);save();renderIdeas();renderHome();showToast("AI создал новые идеи ✦");
  }catch(_){ }
}
function renderIdeas(){
  const p=currentProject();if(!p)return; const cat=document.getElementById("ideaCategory").value,arr=(state.ideas[p.id]||[]).filter(x=>cat==="Все"||x.category===cat||x.category==="AI");
  const list=document.getElementById("ideaList");list.innerHTML="";
  if(!arr.length){list.innerHTML=`<div class="empty-panel" style="grid-column:1/-1;padding:65px 20px"><div class="empty-symbol">✧</div><h2>Банк идей пуст</h2><p>Нажми «Сгенерировать идеи».</p></div>`;return}
  arr.forEach(item=>{const el=document.createElement("div");el.className="idea-card";el.innerHTML=`<div class="idea-card-top"><span class="idea-category">${escapeHtml(item.category.toUpperCase())}</span></div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.details||"")}</p><button onclick="saveIdea(${item.id})">${item.saved?"✓ Сохранено":"♡ Сохранить"}</button>`;list.appendChild(el)});
}
function saveIdea(id){const p=currentProject(),arr=state.ideas[p.id]||[],item=arr.find(x=>x.id===id);if(item)item.saved=!item.saved;save();renderIdeas();renderHome();showToast(item?.saved?"Идея сохранена":"Идея убрана")}

function openCalendarItemModal(){document.getElementById("calendarModal").classList.add("show");document.getElementById("calendarDate").value=new Date().toISOString().slice(0,10)}
function closeCalendarItemModal(){document.getElementById("calendarModal").classList.remove("show")}
function addCalendarItem(){
  const p=currentProject(),date=document.getElementById("calendarDate").value,type=document.getElementById("calendarType").value,topic=document.getElementById("calendarTopic").value.trim();
  if(!date||!topic){showToast("Заполни дату и тему");return} state.calendar[p.id]=state.calendar[p.id]||[];state.calendar[p.id].push({id:Date.now(),date,type,topic,done:false});save();document.getElementById("calendarTopic").value="";closeCalendarItemModal();renderCalendar();showToast("Публикация добавлена")
}
function renderCalendar(){
  const p=currentProject();if(!p)return;const items=(state.calendar[p.id]||[]).sort((a,b)=>a.date.localeCompare(b.date)),list=document.getElementById("calendarList");document.getElementById("calendarCount").textContent=`${items.length} ${items.length===1?"публикация":"публикаций"}`;list.innerHTML="";
  if(!items.length){list.innerHTML=`<div class="empty-panel" style="padding:70px 20px"><div class="empty-symbol">▦</div><h2>Контент-план пуст</h2><p>Добавь первую публикацию.</p></div>`;return}
  items.forEach(item=>{const el=document.createElement("div");el.className="calendar-item "+(item.done?"done":"");el.innerHTML=`<div class="calendar-date">${formatDate(item.date)}</div><span class="type-badge">${escapeHtml(item.type)}</span><div class="calendar-topic">${escapeHtml(item.topic)}</div><div class="calendar-actions"><button onclick="toggleCalendar(${item.id})">${item.done?"Вернуть":"Готово"}</button><button onclick="deleteCalendar(${item.id})">Удалить</button></div>`;list.appendChild(el)})
}
function toggleCalendar(id){const p=currentProject(),i=(state.calendar[p.id]||[]).find(x=>x.id===id);if(i)i.done=!i.done;save();renderCalendar()}
function deleteCalendar(id){const p=currentProject();state.calendar[p.id]=(state.calendar[p.id]||[]).filter(x=>x.id!==id);save();renderCalendar()}
function formatDate(d){return new Date(d+"T00:00:00").toLocaleDateString("ru-RU",{day:"2-digit",month:"short",year:"numeric"})}
function copyResult(id){const el=document.getElementById(id);navigator.clipboard?.writeText(el.innerText).then(()=>showToast("Результат скопирован")).catch(()=>showToast("Не удалось скопировать"))}
function showToast(message){const t=document.getElementById("toast");if(!t)return;t.textContent=message;t.classList.add("show");clearTimeout(window._toast);window._toast=setTimeout(()=>t.classList.remove("show"),2800)}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
window.addEventListener("click",e=>{if(e.target===document.getElementById("projectModal"))closeProjectModal();if(e.target===document.getElementById("calendarModal"))closeCalendarItemModal()});
window.addEventListener("load",()=>{refreshHeader();renderHome()});
