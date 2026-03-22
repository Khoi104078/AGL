async function sha256(text) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Lấy dữ liệu ──────────────────────────────────────────
function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}
function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}
function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser")) || null;
}

// ── Hiển thị thông báo inline ─────────────────────────────
function setMsg(elId, msg, isError = true) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = msg;
  el.style.color = isError ? "#e74c3c" : "#27ae60";
  el.style.display = "block";
}
function clearMsg(elId) {
  const el = document.getElementById(elId);
  if (el) { el.textContent = ""; el.style.display = "none"; }
}

// ── ĐĂNG KÝ ──────────────────────────────────────────────
async function register(role) {
  let name, email, pass, msgId;

  if (role === "user") {
    name  = document.getElementById("ru_name")?.value.trim();
    email = document.getElementById("ru_email")?.value.trim();
    pass  = document.getElementById("ru_pass")?.value;
    msgId = "ru_msg";
  } else {
    name  = document.getElementById("ra_name")?.value.trim();
    email = document.getElementById("ra_email")?.value.trim();
    pass  = document.getElementById("ra_pass")?.value;
    msgId = "ra_msg";
  }

  clearMsg(msgId);

  // Validate
  if (!name || !email || !pass) {
    setMsg(msgId, "❌ Vui lòng nhập đầy đủ thông tin!");
    return;
  }
  if (!email.includes("@") || !email.includes(".")) {
    setMsg(msgId, "❌ Email không hợp lệ!");
    return;
  }
  if (pass.length < 6) {
    setMsg(msgId, "❌ Mật khẩu phải có ít nhất 6 ký tự!");
    return;
  }

  const users = getUsers();

  // Kiểm tra email đã tồn tại
  if (users.some(u => u.email === email)) {
    setMsg(msgId, "❌ Email này đã được đăng ký!");
    return;
  }

  // Mã hóa mật khẩu SHA-256
  const passHash = await sha256(pass);

  users.push({ name, email, passHash, role });
  saveUsers(users);

  setMsg(msgId, "✅ Đăng ký thành công! Bạn có thể đăng nhập.", false);

  // Reset form
  if (role === "user") {
    document.getElementById("ru_name").value  = "";
    document.getElementById("ru_email").value = "";
    document.getElementById("ru_pass").value  = "";
  } else {
    document.getElementById("ra_name").value  = "";
    document.getElementById("ra_email").value = "";
    document.getElementById("ra_pass").value  = "";
  }
}

// ── ĐĂNG NHẬP ────────────────────────────────────────────
async function login() {
  const email = document.getElementById("login_email")?.value.trim();
  const pass  = document.getElementById("login_pass")?.value;
  const msgId = "login_msg";

  clearMsg(msgId);

  // Validate bỏ trống
  if (!email || !pass) {
    setMsg(msgId, "❌ Vui lòng nhập email và mật khẩu!");
    return;
  }
  if (!email.includes("@")) {
    setMsg(msgId, "❌ Email không hợp lệ!");
    return;
  }

  const users    = getUsers();
  const passHash = await sha256(pass);

  // Tìm user khớp email + passHash
  const found = users.find(u => u.email === email && u.passHash === passHash);

  if (!found) {
    setMsg(msgId, "❌ Email hoặc mật khẩu không đúng!");
    return;
  }

  // Lưu currentUser (không lưu passHash ra ngoài)
  const currentUser = { name: found.name, email: found.email, role: found.role };
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  // Cập nhật UI ngay
  updateUI();
  clearMsg(msgId);

  // Reset form
  document.getElementById("login_email").value = "";
  document.getElementById("login_pass").value  = "";

  // Về trang chủ
  if (typeof showPage === "function") showPage("home");
  if (typeof go      === "function") go("home");
}

// ── ĐĂNG XUẤT ────────────────────────────────────────────
function logout() {
  localStorage.removeItem("currentUser");
  location.reload();
}

// ── CẬP NHẬT GIAO DIỆN THEO QUYỀN ───────────────────────
function updateUI() {
  const currentUser = getCurrentUser();
  const welcome     = document.getElementById("welcome");

  // Ẩn/hiện nút adminOnly
  document.querySelectorAll(".adminOnly").forEach(btn => {
    btn.style.display =
      (currentUser && currentUser.role === "admin") ? "block" : "none";
  });

  // Ẩn/hiện nút chỉ dành cho user đã đăng nhập
  document.querySelectorAll(".userOnly").forEach(btn => {
    btn.style.display = currentUser ? "block" : "none";
  });

  // Ẩn nút đăng nhập/đăng ký khi đã login
  document.querySelectorAll(".guestOnly").forEach(btn => {
    btn.style.display = currentUser ? "none" : "block";
  });

  // Hiện nút đăng xuất khi đã login
  document.querySelectorAll(".logoutBtn").forEach(btn => {
    btn.style.display = currentUser ? "block" : "none";
  });

  // Lời chào
  if (welcome) {
    if (currentUser) {
      const roleLabel = currentUser.role === "admin" ? "Quản trị viên" : "Thành viên";
      welcome.innerHTML =
        `Xin chào <strong>${currentUser.name}</strong> (${roleLabel}) 👋`;
    } else {
      welcome.innerHTML =
        `Vui lòng <strong>đăng nhập</strong> để sử dụng hệ thống.`;
    }
  }
}

// ── KIỂM TRA QUYỀN TRUY CẬP (gọi trước khi vào trang admin) ─
function requireAdmin() {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    alert("🔒 Bạn không có quyền truy cập chức năng này!");
    if (typeof showPage === "function") showPage("home");
    return false;
  }
  return true;
}

function requireLogin() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert("🔒 Vui lòng đăng nhập để tiếp tục!");
    if (typeof showPage === "function") showPage("login");
    return false;
  }
  return true;
}

// ── KHỞI TẠO ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  updateUI();
});
