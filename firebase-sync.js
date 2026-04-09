import { initializeApp }     from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update, set }
  from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

// ── CONFIG ─────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyD1AjKDBaul5KmFQYdGOmQs0wPkcVVo9VI",
  authDomain: "agl-qlclb.firebaseapp.com",
  databaseURL: "https://agl-qlclb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "agl-qlclb",
  storageBucket: "agl-qlclb.firebasestorage.app",
  messagingSenderId: "141206426649",
  appId: "1:141206426649:web:7fc9b098a48322b652c688"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ── LOCAL CACHE ────────────────────────────────────────
let _events        = [];
let _participants   = [];
let _users         = [];
let _admins        = [];
let _assignments   = [];
let _notifications = [];
let _reviews       = [];
let _budgets       = [];

// ── READY PROMISE ──────────────────────────────────────
// FIX: đếm đúng 5 node bắt buộc (events, participants, users, admins, assignments)
let _resolveReady;
const ready = new Promise(r => (_resolveReady = r));
const _REQUIRED_NODES = new Set(["events","participants","users","admins","assignments"]);
const _loadedNodes    = new Set();

function _checkReady(nodeName) {
  _loadedNodes.add(nodeName);
  if (_REQUIRED_NODES.size === [..._REQUIRED_NODES].filter(n => _loadedNodes.has(n)).length) {
    _resolveReady();
  }
}

// ── REALTIME LISTENERS ─────────────────────────────────
onValue(ref(db, "events"), snap => {
  _events = [];
  snap.forEach(c => _events.push({ id: c.key, ...c.val() }));
  localStorage.setItem("events", JSON.stringify(_events));
  window.dispatchEvent(new CustomEvent("fs:events", { detail: _events }));
  _checkReady("events");
});

onValue(ref(db, "participants"), snap => {
  _participants = [];
  snap.forEach(c => _participants.push({ id: c.key, ...c.val() }));
  localStorage.setItem("participants", JSON.stringify(_participants));
  window.dispatchEvent(new CustomEvent("fs:participants", { detail: _participants }));
  _checkReady("participants");
});

onValue(ref(db, "users"), snap => {
  _users = [];
  snap.forEach(c => _users.push({ id: c.key, role: "user", ...c.val() }));
  window.dispatchEvent(new CustomEvent("fs:users", { detail: _users }));
  _checkReady("users");
});

onValue(ref(db, "admins"), snap => {
  _admins = [];
  snap.forEach(c => _admins.push({ id: c.key, role: "admin", ...c.val() }));
  window.dispatchEvent(new CustomEvent("fs:admins", { detail: _admins }));
  _checkReady("admins");
});

onValue(ref(db, "assignments"), snap => {
  _assignments = [];
  snap.forEach(c => _assignments.push({ id: c.key, ...c.val() }));
  localStorage.setItem("assignments", JSON.stringify(_assignments));
  window.dispatchEvent(new CustomEvent("fs:assignments", { detail: _assignments }));
  _checkReady("assignments");
});

onValue(ref(db, "notifications"), snap => {
  _notifications = [];
  snap.forEach(c => _notifications.push({ id: c.key, ...c.val() }));
  localStorage.setItem("notifications", JSON.stringify(_notifications));
  window.dispatchEvent(new CustomEvent("fs:notifications", { detail: _notifications }));
});

onValue(ref(db, "reviews"), snap => {
  _reviews = [];
  snap.forEach(c => _reviews.push({ id: c.key, ...c.val() }));
  window.dispatchEvent(new CustomEvent("fs:reviews", { detail: _reviews }));
});

// FIX: Đồng bộ budgets lên Firebase thay vì chỉ localStorage
onValue(ref(db, "budgets"), snap => {
  _budgets = [];
  snap.forEach(c => _budgets.push({ id: c.key, ...c.val() }));
  localStorage.setItem("budgets", JSON.stringify(_budgets));
  window.dispatchEvent(new CustomEvent("fs:budgets", { detail: _budgets }));
});

