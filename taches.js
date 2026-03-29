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
if(!user) window.location.href = "index.html";

// ============================
// 🎯 AFFICHER STATUS
// ============================
async function loadStatus(){

    const snap = await get(ref(db,"users/"+user));
    if(!snap.exists()) return;

    const data = snap.val();

    // G3
    if(data.tokenG3 && Date.now() < data.tokenG3.expire){
        const daysLeft = Math.ceil((data.tokenG3.expire - Date.now()) / 86400000);
        document.getElementById("g3info").innerText =
        "✅ Actif (" + daysLeft + " jours restants)";
    }else{
        document.getElementById("g3info").innerText = "❌ Inactif";
    }

    // P7
    if(data.token && (Date.now() - data.token.start) < (7*86400000)){
        const daysLeft = 7 - Math.floor((Date.now() - data.token.start)/86400000);
        document.getElementById("p7info").innerText =
        "✅ Actif (" + daysLeft + " jours restants)";
    }else{
        document.getElementById("p7info").innerText = "❌ Inactif";
    }
}

loadStatus();

// ============================
// 💰 ACHETER
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
        balance: (data.balance || 0) - price
    };

    if(type === "G3"){
        updateData.tokenG3 = {
            start: Date.now(),
            expire: Date.now() + (3 * 86400000)
        };
        updateData.todayGain = 0;
    }

    if(type === "P7"){
        updateData.token = {
            start: Date.now()
        };
        updateData.todayGain = 0;
    }

    await update(ref(db,"users/"+user), updateData);

    alert("✅ Jeton activé !");
    loadStatus();
};

// ============================
// 🎮 JOUER
// ============================
window.playGame = (type)=>{

    if(type === "G3"){
        // 👉 redirection vers jeux G3
        window.location.href = "1.html";
    }

    if(type === "P7"){
        // 👉 redirection vers jeux P7
        window.location.href = "3.html";
    }
};
