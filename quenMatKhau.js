async function sha256ForReset(text) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Inject nút "Quên mật khẩu?" vào trang login ──────────
function injectForgotPasswordLink() {
  const btnAuth = document.getElementById("btnAuth");
  if (!btnAuth || document.getElementById("forgotLink")) return;

  const link = document.createElement("p");
  link.id = "forgotLink";
  link.innerHTML = `<span onclick="openForgotModal()" style="
    color:#ff6a88; cursor:pointer; font-size:13px;
    text-decoration:underline;">
    🔑 Quên mật khẩu?
  </span>`;
  link.style.textAlign = "center";
  link.style.marginTop = "8px";

  btnAuth.parentNode.insertBefore(link, btnAuth.nextSibling);
}

// ── Mở modal quên mật khẩu ───────────────────────────────
function openForgotModal() {
  document.getElementById("forgotModal").style.display = "flex";
  // Reset về bước 1
  showForgotStep(1);
  clearForgotMsgs();
  document.getElementById("forgot_email").value    = "";
  document.getElementById("forgot_newpass").value  = "";
  document.getElementById("forgot_newpass2").value = "";
}

function closeForgotModal() {
  document.getElementById("forgotModal").style.display = "none";
}

// ── Chuyển bước ───────────────────────────────────────────
function showForgotStep(step) {
  document.getElementById("forgotStep1").style.display = step === 1 ? "block" : "none";
  document.getElementById("forgotStep2").style.display = step === 2 ? "block" : "none";
}

// ── Xóa thông báo lỗi ────────────────────────────────────
function clearForgotMsgs() {
  ["forgot_emailMsg", "forgot_passMsg"].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ""; el.style.display = "none"; }
  });
}

function setForgotMsg(elId, msg, isError = true) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = msg;
  el.style.color  = isError ? "#e74c3c" : "#27ae60";
  el.style.display = "block";
}

// ── Bước 1: Kiểm tra email ────────────────────────────────
function checkEmailForReset() {
  const email = document.getElementById("forgot_email").value.trim().toLowerCase();
  clearForgotMsgs();

  if (!email) { setForgotMsg("forgot_emailMsg", "❌ Vui lòng nhập email!"); return; }
  if (!email.includes("@")) { setForgotMsg("forgot_emailMsg", "❌ Email không hợp lệ!"); return; }

  // Ưu tiên tìm trong Firebase (window._users được expose bởi Giaodienquanlysukienclb.html)
  const firebaseUsers = (typeof window._users !== "undefined") ? window._users : [];
  const foundFB = firebaseUsers.find(u => (u.email || "").toLowerCase() === email);

  if (foundFB) {
    setForgotMsg("forgot_emailMsg", "✅ Đã xác nhận email!", false);
    setTimeout(() => showForgotStep(2), 800);
    return;
  }

  // Fallback: tìm trong localStorage
  const lsUsers = JSON.parse(localStorage.getItem("users") || "[]");
  const foundLS = lsUsers.find(u => (u.email || "").toLowerCase() === email);

  if (!foundLS) {
    setForgotMsg("forgot_emailMsg", "❌ Email này chưa được đăng ký!");
    return;
  }

  setForgotMsg("forgot_emailMsg", "✅ Đã xác nhận email!", false);
  setTimeout(() => showForgotStep(2), 800);
}

// ── Bước 2: Đặt mật khẩu mới ─────────────────────────────
async function resetPassword() {
  const email    = document.getElementById("forgot_email").value.trim().toLowerCase();
  const newPass  = document.getElementById("forgot_newpass").value;
  const newPass2 = document.getElementById("forgot_newpass2").value;
  clearForgotMsgs();

  if (!newPass || !newPass2) { setForgotMsg("forgot_passMsg", "❌ Vui lòng nhập đầy đủ!"); return; }
  if (newPass.length < 6) { setForgotMsg("forgot_passMsg", "❌ Mật khẩu phải có ít nhất 6 ký tự!"); return; }
  if (newPass !== newPass2) { setForgotMsg("forgot_passMsg", "❌ Mật khẩu xác nhận không khớp!"); return; }

  const passHash = await sha256ForReset(newPass);

  // Ưu tiên cập nhật Firebase
  const firebaseUsers = (typeof window._users !== "undefined") ? window._users : [];
  const fbUser = firebaseUsers.find(u => (u.email || "").toLowerCase() === email);
  const rolePath = fbUser && fbUser.role === "admin" ? "admins/" : "users/";
  if (fbUser && window._db && window._ref && window._update) {
    try {
      await window._update(window._ref(window._db, rolePath + fbUser.id), {
        pass    : newPass,
        passHash: passHash
      });
      setForgotMsg("forgot_passMsg", "✅ Đổi mật khẩu thành công!", false);
      setTimeout(() => {
        closeForgotModal();
        if (typeof window.showToast === "function") window.showToast("✅ Mật khẩu đã được cập nhật! Hãy đăng nhập lại.", "success");
      }, 1500);
      return;
    } catch(e) {
      console.error("Lỗi cập nhật Firebase:", e);
    }
  }

  // Fallback: cập nhật localStorage
  const lsUsers = JSON.parse(localStorage.getItem("users") || "[]");
  const idx = lsUsers.findIndex(u => (u.email || "").toLowerCase() === email);
  if (idx === -1) { setForgotMsg("forgot_passMsg", "❌ Không tìm thấy tài khoản!"); return; }

  lsUsers[idx].pass     = newPass;
  lsUsers[idx].passHash = passHash;
  localStorage.setItem("users", JSON.stringify(lsUsers));

  setForgotMsg("forgot_passMsg", "✅ Đổi mật khẩu thành công!", false);
  setTimeout(() => {
    closeForgotModal();
    if (typeof window.showToast === "function") window.showToast("✅ Mật khẩu đã được cập nhật! Hãy đăng nhập lại.", "success");
  }, 1500);
}

