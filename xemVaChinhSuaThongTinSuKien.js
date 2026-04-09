// ── Helpers ───────────────────────────────────────────────
function getEvents_S10() {
  // Ưu tiên lấy từ window._events (Firebase realtime)
  if (window._events && Array.isArray(window._events)) return window._events;
  return JSON.parse(localStorage.getItem("events") || "[]");
}

function getCurrentUser_S10() {
  try { return JSON.parse(localStorage.getItem("currentUser") || "null"); } catch { return null; }
}

function isAdmin_S10() {
  const u = getCurrentUser_S10();
  return u?.role === "admin";
}

function _toast(msg, type) {
  if (typeof window.showToast === "function") window.showToast(msg, type || "success");
  else console.log(msg);
}

// ── RENDER DANH SÁCH ─────────────────────────────────────
function renderEventsScrum10() {
  const events = getEvents_S10();
  const tbody  = document.getElementById("eventTable");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!events.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">Chưa có sự kiện nào.</td></tr>`;
    return;
  }

  events.forEach((e, i) => {
    const firebaseId = e.id || null;

    const editBtn = isAdmin_S10()
      ? `<button class="btn-edit" onclick="openEditModal(${i})">✏️ Sửa</button>`
      : `<span style="color:#aaa;font-size:12px;">Chỉ xem</span>`;

    const delBtn = isAdmin_S10() && firebaseId
      ? `<button class="btn-del" onclick="window.delEvent('${firebaseId}')" style="margin-left:5px;">🗑️</button>`
      : "";

    tbody.innerHTML += `
      <tr>
        <td>${e.t||""}</td>
        <td>${e.l||""}</td>
        <td>${e.d||""}</td>
        <td>${e.location||""}</td>
        <td>${e.max||""}</td>
        <td>${editBtn}${delBtn}</td>
      </tr>`;
  });
}

// ── MỞ MODAL CHỈNH SỬA ───────────────────────────────────
function openEditModal(index) {
  if (!isAdmin_S10()) { _toast("Bạn không có quyền chỉnh sửa sự kiện!", "error"); return; }
  const events = getEvents_S10();
  const e = events[index];
  if (!e) return;

  document.getElementById("edit_index").value    = index;
  document.getElementById("edit_title").value    = e.t        || "";
  document.getElementById("edit_leader").value   = e.l        || "";
  document.getElementById("edit_date").value     = e.d        || "";
  document.getElementById("edit_time").value     = e.time     || "08:00";
  document.getElementById("edit_location").value = e.location || "";
  document.getElementById("edit_max").value      = e.max      || "";
  document.getElementById("edit_desc").value     = e.desc     || "";

  document.querySelectorAll(".edit-status-tag").forEach(tag => {
    tag.classList.toggle("active", tag.dataset.val === (e.status || "Mở"));
  });

  document.getElementById("editModal").style.display = "flex";
}

// ── ĐÓNG MODAL ────────────────────────────────────────────
function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
  
  clearEditErrors();
}

// ── CHỌN TRẠNG THÁI ──────────────────────────────────────
function selectEditStatus(el) {
  document.querySelectorAll(".edit-status-tag").forEach(t => t.classList.remove("active"));
  el.classList.add("active");
}

// ── VALIDATE ─────────────────────────────────────────────
function validateEditForm() {
  let valid = true;
  clearEditErrors();
  const checks = [
    ["edit_title",    "edit_titleErr",    "Vui lòng nhập tên sự kiện!"],
    ["edit_leader",   "edit_leaderErr",   "Vui lòng nhập người phụ trách!"],
    ["edit_date",     "edit_dateErr",     "Vui lòng chọn ngày diễn ra!"],
    ["edit_location", "edit_locationErr", "Vui lòng nhập địa điểm!"],
  ];
  checks.forEach(([inp, err, msg]) => {
    if (!document.getElementById(inp)?.value?.trim()) {
      showEditError(inp, err, msg); valid = false;
    }
  });
  const max = document.getElementById("edit_max")?.value;
  if (!max || parseInt(max) < 1) { showEditError("edit_max","edit_maxErr","Số lượng phải lớn hơn 0!"); valid = false; }
  return valid;
}

function showEditError(inputId, errId, msg) {
  document.getElementById(inputId)?.classList.add("error");
  const err = document.getElementById(errId);
  if (err) { err.innerText = msg; err.classList.add("show"); }
}

function clearEditErrors() {
  ["edit_titleErr","edit_leaderErr","edit_dateErr","edit_locationErr","edit_maxErr"].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.remove("show"); el.innerText = ""; }
  });
  ["edit_title","edit_leader","edit_date","edit_location","edit_max"].forEach(id => {
    document.getElementById(id)?.classList.remove("error");
  });
}

