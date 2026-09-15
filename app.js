const STORAGE = "smmOS_v03";
const state = JSON.parse(localStorage.getItem(STORAGE) || '{"projects":[],"currentProjectId":null,"calendar":{},"ideas":{}}');

function save(){ localStorage.setItem(STORAGE, JSON.stringify(state)); }
function projects(){ return state.projects || []; }
function currentProject(){ return projects().find(p=>p.id===state.currentProjectId) || projects()[0] || null; }

function navigate(view){
  if(view !== "home" && !currentProject()){
    openProjectModal();
    showToast("Сначала создай проект");
    return;
  }
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.getElementById("view-"+view).classList.add("active");
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
  document.getElementById("statIdeas").textContent=(state.ideas[p.id]||[]).length;
  const list=document.getElementById("projectList"); list.innerHTML="";
  projects().forEach(project=>{
    const el=document.createElement("div"); el.className="project-card";
    el.onclick=()=>{state.currentProjectId=project.id;save();refreshHeader();navigate("home")};
    el.innerHTML=`<div class="project-avatar">${escapeHtml(project.name[0].toUpperCase())}</div>
      <h3>${escapeHtml(project.name)}</h3><p>${escapeHtml(project.niche)}</p>
      <p>${escapeHtml(project.audience||"ЦА не указана")}</p>`;
    list.appendChild(el);
  });
}

function countSaved(type){
  const p=currentProject(); if(!p)return 0;
  return Number(localStorage.getItem(`smm_${type}_${p.id}`)||0);
}
function incrementSaved(type){
  const p=currentProject(); if(!p)return;
  localStorage.setItem(`smm_${type}_${p.id}`, String(countSaved(type)+1));
  renderHome();
}

function openProjectModal(){document.getElementById("projectModal").classList.add("show")}
function closeProjectModal(){document.getElementById("projectModal").classList.remove("show")}
function createProject(){
  const name=document.getElementById("projectName").value.trim();
  const niche=document.getElementById("projectNiche").value;
  const audience=document.getElementById("projectAudience").value.trim();
  const tone=document.getElementById("projectTone").value;
  if(!name||!niche){showToast("Заполни название и нишу");return}
  const p={id:Date.now(),name,niche,audience,tone};
  state.projects.push(p);state.currentProjectId=p.id;state.calendar[p.id]=[];state.ideas[p.id]=[];save();
  ["projectName","projectAudience"].forEach(id=>document.getElementById(id).value="");
  document.getElementById("projectNiche").value="";
  closeProjectModal();refreshHeader();renderHome();navigate("home");showToast("Проект создан ✦");
}

function openProjectPicker(){
  if(!projects().length){openProjectModal();return}
  const names=projects().map((p,i)=>`${i+1}. ${p.name}`).join("\n");
  const answer=prompt("Выбери номер проекта:\n\n"+names);
  const idx=Number(answer)-1;
  if(Number.isInteger(idx)&&projects()[idx]){
    state.currentProjectId=projects()[idx].id;save();refreshHeader();renderHome();showToast("Проект переключён");
  }
}

function projectContext(){
  const p=currentProject();
  return p ? `${p.name}, ниша: ${p.niche}, ЦА: ${p.audience||"не указана"}, tone of voice: ${p.tone}` : "";
}

function generateReel(e){
  e.preventDefault();const topic=document.getElementById("reelTopic").value.trim();
  const goal=document.getElementById("reelGoal").value,style=document.getElementById("reelStyle").value,length=document.getElementById("reelLength").value;
  const p=currentProject();
  const hook=goal==="Продать"?`«Если вы всё ещё откладываете ${topic.toLowerCase()} — вот что вы теряете.»`:`«3 вещи, которые стоит знать о теме: ${topic}.»`;
  const result=`<div class="result-header"><div><p class="eyebrow">REELS SCRIPT</p><h3>${escapeHtml(topic)}</h3></div><button class="copy-btn" onclick="copyResult('reelResult')">Копировать</button></div>
  <div class="content-block"><h4>Hook · 0–3 сек</h4><p>${escapeHtml(hook)}</p></div>
  <div class="content-block"><h4>Сцена 1 · 3–${length.startsWith("15")?"7":"10"} сек</h4><p>Крупный план или динамичный кадр. Сразу покажи проблему: ${escapeHtml(topic)}.</p></div>
  <div class="content-block"><h4>Сцена 2 · середина</h4><p>Дай 2–3 конкретных пункта. Говори короткими фразами, меняй план каждые 2–3 секунды.</p></div>
  <div class="content-block"><h4>Сцена 3 · финал</h4><p>Покажи результат и свяжи его с потребностью аудитории. Стиль: ${escapeHtml(style)}.</p></div>
  <div class="content-block"><h4>CTA</h4><p>${goal==="Продать"?"Напишите в Direct слово «ХОЧУ» — расскажем условия.":"Сохраните Reels, чтобы вернуться к этому позже, и напишите своё мнение в комментариях."}</p></div>
  <div class="content-block"><h4>Контекст проекта</h4><p>${escapeHtml(projectContext())}</p></div>`;
  document.getElementById("reelResult").classList.remove("empty-result");document.getElementById("reelResult").innerHTML=result;incrementSaved("reels");
}

