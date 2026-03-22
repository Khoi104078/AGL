// SCRUM-30: Quản lý chi tiêu / Ngân sách sự kiện
// Mô tả: Trưởng BTC / Admin tạo và quản lý ngân sách
//        cho từng sự kiện. Thành viên thường chỉ xem.

// -------------------------------------------------------
// 1. LẤY DỮ LIỆU TỪ LOCALSTORAGE
// -------------------------------------------------------
function getBudgets() {
  return JSON.parse(localStorage.getItem("budgets") || "[]");
}

function saveBudgets(budgets) {
  localStorage.setItem("budgets", JSON.stringify(budgets));
}

function getEventsForBudget() {
  return JSON.parse(localStorage.getItem("events") || "[]");
}

function getCurrentUserForBudget() {
  return JSON.parse(localStorage.getItem("currentUser") || "null");
}

function isAdminForBudget() {
  const user = getCurrentUserForBudget();
  return user && user.role === "admin";
}

// -------------------------------------------------------
// 2. RENDER TRANG QUẢN LÝ CHI TIÊU
// -------------------------------------------------------
function renderBudgetPage() {
  const events = getEventsForBudget();
  const budgets = getBudgets();
  const isAdmin = isAdminForBudget();

  const container = document.getElementById("budgetPage");
  if (!container) return;

  // Nút Tạo ngân sách chỉ hiện với admin
  const createBtn = isAdmin
    ? `<button onclick="openBudgetModal()" style="
        padding: 10px 20px;
        background: linear-gradient(135deg,#ff6a88,#e84393);
        color: #fff; border: none; border-radius: 12px;
        font-weight: 700; cursor: pointer; margin-bottom: 15px;">
        💰 Tạo ngân sách mới
      </button>`
    : `<p style="color:#aaa; font-size:13px; margin-bottom:15px;">
        Bạn chỉ có quyền xem ngân sách.
      </p>`;

  // Hiển thị danh sách ngân sách
  let budgetRows = "";
  if (budgets.length === 0) {
    budgetRows = `
      <tr>
        <td colspan="6" style="text-align:center; color:#aaa; padding:20px;">
          Chưa có ngân sách nào. Hãy tạo mới!
        </td>
      </tr>`;
  } else {
    budgets.forEach((b, i) => {
      const trangThai = `<span style="
        background: #2ecc71; color: #fff;
        padding: 3px 10px; border-radius: 20px;
        font-size: 12px; font-weight: 700;">
        ${b.trangThai}
      </span>`;

      const actionBtn = isAdmin
        ? `<button class="btn-edit" onclick="openEditBudgetModal(${i})" style="margin-right:5px;">✏️ Sửa</button>
           <button class="btn-del" onclick="deleteBudget(${i})">🗑️</button>`
        : `<span style="color:#aaa; font-size:12px;">Chỉ xem</span>`;

      budgetRows += `
        <tr>
          <td>${b.tenSuKien}</td>
          <td>${Number(b.tongNganSach).toLocaleString("vi-VN")} đ</td>
          <td>${b.tuNgay}</td>
          <td>${b.denNgay}</td>
          <td>${trangThai}</td>
          <td>${actionBtn}</td>
        </tr>`;
    });
  }

  container.innerHTML = `
    <div class="card" style="max-width: 900px;">
      <h2>💰 Quản lý ngân sách sự kiện</h2>
      ${createBtn}
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Sự kiện</th>
              <th>Tổng ngân sách</th>
              <th>Từ ngày</th>
              <th>Đến ngày</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>${budgetRows}</tbody>
        </table>
      </div>
    </div>`;
}

// -------------------------------------------------------
// 3. MỞ MODAL TẠO NGÂN SÁCH MỚI
// -------------------------------------------------------
function openBudgetModal() {
  if (!isAdminForBudget()) {
    showToast("Bạn không có quyền tạo ngân sách!", "error");
    return;
  }

  // Reset form
  document.getElementById("budget_index").value = "";
  document.getElementById("budget_tenSuKien").value = "";
  document.getElementById("budget_tongNganSach").value = "";
  document.getElementById("budget_tuNgay").value = "";
  document.getElementById("budget_denNgay").value = "";
  clearBudgetErrors();

  // Cập nhật dropdown sự kiện
  updateBudgetEventDropdown();

  document.getElementById("budgetModalTitle").innerText = "💰 Tạo ngân sách mới";
  document.getElementById("budgetModal").style.display = "flex";
}