// ── Inject modal vào DOM ──────────────────────────────────
function injectForgotModal() {
  if (document.getElementById("forgotModal")) return;

  document.body.insertAdjacentHTML("beforeend", `
  <div id="forgotModal" style="
    display:none; position:fixed; top:0; left:0;
    width:100%; height:100%; background:rgba(0,0,0,0.5);
    z-index:99999; justify-content:center; align-items:center;">

    <div style="
      background:#fff; border-radius:24px; padding:32px 28px;
      width:90%; max-width:400px;
      box-shadow:0 20px 60px rgba(255,105,180,.35);
      animation: slideUp .4s ease both;">

      <!-- Header -->
      <div style="text-align:center; margin-bottom:20px;">
        <div style="
          width:56px; height:56px; border-radius:50%;
          background:linear-gradient(135deg,#ff6a88,#ffb6c1);
          display:flex; align-items:center; justify-content:center;
          font-size:26px; margin:0 auto 10px;">🔑</div>
        <h2 style="color:#e84393; font-family:'Quicksand',sans-serif; margin:0;">
          Quên mật khẩu
        </h2>
      </div>

      <!-- BƯỚC 1: Nhập email -->
      <div id="forgotStep1">
        <p style="font-size:13px; color:#888; margin-bottom:14px; text-align:center;">
          Nhập email đã đăng ký để xác nhận tài khoản
        </p>
        <div style="margin-bottom:12px;">
          <label style="font-size:13px; font-weight:700; color:#c0395e;">Email *</label>
          <input id="forgot_email" type="email" placeholder="example@gmail.com"
            style="width:100%; padding:12px; border:2px solid #ffe0ea;
                   border-radius:12px; margin-top:6px; outline:none;">
          <p id="forgot_emailMsg" style="font-size:12px; margin-top:6px; display:none;"></p>
        </div>
        <button onclick="checkEmailForReset()" style="
          width:100%; padding:13px;
          background:linear-gradient(135deg,#ff6a88,#e84393);
          color:#fff; border:none; border-radius:14px;
          font-weight:700; cursor:pointer; font-size:14px;">
          Xác nhận email →
        </button>
      </div>

      <!-- BƯỚC 2: Nhập mật khẩu mới -->
      <div id="forgotStep2" style="display:none;">
        <p style="font-size:13px; color:#888; margin-bottom:14px; text-align:center;">
          Nhập mật khẩu mới cho tài khoản
        </p>
        <div style="margin-bottom:12px;">
          <label style="font-size:13px; font-weight:700; color:#c0395e;">Mật khẩu mới *</label>
          <input id="forgot_newpass" type="password" placeholder="Tối thiểu 6 ký tự"
            style="width:100%; padding:12px; border:2px solid #ffe0ea;
                   border-radius:12px; margin-top:6px; outline:none;">
        </div>
        <div style="margin-bottom:12px;">
          <label style="font-size:13px; font-weight:700; color:#c0395e;">Xác nhận mật khẩu *</label>
          <input id="forgot_newpass2" type="password" placeholder="Nhập lại mật khẩu"
            style="width:100%; padding:12px; border:2px solid #ffe0ea;
                   border-radius:12px; margin-top:6px; outline:none;">
          <p id="forgot_passMsg" style="font-size:12px; margin-top:6px; display:none;"></p>
        </div>
        <button onclick="resetPassword()" style="
          width:100%; padding:13px;
          background:linear-gradient(135deg,#ff6a88,#e84393);
          color:#fff; border:none; border-radius:14px;
          font-weight:700; cursor:pointer; font-size:14px;">
          💾 Đặt lại mật khẩu
        </button>
        <p style="text-align:center; margin-top:10px;">
          <span onclick="showForgotStep(1)"
            style="font-size:12px; color:#aaa; cursor:pointer;">
            ← Quay lại
          </span>
        </p>
      </div>

      <!-- Đóng modal -->
      <p style="text-align:center; margin-top:14px;">
        <span onclick="closeForgotModal()"
          style="font-size:12px; color:#aaa; cursor:pointer;">
          Hủy bỏ ✕
        </span>
      </p>

    </div>
  </div>

  <style>
    @keyframes slideUp {
      from { opacity:0; transform:translateY(30px); }
      to   { opacity:1; transform:translateY(0); }
    }
  </style>`);
}

// ── Khởi chạy ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  injectForgotModal();

  // Hook vào go() để inject nút khi vào trang login
  const _origGo = window.go;
  if (typeof _origGo === "function") {
    window.go = function(id) {
      _origGo(id);
      if (id === "login") {
        setTimeout(injectForgotPasswordLink, 100);
      }
    };
  }

  // Inject ngay nếu đang ở trang login
  if (document.getElementById("btnAuth")) {
    injectForgotPasswordLink();
  }
});
