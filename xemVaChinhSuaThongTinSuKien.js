// SCRUM-10: Xem / Chỉnh sửa thông tin sự kiện
// Mô tả: Quản trị viên có thể xem và chỉnh sửa chi tiết
//        sự kiện. Nút Chỉnh sửa chỉ hiển thị với admin.

// -------------------------------------------------------
// 1. LẤY DỮ LIỆU SỰ KIỆN TỪ LOCALSTORAGE
// -------------------------------------------------------
function getEvents() {
  return JSON.parse(localStorage.getItem("events") || "[]");
}

function saveEvents(events) {
  localStorage.setItem("events", JSON.stringify(events));
}

// -------------------------------------------------------
// 2. LẤY THÔNG TIN NGƯỜI DÙNG ĐANG ĐĂNG NHẬP
// -------------------------------------------------------
function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser") || "null");
}

function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === "admin";
}

// -------------------------------------------------------
// 3. RENDER DANH SÁCH SỰ KIỆN VÀO BẢNG
//    - Nút "Chỉnh sửa" chỉ hiện với admin
// -------------------------------------------------------
function renderEventsScrum10() {
  const events = getEvents();
  const tbody = document.getElementById("eventTable");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (events.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; color:#aaa; padding:20px;">
          Chưa có sự kiện nào. Hãy tạo sự kiện mới!
        </td>
      </tr>`;
    return;
  }

  events.forEach((e, i) => {
    const editBtn = isAdmin()
      ? `<button class="btn-edit" onclick="openEditModal(${i})">✏️ Sửa</button>`
      : `<span style="color:#aaa; font-size:12px;">Chỉ xem</span>`;

    tbody.innerHTML += `
      <tr>
        <td>${e.t || ""}</td>
        <td>${e.l || ""}</td>
        <td>${e.d || ""}</td>
        <td>${e.location || ""}</td>
        <td>${e.max || ""}</td>
        <td>
          ${editBtn}
          ${isAdmin() ? `<button class="btn-del" onclick="delEvent(${i})" style="margin-left:5px;">🗑️</button>` : ""}
        </td>
      </tr>`;
  });
}

// -------------------------------------------------------
// 4. MỞ MODAL CHỈNH SỬA SỰ KIỆN
// -------------------------------------------------------
function openEditModal(index) {
  if (!isAdmin()) {
    showToast("Bạn không có quyền chỉnh sửa sự kiện!", "error");
    return;
  }

  const events = getEvents();
  const e = events[index];
  if (!e) return;

  // Điền dữ liệu vào modal
  document.getElementById("edit_index").value = index;
  document.getElementById("edit_title").value = e.t || "";
  document.getElementById("edit_leader").value = e.l || "";
  document.getElementById("edit_date").value = e.d || "";
  document.getElementById("edit_time").value = e.time || "08:00";
  document.getElementById("edit_location").value = e.location || "";
  document.getElementById("edit_max").value = e.max || "";
  document.getElementById("edit_desc").value = e.desc || "";

  // Chọn trạng thái
  document.querySelectorAll(".edit-status-tag").forEach(tag => {
    tag.classList.remove("active");
    if (tag.dataset.val === e.status) tag.classList.add("active");
  });

  // Hiện modal
  document.getElementById("editModal").style.display = "flex";
}

// -------------------------------------------------------
// 5. ĐÓNG MODAL
// -------------------------------------------------------
function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
  clearEditErrors();
}

// -------------------------------------------------------
// 6. CHỌN TRẠNG THÁI TRONG MODAL CHỈNH SỬA
// -------------------------------------------------------
function selectEditStatus(el) {
  document.querySelectorAll(".edit-status-tag").forEach(t => t.classList.remove("active"));
  el.classList.add("active");
}

// -------------------------------------------------------
// 7. VALIDATE DỮ LIỆU TRƯỚC KHI LƯU
// -------------------------------------------------------
function validateEditForm() {
  let valid = true;
  clearEditErrors();

  const title = document.getElementById("edit_title").value.trim();
  const leader = document.getElementById("edit_leader").value.trim();
  const date = document.getElementById("edit_date").value;
  const location = document.getElementById("edit_location").value.trim();
  const max = document.getElementById("edit_max").value;

  if (!title) {
    showEditError("edit_title", "edit_titleErr", "Vui lòng nhập tên sự kiện!");
    valid = false;
  }

  if (!leader) {
    showEditError("edit_leader", "edit_leaderErr", "Vui lòng nhập người phụ trách!");
    valid = false;
  }

  if (!date) {
    showEditError("edit_date", "edit_dateErr", "Vui lòng chọn ngày diễn ra!");
    valid = false;
  } else {
    // Kiểm tra ngày không được trong quá khứ
    const today = new Date().toISOString().split("T")[0];
    if (date < today) {
      showEditError("edit_date", "edit_dateErr", "Ngày diễn ra không được trong quá khứ!");
      valid = false;
    }
  }

  if (!location) {
    showEditError("edit_location", "edit_locationErr", "Vui lòng nhập địa điểm!");
    valid = false;
  }

  if (!max || parseInt(max) < 1) {
    showEditError("edit_max", "edit_maxErr", "Số lượng phải lớn hơn 0!");
    valid = false;
  }

  return valid;
}

function showEditError(inputId, errId, msg) {
  document.getElementById(inputId).classList.add("error");
  const err = document.getElementById(errId);
  err.innerText = msg;
  err.classList.add("show");
}

function clearEditErrors() {
  const errIds = ["edit_titleErr", "edit_leaderErr", "edit_dateErr", "edit_locationErr", "edit_maxErr"];
  const inputIds = ["edit_title", "edit_leader", "edit_date", "edit_location", "edit_max"];
  errIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.remove("show"); el.innerText = ""; }
  });
  inputIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("error");
  });
}

// -------------------------------------------------------
// 8. LƯU THAY ĐỔI SỰ KIỆN
// -------------------------------------------------------
function saveEditEvent() {
  if (!isAdmin()) {
    showToast("Bạn không có quyền chỉnh sửa!", "error");
    return;
  }

  if (!validateEditForm()) return;

  const index = parseInt(document.getElementById("edit_index").value);
  const events = getEvents();

  const activeStatus = document.querySelector(".edit-status-tag.active");

  events[index] = {
    t: document.getElementById("edit_title").value.trim(),
    l: document.getElementById("edit_leader").value.trim(),
    d: document.getElementById("edit_date").value,
    time: document.getElementById("edit_time").value,
    location: document.getElementById("edit_location").value.trim(),
    max: parseInt(document.getElementById("edit_max").value),
    desc: document.getElementById("edit_desc").value.trim(),
    status: activeStatus ? activeStatus.dataset.val : "Mở"
  };

  saveEvents(events);
  closeEditModal();
  renderEventsScrum10();
  showToast("✅ Cập nhật sự kiện thành công!");
}

// -------------------------------------------------------
// 9. HTML CỦA MODAL CHỈNH SỬA - CHÈN VÀO TRANG
// -------------------------------------------------------
function injectEditModal() {
  const modalHTML = `
  <div id="editModal" style="
    display:none; position:fixed; top:0; left:0;
    width:100%; height:100%; background:rgba(0,0,0,0.5);
    z-index:9999; justify-content:center; align-items:center;">

    <div style="
      background:#fff; border-radius:24px; padding:30px;
      width:90%; max-width:520px; max-height:90vh;
      overflow-y:auto; position:relative;
      box-shadow: 0 16px 48px rgba(255,105,180,.3);">

      <h2 style="text-align:center; color:#e84393; font-family:'Quicksand'; margin-bottom:20px;">
        ✏️ Chỉnh sửa sự kiện
      </h2>

      <input type="hidden" id="edit_index">

      <!-- Tên sự kiện -->
      <div class="form-group">
        <label>Tên sự kiện <span class="required">*</span></label>
        <input id="edit_title" type="text" placeholder="Tên sự kiện..." maxlength="100">
        <div class="err-msg" id="edit_titleErr"></div>
      </div>

      <!-- Người phụ trách -->
      <div class="form-group">
        <label>Người phụ trách <span class="required">*</span></label>
        <input id="edit_leader" type="text" placeholder="Họ và tên...">
        <div class="err-msg" id="edit_leaderErr"></div>
      </div>

      <!-- Ngày & Giờ -->
      <div class="form-row">
        <div class="form-group">
          <label>Ngày diễn ra <span class="required">*</span></label>
          <input id="edit_date" type="date">
          <div class="err-msg" id="edit_dateErr"></div>
        </div>
        <div class="form-group">
          <label>Giờ bắt đầu</label>
          <input id="edit_time" type="time">
        </div>
      </div>

      <!-- Địa điểm & Số lượng -->
      <div class="form-row">
        <div class="form-group">
          <label>Địa điểm <span class="required">*</span></label>
          <input id="edit_location" type="text" placeholder="VD: Hội trường A">
          <div class="err-msg" id="edit_locationErr"></div>
        </div>
        <div class="form-group">
          <label>Số lượng tối đa <span class="required">*</span></label>
          <input id="edit_max" type="number" min="1" placeholder="VD: 50">
          <div class="err-msg" id="edit_maxErr"></div>
        </div>
      </div>

      <!-- Trạng thái -->
      <div class="form-group">
        <label>Trạng thái</label>
        <div class="status-options">
          <div class="status-tag edit-status-tag active" data-val="Mở" onclick="selectEditStatus(this)">🟢 Mở</div>
          <div class="status-tag edit-status-tag" data-val="Sắp mở" onclick="selectEditStatus(this)">🟡 Sắp mở</div>
          <div class="status-tag edit-status-tag" data-val="Đóng" onclick="selectEditStatus(this)">🔴 Đóng</div>
        </div>
      </div>

      <!-- Mô tả -->
      <div class="form-group">
        <label>Mô tả sự kiện</label>
        <textarea id="edit_desc" placeholder="Mô tả ngắn..." maxlength="300"></textarea>
      </div>

      <!-- Buttons -->
      <div style="display:flex; gap:10px; margin-top:10px;">
        <button class="main" onclick="saveEditEvent()" style="flex:1;">
          💾 Lưu thay đổi
        </button>
        <button onclick="closeEditModal()" style="
          flex:1; padding:13px; border:2px solid #ff6a88;
          background:#fff; color:#ff6a88; border-radius:14px;
          font-weight:700; cursor:pointer;">
          ❌ Hủy
        </button>
      </div>

    </div>
  </div>`;

  document.body.insertAdjacentHTML("beforeend", modalHTML);
}

// -------------------------------------------------------
// 10. KHỞI CHẠY KHI TRANG LOAD
// -------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
  injectEditModal();
});