function generatePost(e){
  e.preventDefault();const topic=document.getElementById("postTopic").value.trim(),type=document.getElementById("postType").value,tone=document.getElementById("postTone").value;
  const p=currentProject();
  const text=`${topic}\n\nЗнакомая ситуация: кажется, что ${topic.toLowerCase()} — это просто очередная задача. Но именно здесь часто теряется результат.\n\nЧто важно:\n• Начните с конкретной проблемы аудитории.\n• Покажите решение простым языком.\n• Дайте человеку следующий шаг, который можно сделать уже сегодня.\n\n${type==="Продающий"?"Если хотите получить результат быстрее — напишите нам в Direct. Подскажем, с чего начать.":"Сохраните пост и поделитесь им с тем, кому это сейчас актуально."}`;
  document.getElementById("postResult").classList.remove("empty-result");
  document.getElementById("postResult").innerHTML=`<div class="result-header"><div><p class="eyebrow">${escapeHtml(type.toUpperCase())} · ${escapeHtml(tone.toUpperCase())}</p><h3>${escapeHtml(topic)}</h3></div><button class="copy-btn" onclick="copyResult('postResult')">Копировать</button></div><div class="content-block"><div class="result-text">${escapeHtml(text)}</div></div><div class="content-block"><h4>CTA</h4><p>${type==="Продающий"?"Напишите в Direct и получите подробности.":"Сохраните пост и поделитесь им."}</p></div>`;
  incrementSaved("posts");
}

function generateStories(e){
  e.preventDefault();const topic=document.getElementById("storyTopic").value.trim(),goal=document.getElementById("storyGoal").value,count=Number(document.getElementById("storyCount").value);
  const titles=["Зацепка","Проблема","Инсайт","Решение","Доказательство","Интерактив","CTA","Возражение","Ответ","Финальный CTA"];
  const bodies=[`Начни с вопроса или сильного утверждения о теме «${topic}».`,`Покажи, почему аудитории знакома эта ситуация.`,`Дай короткий экспертный вывод без сложных терминов.`,`Покажи конкретный способ решить проблему.`,`Добавь кейс, цифру, отзыв или визуальное подтверждение.`,`Используй опрос: «А у вас так бывает?»`,`Призови написать в Direct или перейти по ссылке.`,`Разбери главное сомнение перед покупкой.`,`Дай короткий ответ и вернись к выгоде.`,`Сделай один ясный призыв к действию.`];
  let items="";for(let i=0;i<count;i++)items+=`<div class="story-item"><div class="story-num">${i+1}</div><div><strong>${titles[i]}</strong><p>${escapeHtml(bodies[i])}</p></div></div>`;
  document.getElementById("storyResult").classList.remove("empty-result");document.getElementById("storyResult").innerHTML=`<div class="result-header"><div><p class="eyebrow">STORY SEQUENCE · ${escapeHtml(goal.toUpperCase())}</p><h3>${escapeHtml(topic)}</h3></div><button class="copy-btn" onclick="copyResult('storyResult')">Копировать</button></div><div class="story-list">${items}</div>`;
  incrementSaved("stories");
}

function generateFactory(e){
  e.preventDefault();const topic=document.getElementById("factoryTopic").value.trim(),goal=document.getElementById("factoryGoal").value;
  const formats=[];if(document.getElementById("factoryReels").checked)formats.push("Reels");if(document.getElementById("factoryPosts").checked)formats.push("Посты");if(document.getElementById("factoryStories").checked)formats.push("Stories");
  if(!formats.length){showToast("Выбери хотя бы один формат");return}
  let blocks=formats.map((f,i)=>`<div class="content-block"><h4>${f}</h4><p><b>Идея ${i+1}:</b> ${escapeHtml(topic)} — формат для задачи «${escapeHtml(goal.toLowerCase())}».</p><p>Hook: начни с конкретной боли аудитории и сразу покажи обещание результата.</p><p>CTA: предложи следующий простой шаг — сохранить, написать в Direct или перейти к продукту.</p></div>`).join("");
  document.getElementById("factoryResult").classList.remove("empty-result");document.getElementById("factoryResult").innerHTML=`<div class="result-header"><div><p class="eyebrow">CONTENT SET</p><h3>${escapeHtml(topic)}</h3></div><button class="copy-btn" onclick="copyResult('factoryResult')">Копировать</button></div>${blocks}`;
}

