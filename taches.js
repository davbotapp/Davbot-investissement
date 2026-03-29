import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔥 CONFIG FIREBASE
const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 👤 UTILISATEUR
const user = localStorage.getItem("userPhone");
if(!user) window.location.href = "index.html";

// ============================
// 🎯 AFFICHER STATUS
// ============================
async function loadStatus(){

    const snap = await get(ref(db,"users/"+user));
    if(!snap.exists()) return;

    const data = snap.val();

    const now = Date.now();

    // =========================
    // G3 (3 jours)
    // =========================
    if(data.tokenG3 && now < data.tokenG3.expire){
        const daysLeft = Math.ceil((data.tokenG3.expire - now) / 86400000);
        document.getElementById("g3info").innerText =
        "✅ Actif (" + daysLeft + " jours restants)";
    }else{
        document.getElementById("g3info").innerText = "❌ Inactif";
    }

    // =========================
    // P7 (7 jours)
    // =========================
    if(data.token && (now - data.token.start) < (7*86400000)){
        const daysLeft = 7 - Math.floor((now - data.token.start)/86400000);
        document.getElementById("p7info").innerText =
        "✅ Actif (" + daysLeft + " jours restants)";
    }else{
        document.getElementById("p7info").innerText = "❌ Inactif";
    }

    // =========================
    // 🔒 BLOQUER BOUTON SI DÉJÀ JOUÉ
    // =========================
    if(data.lastPlay && (now - data.lastPlay) < 86400000){

        if(document.getElementById("btnPlayG3"))
            document.getElementById("btnPlayG3").disabled = true;

        if(document.getElementById("btnPlayP7"))
            document.getElementById("btnPlayP7").disabled = true;
    }
}

loadStatus();


// ============================
// 💰 ACHETER TOKEN
// ============================
window.buyToken = async(type)=>{

    const snap = await get(ref(db,"users/"+user));
    const data = snap.val();

    let price = 0;

    if(type === "G3") price = 3500;
    if(type === "P7") price = 5000;

    if((data.balance || 0) < price){
        alert("❌ Solde insuffisant");
        return;
    }

    let updateData = {
        balance: (data.balance || 0) - price,
        todayGain: 0
    };

    if(type === "G3"){
        updateData.tokenG3 = {
            start: Date.now(),
            expire: Date.now() + (3 * 86400000)
        };
    }

    if(type === "P7"){
        updateData.token = {
            start: Date.now()
        };
    }

    await update(ref(db,"users/"+user), updateData);

    alert("✅ Jeton activé !");
    loadStatus();
};


// ============================
// 🎮 JOUER (AVEC BLOQUAGE)
// ============================
window.playGame = async(type)=>{

    const snap = await get(ref(db,"users/"+user));
    if(!snap.exists()) return;

    const data = snap.val();
    const now = Date.now();

    // 🔒 Déjà joué ?
    if(data.lastPlay && (now - data.lastPlay) < 86400000){
        alert("⛔ Tu as déjà joué aujourd'hui !");
        return;
    }

    // 🔒 Vérifier token actif
    if(type === "G3"){
        if(!data.tokenG3 || now > data.tokenG3.expire){
            alert("❌ Ton token G3 est expiré");
            return;
        }
    }

    if(type === "P7"){
        if(!data.token || (now - data.token.start) > (7*86400000)){
            alert("❌ Ton token P7 est expiré");
            return;
        }
    }

    // 💾 Sauvegarder jeu
    await update(ref(db,"users/"+user), {
        lastPlay: now
    });

    // 🚀 Redirection
    if(type === "G3"){
        window.location.href = "1.html";
    }

    if(type === "P7"){
        window.location.href = "3.html";
    }
};
