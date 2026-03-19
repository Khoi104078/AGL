// Dữ liệu từ LocalStorage
let users = JSON.parse(localStorage.getItem("users")) || [];
let events = JSON.parse(localStorage.getItem("events")) || [];
let participants = JSON.parse(localStorage.getItem("participants")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser"));

// Điều hướng menu
function toggleMenu() {
    const menu = document.getElementById("menu");
    menu.classList.toggle("show");
}

function go(p) {
    showPage(p);
    document.getElementById("menu").classList.remove("show");
}

function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    document.getElementById(id).style.display = "block";
}

/* HIỆU ỨNG HOA RƠI */
setInterval(() => {
    let f = document.createElement("div");
    f.className = "flower";
    f.innerHTML = "🌸";
    f.style.left = Math.random() * 100 + "vw";
    f.style.animationDuration = (3 + Math.random() * 5) + "s";
    f.style.opacity = Math.random();
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 8000);
}, 250);

/* ĐĂNG KÝ */
function register(role) {
    let name, email, pass;
    if (role === "user") {
        name = document.getElementById("ru_name").value;
        email = document.getElementById("ru_email").value;
        pass = document.getElementById("ru_pass").value;
    } else {
        name = document.getElementById("ra_name").value;
        email = document.getElementById("ra_email").value;
        pass = document.getElementById("ra_pass").value;
    }

    if (!name || !email || !pass) return alert("Vui lòng nhập đầy đủ!");
    if (!email.includes("@")) return alert("Email không hợp lệ!");

    users.push({ name, email, pass, role });
    localStorage.setItem("users", JSON.stringify(users));
    alert("Đăng ký thành công!");
    
    // Reset form
    if (role === "user") {
        document.getElementById("ru_name").value = "";
        document.getElementById("ru_email").value = "";
        document.getElementById("ru_pass").value = "";
    } else {
        document.getElementById("ra_name").value = "";
        document.getElementById("ra_email").value = "";
        document.getElementById("ra_pass").value = "";
    }
}

/* ĐĂNG NHẬP */
function login() {
    let email = document.getElementById("login_email").value;
    let pass = document.getElementById("login_pass").value;
    
    let u = users.find(x => x.email === email && x.pass === pass);
    if (!u) return alert("Sai tài khoản hoặc mật khẩu!");

    currentUser = u;
    localStorage.setItem("currentUser", JSON.stringify(u));
    updateUI();
    showPage("home");
}

function logout() {
    localStorage.removeItem("currentUser");
    location.reload();
}

/* CẬP NHẬT GIAO DIỆN THEO QUYỀN */
function updateUI() {
    const welcome = document.getElementById("welcome");
    if (!currentUser) {
        welcome.innerText = "Vui lòng đăng nhập để sử dụng hệ thống.";
        return;
    }
    
    welcome.innerText = "Xin chào " + currentUser.name + " (" + (currentUser.role === 'admin' ? 'Quản trị viên' : 'Thành viên') + ")";
    
    document.querySelectorAll(".adminOnly").forEach(btn => {
        btn.style.display = currentUser.role === "admin" ? "block" : "none";
    });
}

/* QUẢN LÝ SỰ KIỆN */
function addEvent() {
    if (!currentUser || currentUser.role !== "admin") {
        alert("Chỉ admin mới được tạo sự kiện!");
        return;
    }

    let t = document.getElementById("title").value.trim();
    let l = document.getElementById("leader").value.trim();
    let d = document.getElementById("date").value;

    if (!t || !l || !d) {
        alert("Vui lòng nhập đầy đủ thông tin!");
        return;
    }

    let exists = events.some(e => e.t.toLowerCase() === t.toLowerCase() && e.d === d);
    if (exists) {
        alert("❌ Sự kiện đã tồn tại!");
        return;
    }

    events.push({ t, l, d });
    localStorage.setItem("events", JSON.stringify(events));

    alert("✅ Tạo sự kiện thành công!");
    document.getElementById("title").value = "";
    document.getElementById("leader").value = "";
    document.getElementById("date").value = "";

    renderEvents();
}