// -------------------------------------------------------
// 4. MỞ MODAL CHỈNH SỬA NGÂN SÁCH
// -------------------------------------------------------
function openEditBudgetModal(index) {
  if (!isAdminForBudget()) {
    showToast("Bạn không có quyền chỉnh sửa!", "error");
    return;
  }

  const budgets = getBudgets();
  const b = budgets[index];
  if (!b) return;

  document.getElementById("budget_index").value = index;
  document.getElementById("budget_tongNganSach").value = b.tongNganSach;
  document.getElementById("budget_tuNgay").value = b.tuNgay;
  document.getElementById("budget_denNgay").value = b.denNgay;
  clearBudgetErrors();

  updateBudgetEventDropdown(b.tenSuKien);

  document.getElementById("budgetModalTitle").innerText = "✏️ Chỉnh sửa ngân sách";
  document.getElementById("budgetModal").style.display = "flex";
}

// -------------------------------------------------------
// 5. CẬP NHẬT DROPDOWN SỰ KIỆN
// -------------------------------------------------------
function updateBudgetEventDropdown(selectedEvent = "") {
  const events = getEventsForBudget();
  const select = document.getElementById("budget_tenSuKien");

  if (events.length === 0) {
    select.innerHTML = `<option value="">-- Chưa có sự kiện nào --</option>`;
    return;
  }

  select.innerHTML = events.map(e =>
    `<option value="${e.t}" ${e.t === selectedEvent ? "selected" : ""}>${e.t}</option>`
  ).join("");
}

// -------------------------------------------------------
// 6. ĐÓNG MODAL
// -------------------------------------------------------
function closeBudgetModal() {
  document.getElementById("budgetModal").style.display = "none";
  clearBudgetErrors();
}

// -------------------------------------------------------
// 7. VALIDATE FORM NGÂN SÁCH
// -------------------------------------------------------
function validateBudgetForm() {
  let valid = true;
  clearBudgetErrors();

  const tenSuKien = document.getElementById("budget_tenSuKien").value;
  const tongNganSach = document.getElementById("budget_tongNganSach").value;
  const tuNgay = document.getElementById("budget_tuNgay").value;
  const denNgay = document.getElementById("budget_denNgay").value;

  if (!tenSuKien) {
    showBudgetError("budget_tenSuKien", "budget_tenSuKienErr", "Vui lòng chọn sự kiện!");
    valid = false;
  }

  if (!tongNganSach || parseFloat(tongNganSach) <= 0) {
    showBudgetError("budget_tongNganSach", "budget_tongNganSachErr", "Vui lòng nhập ngân sách hợp lệ!");
    valid = false;
  }

 if (!tuNgay) {
    showBudgetError("budget_tuNgay", "budget_tuNgayErr", "Vui lòng chọn ngày bắt đầu!");
    valid = false;
  } else {
    const today = new Date().toISOString().split("T")[0];
    if (tuNgay < today) {
      showBudgetError("budget_tuNgay", "budget_tuNgayErr", "Ngày bắt đầu không được trong quá khứ!");
      valid = false;
    }
  }

  if (!denNgay) {
    showBudgetError("budget_denNgay", "budget_denNgayErr", "Vui lòng chọn ngày kết thúc!");
    valid = false;
  }

  if (tuNgay && denNgay && denNgay < tuNgay) {
    showBudgetError("budget_denNgay", "budget_denNgayErr", "Ngày kết thúc phải sau ngày bắt đầu!");
    valid = false;
  }

  return valid;
}

function showBudgetError(inputId, errId, msg) {
  const input = document.getElementById(inputId);
  const err = document.getElementById(errId);
  if (input) input.classList.add("error");
  if (err) { err.innerText = msg; err.classList.add("show"); }
}

function clearBudgetErrors() {
  ["budget_tenSuKien", "budget_tongNganSach", "budget_tuNgay", "budget_denNgay"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("error");
  });
  ["budget_tenSuKienErr", "budget_tongNganSachErr", "budget_tuNgayErr", "budget_denNgayErr"].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.remove("show"); el.innerText = ""; }
  });
}

// -------------------------------------------------------
// 8. LƯU NGÂN SÁCH
// -------------------------------------------------------
function saveBudget() {
  if (!isAdminForBudget()) {
    showToast("Bạn không có quyền thực hiện!", "error");
    return;
  }

  if (!validateBudgetForm()) return;

  const budgets = getBudgets();
  const index = document.getElementById("budget_index").value;

  const newBudget = {
    tenSuKien: document.getElementById("budget_tenSuKien").value,
    tongNganSach: parseFloat(document.getElementById("budget_tongNganSach").value),
    tuNgay: document.getElementById("budget_tuNgay").value,
    denNgay: document.getElementById("budget_denNgay").value,
    trangThai: "Đang hoạt động"
  };

  if (index === "") {
    // Tạo mới
    budgets.push(newBudget);
    showToast("✅ Tạo ngân sách thành công!");
  } else {
    // Chỉnh sửa
    budgets[parseInt(index)] = newBudget;
    showToast("✅ Cập nhật ngân sách thành công!");
  }

  saveBudgets(budgets);
  closeBudgetModal();
  renderBudgetPage();
}

