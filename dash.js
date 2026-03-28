import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const user = localStorage.getItem("userPhone");
if(!user) window.location.href = "login.html";

let mesInvests = {};
let gainTotal = 0;

// 🔥 USER DATA
onValue(ref(db, "users/" + user), snap=>{
    const data = snap.val();
    if(!data) return;

    document.getElementById("welcome").innerText =
        "Bienvenue " + user;

    document.getElementById