// ── LƯU THAY ĐỔI ─────────────────────────────────────────
function saveEditEvent() {
  if (!isAdmin_S10()) { _toast("Bạn không có quyền chỉnh sửa!", "error"); return; }
  if (!validateEditForm()) return;

  const index  = parseInt(document.getElementById("edit_index").value);
  const events = getEvents_S10();
  const activeStatus = document.querySelector(".edit-status-tag.active");

  const updatedData = {
    t       : document.getElementById("edit_title").value.trim(),
    l       : document.getElementById("edit_leader").value.trim(),
    d       : document.getElementById("edit_date").value,
    time    : document.getElementById("edit_time").value,
    location: document.getElementById("edit_location").value.trim(),
    max     : parseInt(document.getElementById("edit_max").value),
    desc    : document.getElementById("edit_desc").value.trim(),
    status  : activeStatus ? activeStatus.dataset.val : "Mở"
  };

  const firebaseId = events[index]?.id;

  if (firebaseId && window._db && window._ref && window._update) {
    // FIX: Cập nhật Firebase trực tiếp
    window._update(window._ref(window._db, "events/" + firebaseId), updatedData)
      .then(() => {
        _toast("✅ Cập nhật sự kiện thành công!");

        closeEditModal();
        // renderEvents() sẽ tự được gọi qua onValue listener
        if (typeof window.renderEvents === "function") window.renderEvents();
      })
      .catch(err => _toast("❌ Lỗi: " + err.message, "error"));
  } else {
    // Fallback localStorage
    const lsEvents = JSON.parse(localStorage.getItem("events") || "[]");
    if (lsEvents[index]) {
      lsEvents[index] = { ...lsEvents[index], ...updatedData };
      localStorage.setItem("events", JSON.stringify(lsEvents));
    }
    closeEditModal();
    renderEventsScrum10();
    if (typeof window.renderEvents === "function") window.renderEvents();
    _toast("✅ Cập nhật sự kiện thành công!");
  }
}

// ── INJECT MODAL ──────────────────────────────────────────
function injectEditModal() {
  if (document.getElementById("editModal")) return;

  document.body.insertAdjacentHTML("beforeend", `
  <div id="editModal" style="
    display:none;position:fixed;top:0;left:0;
    width:100%;height:100%;background:rgba(0,0,0,0.5);
    z-index:9999;justify-content:center;align-items:center;">
    <div style="
      background:#fff;border-radius:24px;padding:30px;
      width:90%;max-width:520px;max-height:90vh;
      overflow-y:auto;position:relative;
      box-shadow:0 16px 48px rgba(255,105,180,.3);">
      <h2 style="text-align:center;color:#e84393;font-family:'Quicksand';margin-bottom:20px;">✏️ Chỉnh sửa sự kiện</h2>
      <input type="hidden" id="edit_index">

      <div class="form-group">
        <label>Tên sự kiện <span style="color:#ff4d88">*</span></label>
        <input id="edit_title" type="text" placeholder="Tên sự kiện..." maxlength="100">
        <div class="err-msg" id="edit_titleErr"></div>
      </div>
      <div class="form-group">
        <label>Người phụ trách <span style="color:#ff4d88">*</span></label>
        <input id="edit_leader" type="text" placeholder="Họ và tên...">
        <div class="err-msg" id="edit_leaderErr"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group">
          <label>Ngày diễn ra <span style="color:#ff4d88">*</span></label>
          <input id="edit_date" type="date">
          <div class="err-msg" id="edit_dateErr"></div>
        </div>
        <div class="form-group">
          <label>Giờ bắt đầu</label>
          <input id="edit_time" type="time">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group">
          <label>Địa điểm <span style="color:#ff4d88">*</span></label>
          <input id="edit_location" type="text" placeholder="VD: Hội trường A">
          <div class="err-msg" id="edit_locationErr"></div>
        </div>
        <div class="form-group">
          <label>Số lượng tối đa <span style="color:#ff4d88">*</span></label>
          <input id="edit_max" type="number" min="1" placeholder="VD: 50">
          <div class="err-msg" id="edit_maxErr"></div>
        </div>
      </div>
      <div class="form-group">
        <label>Trạng thái</label>
        <div style="display:flex;gap:8px;">
          <div class="status-tag edit-status-tag active" data-val="Mở"     onclick="selectEditStatus(this)" style="flex:1;padding:8px;border:2px solid #ffe0ea;border-radius:10px;text-align:center;font-size:12px;font-weight:600;cursor:pointer;background:#fff;">🟢 Mở</div>
          <div class="status-tag edit-status-tag"        data-val="Sắp mở" onclick="selectEditStatus(this)" style="flex:1;padding:8px;border:2px solid #ffe0ea;border-radius:10px;text-align:center;font-size:12px;font-weight:600;cursor:pointer;background:#fff;">🟡 Sắp mở</div>
          <div class="status-tag edit-status-tag"        data-val="Đóng"   onclick="selectEditStatus(this)" style="flex:1;padding:8px;border:2px solid #ffe0ea;border-radius:10px;text-align:center;font-size:12px;font-weight:600;cursor:pointer;background:#fff;">🔴 Đóng</div>
        </div>
      </div>
      <div class="form-group">
        <label>Mô tả sự kiện</label>
        <textarea id="edit_desc" placeholder="Mô tả ngắn..." maxlength="300" style="min-height:80px;"></textarea>
      </div>
      <div style="display:flex;gap:10px;margin-top:10px;">
        <button onclick="saveEditEvent()" style="flex:1;padding:13px;background:linear-gradient(135deg,#ff6a88,#e84393);color:#fff;border:none;border-radius:14px;font-weight:700;cursor:pointer;">💾 Lưu thay đổi</button>
        <button onclick="closeEditModal()" style="flex:1;padding:13px;border:2px solid #ff6a88;background:#fff;color:#ff6a88;border-radius:14px;font-weight:700;cursor:pointer;">❌ Hủy</button>
      </div>
    </div>
  </div>`);
}

// ── KHỞI CHẠY ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function() {
  injectEditModal();
});