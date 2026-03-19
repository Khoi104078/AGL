let users = JSON.parse(localStorage.getItem("users")) || [];
let events = JSON.parse(localStorage.getItem("events")) || [];
let participants = JSON.parse(localStorage.getItem("participants")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser"));

let isLoginMode = true;
let selectedStatus = "Mở";

function toggleMenu() {
  document.getElementById("menu").classList.toggle("show");
}

function go(id) {
  document.querySelectorAll(".page").forEach(p => p.style.display="none");
  document.getElementById(id).style.display="block";
}

function selectStatus(el) {
  document.querySelectorAll(".status-tag").forEach(t=>t.classList.remove("active"));
  el.classList.add("active");
  selectedStatus = el.dataset.val;
}

function submitEvent() {
  let t = title.value;
  let l = leader.value;
  let d = date.value;

  if(!t || !l || !d) return alert("Nhập đủ!");

  events.push({t,l,d});
  localStorage.setItem("events", JSON.stringify(events));

  showToast("Tạo thành công!");
}

function renderEvents() {
  eventTable.innerHTML = events.map(e => `
    <tr>
      <td>${e.t}</td>
      <td>${e.l}</td>
      <td>${e.d}</td>
    </tr>
  `).join("");
}

function updateEventDropdown() {
  peventSelect.innerHTML = events.map(e =>
    `<option>${e.t}</option>`
  ).join("");
}

function addParticipant() {
  participants.push({
    name: pname.value,
    event: peventSelect.value
  });
  localStorage.setItem("participants", JSON.stringify(participants));
  showToast("Đăng ký OK!");
}

function handleAuth() {
  let email = auth_email.value;
  let pass = auth_pass.value;

  let u = users.find(x => x.email===email && x.pass===pass);
  if(!u) return showToast("Sai!");

  currentUser = u;
  localStorage.setItem("currentUser", JSON.stringify(u));
  showToast("Đăng nhập OK!");
}

function showToast(msg) {
  let t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2000);
}
