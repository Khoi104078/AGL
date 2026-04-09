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
function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser")) || null;
}

// ── ĐĂNG KÝ (Lưu chia 2 nhánh) ──────────────────────────────────────────
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

  await window.FS.ready;

  // Lấy TOÀN BỘ tài khoản (gồm cả admin và user) để check trùng Email
  const allAccounts = window.FS.getAllAccounts();

  if (allAccounts.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    setMsg(msgId, "❌ Email này đã được đăng ký trên hệ thống!");
    return;
  }

  const passHash = await sha256(pass);
  const newUser = { name, email, passHash, role };

  try {
    // 🔥 QUYẾT ĐỊNH NHÁNH LƯU DỰA VÀO ROLE
    const nodeName = (role === "admin") ? "admins" : "users";
    
    // Đẩy lên Firebase theo đúng node
    await window.FS.push(window.FS.ref(window.FS.db, nodeName), newUser);
    
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
  } catch (error) {
    console.error("Lỗi khi đăng ký:", error);
    setMsg(msgId, "❌ Có lỗi xảy ra khi lưu vào hệ thống!");
  }
}

// ── ĐĂNG NHẬP (Tìm trên cả 2 nhánh) ────────────────────────────────────────
async function login() {
  const email = document.getElementById("login_email")?.value.trim();
  const pass  = document.getElementById("login_pass")?.value;
  const msgId = "login_msg";

  clearMsg(msgId);

  if (!email || !pass) {
    setMsg(msgId, "❌ Vui lòng nhập email và mật khẩu!");
    return;
  }

  await window.FS.ready;

  // Lấy cả 2 danh sách ghép lại để tìm kiếm
  const allAccounts = window.FS.getAllAccounts();
  const passHash = await sha256(pass);

  // Tìm tài khoản khớp email + passHash
  const found = allAccounts.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passHash === passHash);

  if (!found) {
    setMsg(msgId, "❌ Email hoặc mật khẩu không đúng!");
    return;
  }

  // Lưu currentUser vào localStorage để duy trì đăng nhập trên trình duyệt
  const currentUser = { id: found.id, name: found.name, email: found.email, role: found.role };
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  updateUI();
  clearMsg(msgId);

  document.getElementById("login_email").value = "";
  document.getElementById("login_pass").value  = "";

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