const ideaTemplates=[
  ["Reels","3 ошибки, которые совершают клиенты перед покупкой"],
  ["Reels","Миф vs факт: что на самом деле работает"],
  ["Посты","5 вопросов, которые стоит задать себе перед выбором"],
  ["Посты","История клиента: проблема → решение → результат"],
  ["Stories","Опрос аудитории с разбором ответа"],
  ["Stories","Закулисье рабочего процесса"],
  ["Продажи","Что входит в услугу и за что клиент платит"],
  ["Продажи","Почему сейчас подходящий момент начать"],
  ["Экспертность","Разбор частой ошибки аудитории"],
  ["Экспертность","Мини-инструкция: что сделать за 10 минут"]
];
function generateIdeas(){
  const p=currentProject();if(!p)return;
  const cat=document.getElementById("ideaCategory").value;
  let pool=ideaTemplates.filter(x=>cat==="Все"||x[0]===cat);
  const selected=[...pool].sort(()=>Math.random()-.5).slice(0,6);
  const arr=state.ideas[p.id]||[];
  selected.forEach(x=>{if(!arr.some(i=>i.title===x[1]))arr.push({id:Date.now()+Math.random(),category:x[0],title:x[1],saved:false})});
  state.ideas[p.id]=arr;save();renderIdeas();renderHome();showToast("Идеи добавлены ✦");
}
function renderIdeas(){
  const p=currentProject();if(!p)return;
  const cat=document.getElementById("ideaCategory").value,arr=(state.ideas[p.id]||[]).filter(x=>cat==="Все"||x.category===cat);
  const list=document.getElementById("ideaList");list.innerHTML="";
  if(!arr.length){list.innerHTML=`<div class="empty-panel" style="grid-column:1/-1;padding:65px 20px"><div class="empty-symbol">✧</div><h2>Банк идей пуст</h2><p>Нажми «Сгенерировать идеи».</p></div>`;return}
  arr.forEach(item=>{
    const el=document.createElement("div");el.className="idea-card";
    el.innerHTML=`<div class="idea-card-top"><span class="idea-category">${escapeHtml(item.category.toUpperCase())}</span></div><h3>${escapeHtml(item.title)}</h3><button onclick="saveIdea(${item.id})">${item.saved?"✓ Сохранено":"♡ Сохранить"}</button>`;
    list.appendChild(el);
  });
}
function saveIdea(id){
  const p=currentProject(),arr=state.ideas[p.id]||[],item=arr.find(x=>x.id===id);if(item)item.saved=!item.saved;save();renderIdeas();showToast(item?.saved?"Идея сохранена":"Идея убрана");
}

function openCalendarItemModal(){document.getElementById("calendarModal").classList.add("show");document.getElementById("calendarDate").value=new Date().toISOString().slice(0,10)}
function closeCalendarItemModal(){document.getElementById("calendarModal").classList.remove("show")}
function addCalendarItem(){
  const p=currentProject(),date=document.getElementById("calendarDate").value,type=document.getElementById("calendarType").value,topic=document.getElementById("calendarTopic").value.trim();
  if(!date||!topic){showToast("Заполни дату и тему");return}
  state.calendar[p.id]=state.calendar[p.id]||[];state.calendar[p.id].push({id:Date.now(),date,type,topic,done:false});save();
  document.getElementById("calendarTopic").value="";closeCalendarItemModal();renderCalendar();showToast("Публикация добавлена");
}
function renderCalendar(){
  const p=currentProject(),items=(state.calendar[p.id]||[]).sort((a,b)=>a.date.localeCompare(b.date)),list=document.getElementById("calendarList");
  document.getElementById("calendarCount").textContent=`${items.length} ${items.length===1?"публикация":"публикаций"}`;
  list.innerHTML="";
  if(!items.length){list.innerHTML=`<div class="empty-panel" style="padding:70px 20px"><div class="empty-symbol">▦</div><h2>Контент-план пуст</h2><p>Добавь первую публикацию.</p></div>`;return}
  items.forEach(item=>{
    const el=document.createElement("div");el.className="calendar-item "+(item.done?"done":"");
    el.innerHTML=`<div class="calendar-date">${formatDate(item.date)}</div><span class="type-badge">${escapeHtml(item.type)}</span><div class="calendar-topic">${escapeHtml(item.topic)}</div><div class="calendar-actions"><button onclick="toggleCalendar(${item.id})">${item.done?"Вернуть":"Готово"}</button><button onclick="deleteCalendar(${item.id})">Удалить</button></div>`;
    list.appendChild(el);
  });
}
function toggleCalendar(id){const p=currentProject(),i=(state.calendar[p.id]||[]).find(x=>x.id===id);if(i)i.done=!i.done;save();renderCalendar()}
function deleteCalendar(id){const p=currentProject();state.calendar[p.id]=(state.calendar[p.id]||[]).filter(x=>x.id!==id);save();renderCalendar()}
function formatDate(d){return new Date(d+"T00:00:00").toLocaleDateString("ru-RU",{day:"2-digit",month:"short",year:"numeric"})}

function copyResult(id){
  const el=document.getElementById(id);
  navigator.clipboard?.writeText(el.innerText).then(()=>showToast("Результат скопирован")).catch(()=>showToast("Выдели текст и скопируй вручную"));
}
function showToast(message){const t=document.getElementById("toast");t.textContent=message;t.classList.add("show");clearTimeout(window._toast);window._toast=setTimeout(()=>t.classList.remove("show"),2400)}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

window.addEventListener("click",e=>{
  if(e.target===document.getElementById("projectModal"))closeProjectModal();
  if(e.target===document.getElementById("calendarModal"))closeCalendarItemModal();
});
window.addEventListener("load",()=>{refreshHeader();renderHome();});