function renderEvents() {
    const eventTable = document.getElementById("eventTable");
    eventTable.innerHTML = "";
    events.forEach((e, i) => {
        let action = (currentUser && currentUser.role === "admin") ?
            `<button class="edit" onclick="editEvent(${i})">✏️</button>
             <button class="delete" onclick="delEvent(${i})">🗑️</button>` : "";

        eventTable.innerHTML += `
        <tr>
            <td>${e.t}</td>
            <td>${e.l}</td>
            <td>${e.d}</td>
            <td>${action}</td>
        </tr>`;
    });
}

function editEvent(i) {
    if (!currentUser || currentUser.role !== "admin") return alert("Chỉ admin!");

    let t = prompt("Tên sự kiện:", events[i].t);
    let l = prompt("Người phụ trách:", events[i].l);
    let d = prompt("Ngày diễn ra:", events[i].d);

    if (t) events[i].t = t;
    if (l) events[i].l = l;
    if (d) events[i].d = d;

    localStorage.setItem("events", JSON.stringify(events));
    renderEvents();
}

function delEvent(i) {
    if (!currentUser || currentUser.role !== "admin") return alert("Chỉ admin!");
    if (confirm("Bạn có chắc muốn xóa sự kiện này?")) {
        events.splice(i, 1);
        localStorage.setItem("events", JSON.stringify(events));
        renderEvents();
    }
}

/* QUẢN LÝ NGƯỜI THAM GIA */
function addParticipant() {
    let pname = document.getElementById("pname").value;
    let pevent = document.getElementById("pevent").value;
    
    if(!pname || !pevent) return alert("Vui lòng điền đủ thông tin!");

    participants.push({ name: pname, event: pevent });
    localStorage.setItem("participants", JSON.stringify(participants));
    
    document.getElementById("pname").value = "";
    document.getElementById("pevent").value = "";
    
    alert("Đăng ký tham gia thành công!");
    renderParticipants();
}

function renderParticipants() {
    const pTable = document.getElementById("pTable");
    pTable.innerHTML = "";
    participants.forEach((p, i) => {
        let action = (currentUser && currentUser.role === "admin") ?
            `<button class="edit" onclick="editP(${i})">✏️</button>
             <button class="delete" onclick="delP(${i})">🗑️</button>` : "";

        pTable.innerHTML += `
        <tr>
            <td>${p.name}</td>
            <td>${p.event}</td>
            <td>${action}</td>
        </tr>`;
    });
}

function editP(i) {
    if (!currentUser || currentUser.role !== "admin") return alert("Chỉ admin!");
    let n = prompt("Tên người tham gia:", participants[i].name);
    let e = prompt("Sự kiện:", participants[i].event);
    if (n) participants[i].name = n;
    if (e) participants[i].event = e;
    localStorage.setItem("participants", JSON.stringify(participants));
    renderParticipants();
}

function delP(i) {
    if (!currentUser || currentUser.role !== "admin") return alert("Chỉ admin!");
    if (confirm("Xóa thông tin này?")) {
        participants.splice(i, 1);
        localStorage.setItem("participants", JSON.stringify(participants));
        renderParticipants();
    }
}

/* XUẤT CSV */
function exportCSV() {
    let csv = "Tên;Sự kiện\n";
    participants.forEach(p => {
        csv += `"${p.name}";"${p.event}"\n`;
    });
    let blob = new Blob(["\uFEFF" + csv], { type: "text/csv" });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "danhsach_thamgia.csv";
    a.click();
}

// Khởi tạo ứng dụng
document.addEventListener("DOMContentLoaded", () => {
    renderEvents();
    renderParticipants();
    updateUI();
    showPage("home");
});