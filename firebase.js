import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove, update }
  from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

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
const db = getDatabase(app);

export { db, ref, set, push, onValue, remove, update };