function getUserDB() {
  return JSON.parse(localStorage.getItem("userDatabase") || "[]");
}

function saveUserDB(db) {
  localStorage.setItem("userDatabase", JSON.stringify(db));
}

function genUserId() {
  return "UID-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

// ── 2. ĐỒNG BỘ TỪ participants → userDatabase ────────────
// Gọi hàm này sau mỗi lần addParticipant() hoặc khi load trang
function syncUserDatabase() {
  const participants = JSON.parse(localStorage.getItem("participants") || "[]");
  let db = getUserDB();

  participants.forEach(p => {
    if (!p.mssv) return; // bỏ qua nếu không có MSSV

    // Tìm record đã có theo MSSV
    let existing = db.find(u => u.mssv === p.mssv);

    if (existing) {
      // Cập nhật thông tin mới nhất
      existing.hoten    = p.name  || existing.hoten;
      existing.email    = p.email || existing.email;
      existing.sdt      = p.sdt   || existing.sdt || "";

      // Cập nhật trạng thái check-in (lấy mới nhất)
      const checkedEvents = participants
        .filter(x => x.mssv === p.mssv && x.checkedIn)
        .map(x => x.event);

      existing.trangThai = checkedEvents.length > 0 ? "Đã check-in" : "Chưa check-in";

      // Cập nhật danh sách sự kiện
      const allEvents = [...new Set(
        participants.filter(x => x.mssv === p.mssv).map(x => x.event)
      )];
      existing.suKienThamGia = allEvents;
      existing.updatedAt = new Date().toISOString();

    } else {
      // Tạo record mới
      const allEvents = [...new Set(
        participants.filter(x => x.mssv === p.mssv).map(x => x.event)
      )];

      db.push({
        id            : genUserId(),
        hoten         : p.name  || "",
        mssv          : p.mssv,
        email         : p.email || "",
        sdt           : p.sdt   || "",
        trangThai     : p.checkedIn ? "Đã check-in" : "Chưa check-in",
        suKienThamGia : allEvents,
        updatedAt     : new Date().toISOString()
      });
    }
  });

  saveUserDB(db);
}

// ── 3. CẬP NHẬT TRẠNG THÁI KHI CHECK-IN ─────────────────
// Gọi sau handleCheckin() để đồng bộ ngay lập tức
function syncCheckinStatus(mssv) {
  const db = getUserDB();
  const participants = JSON.parse(localStorage.getItem("participants") || "[]");

  const record = db.find(u => u.mssv === mssv);
  if (!record) return;

  const checkedEvents = participants
    .filter(p => p.mssv === mssv && p.checkedIn)
    .map(p => p.event);

  record.trangThai  = checkedEvents.length > 0 ? "Đã check-in" : "Chưa check-in";
  record.updatedAt  = new Date().toISOString();

  saveUserDB(db);
}

// ── 4. INJECT TRANG QUẢN LÝ DATABASE VÀO DOM ─────────────
function injectDatabasePage() {
  // Thêm menu item
  const menu = document.getElementById("menu");
  if (menu && !document.getElementById("menuUserDB")) {
    const btn = document.createElement("button");
    btn.id        = "menuUserDB";
    btn.className = "adminOnly";
    btn.setAttribute("onclick", "goUserDB()");
    btn.innerHTML = "🗄️ Database người dùng";
    menu.appendChild(btn);
  }

  // Thêm trang
  if (!document.getElementById("userDatabase")) {
    const page = document.createElement("div");
    page.id        = "userDatabase";
    page.className = "page";
    page.innerHTML = `
      <div class="card" style="max-width:950px;">
        <h2>🗄️ Database người dùng</h2>

        <!-- Thanh công cụ -->
        <div style="display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap;">
          <input
            id="dbSearch"
            placeholder="🔍 Tìm theo tên, MSSV, email..."
            style="flex:1; min-width:200px; padding:10px; border:2px solid #ffe0ea; border-radius:10px;"
            oninput="filterUserDB()"
          >
          <select id="dbFilterStatus"
            style="padding:10px; border:2px solid #ffe0ea; border-radius:10px;"
            onchange="filterUserDB()">
            <option value="">-- Tất cả trạng thái --</option>
            <option value="Đã check-in">✅ Đã check-in</option>
            <option value="Chưa check-in">⏳ Chưa check-in</option>
          </select>
          <button onclick="syncUserDatabase(); renderUserDB();" style="
            padding:10px 16px; background:#ff6a88; color:#fff;
            border:none; border-radius:10px; cursor:pointer; font-weight:700;">
            🔄 Đồng bộ
          </button>
          <button onclick="exportUserDB()" style="
            padding:10px 16px; background:#2ecc71; color:#fff;
            border:none; border-radius:10px; cursor:pointer; font-weight:700;">
            📥 Xuất CSV
          </button>
        </div>

        <!-- Bảng dữ liệu -->
        <div style="overflow-x:auto;">
          <table>
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>MSSV</th>
                <th>Email</th>
                <th>SĐT</th>
                <th>Trạng thái</th>
                <th>Sự kiện tham gia</th>
                <th>Cập nhật</th>
              </tr>
            </thead>
            <tbody id="userDBTable"></tbody>
          </table>
        </div>

        <p id="dbEmpty" style="text-align:center; color:#aaa; padding:20px; display:none;">
          Chưa có dữ liệu. Nhấn 🔄 Đồng bộ để tải.
        </p>
      </div>`;
    document.body.appendChild(page);
  }
}

// ── 5. ĐIỀU HƯỚNG ─────────────────────────────────────────
function goUserDB() {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  const page = document.getElementById("userDatabase");
  if (page) page.style.display = "block";
  document.getElementById("menu")?.classList.remove("show");

  syncUserDatabase();
  renderUserDB();
}

// ── 6. RENDER BẢNG ────────────────────────────────────────
function renderUserDB(data) {
  const db     = data || getUserDB();
  const tbody  = document.getElementById("userDBTable");
  const empty  = document.getElementById("dbEmpty");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (db.length === 0) {
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  db.forEach(u => {
    const badge = u.trangThai === "Đã check-in"
      ? `<span style="background:#2ecc71;color:#fff;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;">✅ Đã check-in</span>`
      : `<span style="background:#f39c12;color:#fff;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;">⏳ Chưa</span>`;

    const events = (u.suKienThamGia || []).join(", ") || "—";
    const updated = u.updatedAt
      ? new Date(u.updatedAt).toLocaleString("vi-VN")
      : "—";

    tbody.innerHTML += `
      <tr>
        <td style="font-weight:600;">${u.hoten || "—"}</td>
        <td>${u.mssv || "—"}</td>
        <td>${u.email || "—"}</td>
        <td>${u.sdt || "—"}</td>
        <td>${badge}</td>
        <td style="font-size:12px; color:#666;">${events}</td>
        <td style="font-size:11px; color:#aaa;">${updated}</td>
      </tr>`;
  });
}

// ── 7. LỌC / TÌM KIẾM ────────────────────────────────────
function filterUserDB() {
  const keyword = (document.getElementById("dbSearch")?.value || "").toLowerCase();
  const status  = document.getElementById("dbFilterStatus")?.value || "";

  let db = getUserDB();

  if (keyword) {
    db = db.filter(u =>
      (u.hoten  || "").toLowerCase().includes(keyword) ||
      (u.mssv   || "").toLowerCase().includes(keyword) ||
      (u.email  || "").toLowerCase().includes(keyword) ||
      (u.sdt    || "").toLowerCase().includes(keyword)
    );
  }

  if (status) {
    db = db.filter(u => u.trangThai === status);
  }

  renderUserDB(db);
}

// ── 8. XUẤT CSV ───────────────────────────────────────────
function exportUserDB() {
  const db = getUserDB();
  if (db.length === 0) {
    if (typeof showToast === "function") showToast("Không có dữ liệu để xuất!", "error");
    return;
  }

  let csv = "Họ tên;MSSV;Email;SĐT;Trạng thái;Sự kiện tham gia;Cập nhật\n";
  db.forEach(u => {
    csv += [
      `"${u.hoten || ""}"`,
      `"${u.mssv  || ""}"`,
      `"${u.email || ""}"`,
      `"${u.sdt   || ""}"`,
      `"${u.trangThai || ""}"`,
      `"${(u.suKienThamGia || []).join(", ")}"`,
      `"${u.updatedAt ? new Date(u.updatedAt).toLocaleString("vi-VN") : ""}"`
    ].join(";") + "\n";
  });

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv" });
  const a    = document.createElement("a");
  a.href     = URL.createObjectURL(blob);
  a.download = "database_nguoidung.csv";
  a.click();
}

// ── 9. HOOK VÀO addParticipant VÀ handleCheckin ──────────
// Tự động đồng bộ DB sau mỗi lần đăng ký hoặc check-in
(function hookSync() {
  // Hook addParticipant
  const _origAdd = window.addParticipant;
  if (typeof _origAdd === "function") {
    window.addParticipant = function () {
      _origAdd.apply(this, arguments);
      setTimeout(syncUserDatabase, 300); // đợi participants được lưu
    };
  }

  // Hook handleCheckin
  const _origCheckin = window.handleCheckin;
  if (typeof _origCheckin === "function") {
    window.handleCheckin = function (code) {
      _origCheckin.apply(this, arguments);
      // Lấy MSSV từ code "MSSV|TenSuKien"
      const mssv = (code || "").split("|")[0];
      setTimeout(() => syncCheckinStatus(mssv), 300);
    };
  }
})();

// ── 10. KHỞI CHẠY ─────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  injectDatabasePage();
  syncUserDatabase(); // đồng bộ lần đầu khi load trang
});
