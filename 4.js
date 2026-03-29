import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔥 CONFIG
const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 👤 USER
const user = localStorage.getItem("userPhone");
if(!user){
    alert("Connexion requise");
    location.href = "index.html";
}

// 🎯 CONFIG INTELLIGENT
const CONFIG = {
    boxes: 6,
    small: 2000,
    medium: 8000,
    jackpot: 125000,
    maxDaily: 25000
};

// 🎁 CRÉER COFFRES
const grid = document.getElementById("grid");

for(let i=0;i<CONFIG.boxes;i++){
    let div = document.createElement("div");
    div.className = "box";
    div.innerText = "❓";
    div.onclick = ()=>openBox(div,i);
    grid.appendChild(div);
}

// 🎯 GAIN INTELLIGENT
function smartGain(data){

    let r = Math.random()*100;
    let gain = 0;

    if(r < 55) gain = 0;
    else if(r < 80) gain = CONFIG.small;
    else if(r < 96) gain = CONFIG.medium;
    else gain = CONFIG.jackpot;

    // 🔒 limite journalière
    if((data.todayGain || 0) >= CONFIG.maxDaily){
        gain = 0;
    }

    // 🧠 réduction si gros joueur
    if((data.points || 0) > 200000){
        gain = Math.floor(gain * 0.3);
    }

    return gain;
}

// 🎮 OUVRIR COFFRE
async function openBox(box,index){

    const snap = await get(ref(db,"users/"+user));
    if(!snap.exists()) return;

    const data = snap.val();

    // 🔐 jeton P7
    if(!data.token){
        alert("Jeton P7 requis");
        return;
    }

    // ⛔ 1 fois / jour
    const today = new Date().toDateString();
    if(data.boxDate === today){
        alert("Déjà joué aujourd'hui");
        return;
    }

    let gain = smartGain(data);

    // 🎁 affichage visuel
    box.style.background = gain > 0 ? "#00ffb3" : "#ff4d6d";
    box.innerText = gain > 0 ? "💰" : "❌";

    document.getElementById("result").innerText =
        gain > 0 ? "🎉 +" + gain + " points !" : "❌ Perdu";

    // 🔒 bloquer tous les coffres
    document.querySelectorAll(".box").forEach(b=>{
        b.onclick = null;
    });

    // 💾 FIREBASE UPDATE
    await update(ref(db,"users/"+user),{
        points:(data.points || 0) + gain,
        todayGain:(data.todayGain || 0) + gain,
        totalPlayed:(data.totalPlayed || 0) + 1,
        boxDate: today
    });

    // 🔙 retour auto
    setTimeout(()=>{
        location.href="taches.html";
    },2500);
}
