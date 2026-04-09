let currentUser = JSON.parse(localStorage.getItem("currentUser"));
let isLoginMode = true;
let selectedStatus = "Mở";

/* HOA RƠI */
setInterval(() => {
  let f = document.createElement("div");
  f.className="flower";
  f.innerHTML="🌸";
  f.style.left = Math.random()*100+"vw";
  f.style.animationDuration = (3+Math.random()*5)+"s";
  document.body.appendChild(f);
  setTimeout(()=>f.remove(), 8000);
}, 300);

/* MENU */
function toggleMenu() {
  document.getElementById("menu").classList.toggle("show");
}

function go(id) {
  document.querySelectorAll(".page").forEach(p => p.style.display="none");
  document.getElementById(id).style.display="block";

  if(id === 'manage') renderEvents();
  if(id === 'participants') renderParticipants();
  if(id === 'join') updateEventDropdown();
}

/* STATUS */
function selectStatus(el) {
  document.querySelectorAll(".status-tag").forEach(t => t.classList.remove("active"));
  el.classList.add("active");
  selectedStatus = el.dataset.val;
}

/* EVENT */
function submitEvent() {
  let t = title.value.trim();
  let l = leader.value.trim();
  let d = date.value;

  if(!t || !l || !d) return alert("Nhập đủ!");

  events.push({ t, l, d, time: time.value, status: selectedStatus });
  localStorage.setItem("events", JSON.stringify(events));
  showToast("🎉 Thành công!");
}

function renderEvents() {
  eventTable.innerHTML = events.map((e,i)=>`
    <tr>
      <td>${e.t}</td>
      <td>${e.l}</td>
      <td>${e.d}</td>
      <td><button onclick="delEvent(${i})">X</button></td>
    </tr>
  `).join("");
}

function delEvent(i){
  events.splice(i,1);
  localStorage.setItem("events", JSON.stringify(events));
  renderEvents();
}

/* PARTICIPANT */
function updateEventDropdown() {
  peventSelect.innerHTML = events.map(e=>`<option>${e.t}</option>`).join("");
}

function addParticipant(){
  participants.push({ name:pname.value, event:peventSelect.value });
  localStorage.setItem("participants", JSON.stringify(participants));
  showToast("OK!");
}



/* TOAST */
function showToast(msg){
  let t = document.getElementById("toast");
  t.innerText = msg;
  t.className = "toast success show";
  setTimeout(()=>t.classList.remove("show"),2000);
}