// -------------------------------------------------------
// 9. XÓA NGÂN SÁCH
// -------------------------------------------------------
function deleteBudget(index) {
  if (!isAdminForBudget()) {
    showToast("Bạn không có quyền xóa!", "error");
    return;
  }

  if (confirm("Bạn có chắc muốn xóa ngân sách này?")) {
    const budgets = getBudgets();
    budgets.splice(index, 1);
    saveBudgets(budgets);
    renderBudgetPage();
    showToast("🗑️ Đã xóa ngân sách!");
  }
}

// -------------------------------------------------------
// 10. INJECT HTML MODAL + TRANG VÀO DOM
// -------------------------------------------------------
function injectBudgetPage() {
  // Thêm menu item
  const menu = document.getElementById("menu");
  if (menu && !document.getElementById("menuBudget")) {
    const btn = document.createElement("button");
    btn.id = "menuBudget";
    btn.className = "adminOnly";
    btn.setAttribute("onclick", "go('budget')");
    btn.innerHTML = "💰 Quản lý ngân sách";
    menu.insertBefore(btn, menu.children[3]);
  }

  // Thêm trang budget vào body
  if (!document.getElementById("budget")) {
    const page = document.createElement("div");
    page.id = "budget";
    page.className = "page";
    page.innerHTML = `<div id="budgetPage"></div>`;
    document.body.appendChild(page);
  }

  // Thêm modal tạo/sửa ngân sách
  if (!document.getElementById("budgetModal")) {
    document.body.insertAdjacentHTML("beforeend", `
    <div id="budgetModal" style="
      display:none; position:fixed; top:0; left:0;
      width:100%; height:100%; background:rgba(0,0,0,0.5);
      z-index:9999; justify-content:center; align-items:center;">

      <div style="
        background:#fff; border-radius:24px; padding:30px;
        width:90%; max-width:500px; max-height:90vh;
        overflow-y:auto; position:relative;
        box-shadow: 0 16px 48px rgba(255,105,180,.3);">

        <h2 id="budgetModalTitle" style="text-align:center; color:#e84393; font-family:'Quicksand'; margin-bottom:20px;">
          💰 Tạo ngân sách mới
        </h2>

        <input type="hidden" id="budget_index">

        <!-- Chọn sự kiện -->
        <div class="form-group">
          <label>Chọn sự kiện <span class="required">*</span></label>
          <select id="budget_tenSuKien"></select>
          <div class="err-msg" id="budget_tenSuKienErr"></div>
        </div>

        <!-- Tổng ngân sách -->
        <div class="form-group">
          <label>Tổng ngân sách dự kiến (VNĐ) <span class="required">*</span></label>
          <input id="budget_tongNganSach" type="number" min="1" placeholder="VD: 5000000">
          <div class="err-msg" id="budget_tongNganSachErr"></div>
        </div>

        <!-- Thời gian áp dụng -->
        <div class="form-row">
          <div class="form-group">
            <label>Từ ngày <span class="required">*</span></label>
            <input id="budget_tuNgay" type="date">
            <div class="err-msg" id="budget_tuNgayErr"></div>
          </div>
          <div class="form-group">
            <label>Đến ngày <span class="required">*</span></label>
            <input id="budget_denNgay" type="date">
            <div class="err-msg" id="budget_denNgayErr"></div>
          </div>
        </div>

        <!-- Buttons -->
        <div style="display:flex; gap:10px; margin-top:10px;">
          <button class="main" onclick="saveBudget()" style="flex:1;">
            💾 Lưu ngân sách
          </button>
          <button onclick="closeBudgetModal()" style="
            flex:1; padding:13px; border:2px solid #ff6a88;
            background:#fff; color:#ff6a88; border-radius:14px;
            font-weight:700; cursor:pointer;">
            ❌ Hủy
          </button>
        </div>

      </div>
    </div>`);
  }
}

// -------------------------------------------------------
// 11. GHI ĐÈ HÀM go() ĐỂ HỖ TRỢ TRANG BUDGET
// -------------------------------------------------------
const _originalGo = window.go;
window.go = function(id) {
  _originalGo(id);
  if (id === "budget") {
    renderBudgetPage();
  }
};

// -------------------------------------------------------
// 12. KHỞI CHẠY
// -------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
  injectBudgetPage();
});