// ── TOAST HELPER ──────────────────────────────────────
function showToast(msg, type = "success") {
  // Ưu tiên dùng phần tử #toast có sẵn trên trang (tương thích mọi trang)
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.style.cssText = [
      "position:fixed","bottom:25px","left:50%",
      "transform:translateX(-50%) translateY(100px)",
      "padding:12px 25px","border-radius:12px",
      "color:#fff","font-weight:700","transition:0.4s",
      "z-index:10001","opacity:0","pointer-events:none",
      "text-align:center","max-width:90vw"
    ].join(";");
    document.body.appendChild(t);
  }

  const colors = {
    success : "#2ecc71",
    error   : "#e74c3c",
    info    : "#3498db",
    warning : "#f39c12"
  };

  t.style.background = colors[type] || colors.success;
  t.textContent = msg;
  t.style.opacity   = "1";
  t.style.transform = "translateX(-50%) translateY(0)";
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity   = "0";
    t.style.transform = "translateX(-50%) translateY(100px)";
  }, 3000);
}

// ── PUBLIC API ────────────────────────────────────────
const FS = {
  // Firebase primitives
  db, ref, push, update, remove, set, onValue,

  // Lifecycle
  ready,
  showToast,

  // Getters (luôn trả về bản mới nhất)
  getEvents:        () => _events,
  getParticipants:  () => _participants,
  getUsers:         () => _users,
  getAdmins:        () => _admins,
  // FIX: getAllAccounts() gộp users + admins, loại trùng theo email
  getAllAccounts: () => {
    const map = new Map();
    [..._users, ..._admins].forEach(u => {
      const key = (u.email || u.id || "").toLowerCase();
      if (!map.has(key)) map.set(key, u);
      else {
        // Ưu tiên bản có passHash (đã hash)
        if (u.passHash && !map.get(key).passHash) map.set(key, u);
      }
    });
    return [...map.values()];
  },
  getAssignments:   () => _assignments,
  getNotifications: () => _notifications,
  getReviews:       () => _reviews,
  getBudgets:       () => _budgets,

  // Auth helpers
  getCurrentUser: () => {
    try { return JSON.parse(localStorage.getItem("currentUser") || "null"); }
    catch { return null; }
  },
  isAdmin: () => {
    try {
      const u = JSON.parse(localStorage.getItem("currentUser") || "null");
      return u?.role === "admin";
    } catch { return false; }
  },
  isLoggedIn: () => {
    try {
      return !!JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch { return false; }
  },

  // ── Shortcuts ghi dữ liệu ──
  addEvent        : (d) => push(ref(db, "events"),        d),
  addParticipant  : (d) => push(ref(db, "participants"),  d),
  addAssignment   : (d) => push(ref(db, "assignments"),   d),
  addNotification : (d) => push(ref(db, "notifications"), d),
  addReview       : (d) => push(ref(db, "reviews"),       d),
  addBudget       : (d) => push(ref(db, "budgets"),       d),

  updateEvent       : (id, d) => update(ref(db, `events/${id}`),       d),
  updateParticipant : (id, d) => update(ref(db, `participants/${id}`), d),
  updateAssignment  : (id, d) => update(ref(db, `assignments/${id}`),  d),
  updateBudget      : (id, d) => update(ref(db, `budgets/${id}`),      d),

  deleteEvent       : (id) => remove(ref(db, `events/${id}`)),
  deleteParticipant : (id) => remove(ref(db, `participants/${id}`)),
  deleteAssignment  : (id) => remove(ref(db, `assignments/${id}`)),
  deleteNotification: (id) => remove(ref(db, `notifications/${id}`)),
  deleteBudget      : (id) => remove(ref(db, `budgets/${id}`)),
};

window.FS = FS;
export { FS, db, ref, push, update, remove, set, onValue, showToast };