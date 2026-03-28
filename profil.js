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
const phoneEl = document.getElementById("phone");
const codeEl = document.getElementById("code");
const avatarEl = document.getElementById("avatar");
const soldeEl = document.getElementById("solde");
const pointsEl = document.getElementById("points");

// 🔄 LIVE DATA
onValue(ref(db, "users/" + userPhone), (snap)=>{
    if(!snap.exists()) return;

    const data = snap.val();

    phoneEl.innerText = userPhone;
    codeEl.innerText = "ID: " + (data.inviteCode || "DAV-000");

    avatarEl.innerText = userPhone.substring(0,2);

    // 💰 FC
    soldeEl.innerText = (data.balance || 0).toLocaleString();

    // ⭐ POINTS
    pointsEl.innerText = (data.points || 0);
});

// 🚪 LOGOUT
document.getElementById("logout").onclick = ()=>{
    if(confirm("Se déconnecter ?")){
        localStorage.clear();
        window.location.href = "login.html";
    }
};
