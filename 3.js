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

// 🎯 CONFIG
const CONFIG = {
    symbols: ["🍒","🍋","💎","🔥","⭐"],
    small: 2000,
    medium: 8000,
    jackpot: 125000,
    maxDaily: 25000
};

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

// 🎰 SPIN VISUEL
function spinSlots(){
    return [
        CONFIG.symbols[Math.floor(Math.random()*CONFIG.symbols.length)],
        CONFIG.symbols[Math.floor(Math.random()*CONFIG.symbols.length)],
        CONFIG.symbols[Math.floor(Math.random()*CONFIG.symbols.length)]
    ];
}

// 🎮 JOUER
document.getElementById("play").onclick = async ()=>{

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
    if(data.slotDate === today){
        alert("Déjà joué aujourd'hui");
        return;
    }

    // 🎰 animation simple
    let spins = 10;
    let interval = setInterval(()=>{
        let s = spinSlots();
        document.getElementById("s1").innerText = s[0];
        document.getElementById("s2").innerText = s[1];
        document.getElementById("s3").innerText = s[2];

        spins--;
        if(spins <= 0){
            clearInterval(interval);
            finishGame(data);
        }
    },100);
};

// 🎯 FIN
async function finishGame(data){

    let gain = smartGain(data);

    let text = gain > 0 
        ? "🎉 +" + gain + " points"
        : "❌ Aucun gain";

    // 💾 update Firebase
    await update(ref(db,"users/"+user),{
        points:(data.points || 0) + gain,
        todayGain:(data.todayGain || 0) + gain,
        totalPlayed:(data.totalPlayed || 0) + 1,
        slotDate:new Date().toDateString()
    });

    document.getElementById("result").innerText = text;

    // 🔙 retour auto
    setTimeout(()=>{
        location.href="taches.html";
    },2500);
}
