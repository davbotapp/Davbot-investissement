import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyA24pBo8mBWiZssPtep--MMBdB7c8_Lu4U",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// USER
const userPhone = localStorage.getItem("userPhone");

if(!userPhone){
    window.location.href = "login.html";
}

// ELEMENTS
const codeEl = document.getElementById("code");
const lvl1El = document.getElementById("lvl1");
const lvl2El = document.getElementById("lvl2");
const lvl3El = document.getElementById("lvl3");
const totalEl = document.getElementById("total");
const gainsEl = document.getElementById("gains");
const pointsEl = document.getElementById("points");

// 🔄 DATA
onValue(ref(db, "users/" + userPhone), snap=>{
    if(!snap.exists()) return;

    const data = snap.val();

    const code = data.inviteCode || "DAV-000";
    codeEl.innerText = code;

    const l1 = data.count_lvl1 || 0;
    const l2 = data.count_lvl2 || 0;
    const l3 = data.count_lvl3 || 0;

    lvl1El.innerText = l1;
    lvl2El.innerText = l2;
    lvl3El.innerText = l3;

    totalEl.innerText = l1 + l2 + l3;

    // 💰 gains FC
    gainsEl.innerText = (data.balance || 0).toLocaleString();

    // ⭐ points
    pointsEl.innerText = (data.points || 0);
});

// 🔗 LIEN
function getLink(code){
    return location.origin + "/register.html?ref=" + code;
}

// 📋 COPY
document.getElementById("copyBtn").onclick = ()=>{
    const link = getLink(codeEl.innerText);

    navigator.clipboard.writeText(link)
    .then(()=> alert("Lien copié"))
    .catch(()=> alert(link));
};

// 📤 WHATSAPP
document.getElementById("whatsappBtn").onclick = ()=>{
    const link = getLink(codeEl.innerText);

    const msg = "Rejoins-moi sur DAVBOT 🚀\n" + link;

    window.open("https://wa.me/?text=" + encodeURIComponent(msg));
};
