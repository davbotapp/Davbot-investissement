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

// 🎯 CONFIG G3
const CONFIG = {
    small: 2000,
    medium: 8000,
    jackpot: 125000,
    maxDaily: 25000
};

// 🎯 PROBABILITÉ INTELLIGENTE
function smartGain(data){

    let r = Math.random()*100;
    let gain = 0;

    if(r < 55) gain = 0;
    else if(r < 80) gain = CONFIG.small;
    else if(r < 96) gain = CONFIG.medium;
    else gain = CONFIG.jackpot;

    // 🔒 limite
    if((data.todayGain || 0) >= CONFIG.maxDaily){
        gain = 0;
    }

    // 🧠 réduction
    if((data.points || 0) > 200000){
        gain = Math.floor(gain * 0.3);
    }

    return gain;
}

// 🎮 JOUER
window.play = async(choice)=>{

    const snap = await get(ref(db,"users/"+user));
    if(!snap.exists()) return;

    const data = snap.val();

    // 🔐 jeton
    if(!data.tokenG3 || Date.now() > data.tokenG3.expire){
        alert("Jeton G3 requis");
        return;
    }

    // ⛔ 1 fois / jour
    const today = new Date().toDateString();
    if(data.duelDate === today){
        alert("Déjà joué aujourd'hui");
        return;
    }

    let gain = smartGain(data);

    // 🎲 simulation IA (juste visuel)
    let aiChoice = Math.floor(Math.random()*3);

    let text = "";
    if(gain > 0){
        text = "🎉 IA battue ! +" + gain + " pts";
    }else{
        text = "❌ L'IA a gagné";
    }

    // 💾 update
    await update(ref(db,"users/"+user),{
        points:(data.points || 0) + gain,
        todayGain:(data.todayGain || 0) + gain,
        totalPlayed:(data.totalPlayed || 0) + 1,
        duelDate: today
    });

    document.getElementById("result").innerText = text;

    document.getElementById("stats").innerText =
    "IA a choisi : " + ["🔴","🔵","🟢"][aiChoice];

    // 🔙 retour
    setTimeout(()=>{
        location.href="taches.html";
    },2500);
};
