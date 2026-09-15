const $ = id => document.getElementById(id);

function openDashboard(){
  $("landing").style.display="none";
  $("dashboard").classList.add("active");
  showProjectList();
}

function showDashboardHome(){
  $("homeView").classList.remove("hidden");
  $("projectView").classList.add("hidden");
  $("pageTitle").textContent="Твои проекты";
}

function showProjectList(){
  showDashboardHome();
  renderProjects();
}

function openModal(){ $("modal").classList.add("show"); }
function closeModal(){ $("modal").classList.remove("show"); }

function createProject(){
  const name=$("projectName").value.trim();
  const niche=$("projectNiche").value;
  const audience=$("projectAudience").value.trim();

  if(!name || !niche){
    showToast("Заполни название бизнеса и нишу");
    return;
  }

  const project={id:Date.now(),name,niche,audience};
  const projects=JSON.parse(localStorage.getItem("smmProjects"))||[];
  projects.push(project);
  localStorage.setItem("smmProjects",JSON.stringify(projects));

  $("projectName").value="";
  $("projectNiche").value="";
  $("projectAudience").value="";
  closeModal();
  renderProjects();
  showProject(project.id);
}

function renderProjects(){
  const container=$("projects");
  const empty=$("emptyState");
  const projects=JSON.parse(localStorage.getItem("smmProjects"))||[];

  container.innerHTML="";

  if(projects.length===0){
    empty.style.display="block";
    return;
  }

  empty.style.display="none";

  projects.forEach(project=>{
    const card=document.createElement("div");
    card.className="project-card";
    card.onclick=()=>showProject(project.id);
    card.innerHTML=`
      <div class="project-card-top">
        <div class="project-avatar">${escapeHtml(project.name.charAt(0).toUpperCase())}</div>
        <span class="status">● Активный</span>
      </div>
      <h3>${escapeHtml(project.name)}</h3>
      <p>${escapeHtml(project.niche)}</p>
      <p>${escapeHtml(project.audience || "Целевая аудитория не указана")}</p>
      <span class="project-tag">Открыть проект →</span>
    `;
    container.appendChild(card);
  });
}

function showProject(id){
  const projects=JSON.parse(localStorage.getItem("smmProjects"))||[];
  const project=projects.find(p=>p.id===id);
  if(!project) return;

  $("homeView").classList.add("hidden");
  $("projectView").classList.remove("hidden");
  $("pageTitle").textContent="Рабочее пространство";
  $("projectTitle").textContent=project.name;
  $("projectMeta").textContent=`${project.niche} · ${project.audience || "Целевая аудитория не указана"}`;
}

function showComingSoon(name){
  showToast(`${name} — следующий модуль SMM OS ✦`);
}

function scrollToPreview(){
  $("preview").scrollIntoView({behavior:"smooth"});
}

function showToast(message){
  const toast=$("toast");
  toast.textContent=message;
  toast.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer=setTimeout(()=>toast.classList.remove("show"),2600);
}

function escapeHtml(value){
  return String(value).replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

window.addEventListener("click",e=>{
  if(e.target===$("modal")) closeModal();
});

window.addEventListener("load",()=>{
  renderProjects();
});
