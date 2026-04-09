// ── Biến trạng thái ───────────────────────────────────────
let _budgetsCache = [];

// ── Hàm tiện ích ─────────────────────────────────────────
function _toast(msg, type) {
  if (typeof window.showToast === "function") window.showToast(msg, type || "success");
  else console.log(msg);
}

function isAdminForBudget() {
  try {
    const u = JSON.parse(localStorage.getItem("currentUser") || "null");
    return u?.role === "admin";
  } catch { return false; }
}

// ── Lấy dữ liệu ──────────────────────────────────────────
// Ưu tiên cache Firebase, fallback localStorage
function getBudgets() {
  // Nếu FS đã ready dùng FS.getBudgets()
  if (window.FS && typeof window.FS.getBudgets === "function") {
    _budgetsCache = window.FS.getBudgets();
    return _budgetsCache;
  }
  // Fallback localStorage
  return JSON.parse(localStorage.getItem("budgets") || "[]");
}

function getEventsForBudget() {
  if (window.FS && typeof window.FS.getEvents === "function") return window.FS.getEvents();
  return JSON.parse(localStorage.getItem("events") || "[]");
}

// ── RENDER TRANG ─────────────────────────────────────────
function renderBudgetPage() {
  const budgets = getBudgets();
  const events  = getEventsForBudget();
  const isAdmin = isAdminForBudget();
  const container = document.getElementById("budgetPage");
  if (!container) return;

  const createBtn = isAdmin
    ? `<button onclick="openBudgetModal()" style="padding:10px 20px;background:linear-gradient(135deg,#ff6a88,#e84393);color:#fff;border:none;border-radius:12px;font-weight:700;cursor:pointer;margin-bottom:15px;">💰 Tạo ngân sách mới</button>`
    : `<p style="color:#aaa;font-size:13px;margin-bottom:15px;">Bạn chỉ có quyền xem ngân sách.</p>`;

  let rows = "";
  if (!budgets.length) {
    rows = `<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">Chưa có ngân sách nào. Hãy tạo mới!</td></tr>`;
  } else {
    budgets.forEach(b => {
      const badge = `<span style="background:#2ecc71;color:#fff;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;">${b.trangThai||"Đang hoạt động"}</span>`;
      const act   = isAdmin
        ? `<button class="btn-edit" onclick="openEditBudgetModal('${b.id}')" style="margin-right:5px;">✏️ Sửa</button>
           <button class="btn-del"  onclick="deleteBudget('${b.id}')">🗑️</button>`
        : `<span style="color:#aaa;font-size:12px;">Chỉ xem</span>`;
      rows += `
        <tr>
          <td>${b.tenSuKien||""}</td>
          <td>${Number(b.tongNganSach||0).toLocaleString("vi-VN")} đ</td>
          <td>${b.tuNgay||""}</td>
          <td>${b.denNgay||""}</td>
          <td>${badge}</td>
          <td>${act}</td>
        </tr>`;
    });
  }

  container.innerHTML = `
    <div class="card" style="max-width:900px;">
      <h2>💰 Quản lý ngân sách sự kiện</h2>
      ${createBtn}
      <div class="table-container">
        <table>
          <thead>
            <tr><th>Sự kiện</th><th>Tổng ngân sách</th><th>Từ ngày</th><th>Đến ngày</th><th>Trạng thái</th><th>Hành động</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

// ── MỞ MODAL TẠO ─────────────────────────────────────────
function openBudgetModal() {
  if (!isAdminForBudget()) { _toast("Bạn không có quyền tạo ngân sách!", "error"); return; }
  document.getElementById("budget_id").value         = "";
  document.getElementById("budget_tongNganSach").value= "";
  document.getElementById("budget_tuNgay").value     = "";
  document.getElementById("budget_denNgay").value    = "";
  clearBudgetErrors();
  updateBudgetEventDropdown();
  document.getElementById("budgetModalTitle").innerText = "💰 Tạo ngân sách mới";
  document.getElementById("budgetModal").style.display = "flex";
}

// ── MỞ MODAL SỬA (nhận Firebase ID thay vì index) ────────
function openEditBudgetModal(firebaseId) {
  if (!isAdminForBudget()) { _toast("Bạn không có quyền chỉnh sửa!", "error"); return; }
  const budgets = getBudgets();
  const b = budgets.find(x => x.id === firebaseId);
  if (!b) return;
  document.getElementById("budget_id").value          = firebaseId;
  document.getElementById("budget_tongNganSach").value = b.tongNganSach || "";
  document.getElementById("budget_tuNgay").value       = b.tuNgay  || "";
  document.getElementById("budget_denNgay").value      = b.denNgay || "";
  clearBudgetErrors();
  updateBudgetEventDropdown(b.tenSuKien);
  document.getElementById("budgetModalTitle").innerText = "✏️ Chỉnh sửa ngân sách";
  document.getElementById("budgetModal").style.display = "flex";
}

// ── DROPDOWN SỰ KIỆN ─────────────────────────────────────
function updateBudgetEventDropdown(selectedEvent = "") {
  const events = getEventsForBudget();
  const select = document.getElementById("budget_tenSuKien");
  if (!select) return;
  if (!events.length) {
    select.innerHTML = `<option value="">-- Chưa có sự kiện nào --</option>`; return;
  }
  select.innerHTML = events.map(e =>
    `<option value="${e.t}" ${e.t === selectedEvent ? "selected" : ""}>${e.t}</option>`
  ).join("");
}

// ── ĐÓNG MODAL ───────────────────────────────────────────
function closeBudgetModal() {
  document.getElementById("budgetModal").style.display = "none";
  clearBudgetErrors();
}

// ── VALIDATE ─────────────────────────────────────────────
function validateBudgetForm() {
  let valid = true;
  clearBudgetErrors();
  const ten   = document.getElementById("budget_tenSuKien").value;
  const tong  = document.getElementById("budget_tongNganSach").value;
  const tuNgay= document.getElementById("budget_tuNgay").value;
  const den   = document.getElementById("budget_denNgay").value;

  if (!ten)  { showBE("budget_tenSuKien","budget_tenSuKienErr","Vui lòng chọn sự kiện!"); valid=false; }
  if (!tong || parseFloat(tong) <= 0) { showBE("budget_tongNganSach","budget_tongNganSachErr","Vui lòng nhập ngân sách hợp lệ!"); valid=false; }
  if (!tuNgay){ showBE("budget_tuNgay","budget_tuNgayErr","Vui lòng chọn ngày bắt đầu!"); valid=false; }
  if (!den)  { showBE("budget_denNgay","budget_denNgayErr","Vui lòng chọn ngày kết thúc!"); valid=false; }
  if (tuNgay && den && den < tuNgay) { showBE("budget_denNgay","budget_denNgayErr","Ngày kết thúc phải sau ngày bắt đầu!"); valid=false; }
  return valid;
}

function showBE(inp, err, msg) {
  document.getElementById(inp)?.classList.add("error");
  const el = document.getElementById(err);
  if (el) { el.innerText = msg; el.classList.add("show"); }
}

function clearBudgetErrors() {
  ["budget_tenSuKien","budget_tongNganSach","budget_tuNgay","budget_denNgay"]
    .forEach(id => document.getElementById(id)?.classList.remove("error"));
  ["budget_tenSuKienErr","budget_tongNganSachErr","budget_tuNgayErr","budget_denNgayErr"]
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.classList.remove("show"); el.innerText = ""; }
    });
}

// ── LƯU NGÂN SÁCH (Firebase) ─────────────────────────────
async function saveBudget() {
  if (!isAdminForBudget()) { _toast("Bạn không có quyền thực hiện!", "error"); return; }
  if (!validateBudgetForm()) return;

  const firebaseId  = document.getElementById("budget_id").value;
  const tenSuKien   = document.getElementById("budget_tenSuKien").value;
  const tongNganSach= parseFloat(document.getElementById("budget_tongNganSach").value);
  const tuNgay      = document.getElementById("budget_tuNgay").value;
  const denNgay     = document.getElementById("budget_denNgay").value;
  const data = { tenSuKien, tongNganSach, tuNgay, denNgay, trangThai:"Đang hoạt động" };

  try {
    if (firebaseId && window.FS) {
      // Cập nhật Firebase
      await window.FS.updateBudget(firebaseId, data);
      _toast("✅ Cập nhật ngân sách thành công!");
    } else if (window.FS) {
      // Tạo mới trên Firebase
      data.createdAt = new Date().toISOString();
      await window.FS.addBudget(data);
      _toast("✅ Tạo ngân sách thành công!");
    } else {
      // Fallback localStorage
      const budgets = JSON.parse(localStorage.getItem("budgets") || "[]");
      if (firebaseId) {
        const idx = budgets.findIndex(b => b.id === firebaseId);
        if (idx !== -1) budgets[idx] = { ...budgets[idx], ...data };
      } else {
        budgets.push({ ...data, id: "local_" + Date.now() });
      }
      localStorage.setItem("budgets", JSON.stringify(budgets));
      _toast("✅ Lưu ngân sách thành công!");
    }
  } catch(e) {
    _toast("❌ Lỗi lưu ngân sách: " + e.message, "error"); return;
  }

  closeBudgetModal();
  renderBudgetPage();
}

// ── XÓA NGÂN SÁCH ────────────────────────────────────────
async function deleteBudget(firebaseId) {
  if (!isAdminForBudget()) { _toast("Bạn không có quyền xóa!", "error"); return; }
  if (!confirm("Xóa ngân sách này?")) return;

  try {
    if (window.FS) {
      await window.FS.deleteBudget(firebaseId);
    } else {
      const budgets = JSON.parse(localStorage.getItem("budgets") || "[]").filter(b => b.id !== firebaseId);
      localStorage.setItem("budgets", JSON.stringify(budgets));
    }
    _toast("🗑️ Đã xóa ngân sách!");
  } catch(e) {
    _toast("❌ Lỗi xóa: " + e.message, "error");
  }
  renderBudgetPage();
}

// ── INJECT HTML ───────────────────────────────────────────
function injectBudgetPage() {
  // Trang budget đã có trong HTML chính rồi, không cần tạo lại
  // Chỉ inject modal nếu chưa có
  if (document.getElementById("budgetModal")) return;

  document.body.insertAdjacentHTML("beforeend", `
  <div id="budgetModal" style="
    display:none;position:fixed;top:0;left:0;
    width:100%;height:100%;background:rgba(0,0,0,0.5);
    z-index:9999;justify-content:center;align-items:center;">
    <div style="
      background:#fff;border-radius:24px;padding:30px;
      width:90%;max-width:500px;max-height:90vh;
      overflow-y:auto;box-shadow:0 16px 48px rgba(255,105,180,.3);">
      <h2 id="budgetModalTitle" style="text-align:center;color:#e84393;font-family:'Quicksand';margin-bottom:20px;">💰 Tạo ngân sách mới</h2>
      <input type="hidden" id="budget_id">
      <div class="form-group">
        <label>Chọn sự kiện <span style="color:#ff4d88">*</span></label>
        <select id="budget_tenSuKien"></select>
        <div class="err-msg" id="budget_tenSuKienErr"></div>
      </div>
      <div class="form-group">
        <label>Tổng ngân sách dự kiến (VNĐ) <span style="color:#ff4d88">*</span></label>
        <input id="budget_tongNganSach" type="number" min="1" placeholder="VD: 5000000">
        <div class="err-msg" id="budget_tongNganSachErr"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group">
          <label>Từ ngày <span style="color:#ff4d88">*</span></label>
          <input id="budget_tuNgay" type="date">
          <div class="err-msg" id="budget_tuNgayErr"></div>
        </div>
        <div class="form-group">
          <label>Đến ngày <span style="color:#ff4d88">*</span></label>
          <input id="budget_denNgay" type="date">
          <div class="err-msg" id="budget_denNgayErr"></div>
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-top:10px;">
        <button onclick="saveBudget()" style="flex:1;padding:13px;background:linear-gradient(135deg,#ff6a88,#e84393);color:#fff;border:none;border-radius:14px;font-weight:700;cursor:pointer;">💾 Lưu ngân sách</button>
        <button onclick="closeBudgetModal()" style="flex:1;padding:13px;border:2px solid #ff6a88;background:#fff;color:#ff6a88;border-radius:14px;font-weight:700;cursor:pointer;">❌ Hủy</button>
      </div>
    </div>
  </div>`);
}

// ── KHỞI CHẠY ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function() {
  injectBudgetPage();

  // Lắng nghe thay đổi budgets từ Firebase realtime
  window.addEventListener("fs:budgets", () => {
    const budgetPage = document.getElementById("budget");
    if (budgetPage && budgetPage.style.display !== "none") renderBudgetPage();
  });

  // FIX: Hook window.go sau khi module đã expose nó
  // Dùng MutationObserver-style polling nhẹ để đảm bảo window.go sẵn sàng
  let _hookAttempts = 0;
  function _tryHookGo() {
    if (typeof window.go === "function") {
      const _origGo = window.go;
      window.go = function(id) {
        _origGo(id);
        if (id === "budget") setTimeout(renderBudgetPage, 50);
      };
    } else if (_hookAttempts++ < 20) {
      setTimeout(_tryHookGo, 100);
    }
  }
  _tryHookGo();
});