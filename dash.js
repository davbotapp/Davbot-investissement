import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==========================
// 🔥 CONFIG FIREBASE
// ==========================
const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==========================
// 🔐 SESSION
// ==========================
const user = localStorage.getItem("userPhone");

if(!user){
    window.location.href = "index.html";
}

// ==========================
// 📦 DATA UTILISATEUR
// ==========================
let currentData = {};

// ==========================
// 🔄 CHARGEMENT USER
// ==========================
onValue(ref(db, "users/" + user), (snap)=>{
    const data = snap.val();

    if(!data) return;

    currentData = data;

    const balance = data.balence || 0;
    const points = data.points || 0;

    // UI
    document.getElementById("welcome").innerText =
        "Bienvenue " + user;

    document.getElementById("balance").innerText =
        balance.toLocaleString();

    document.getElementById("points").innerText =
        points;

    document.getElementById("pointsFC").innerText =
        Math.floor(points / 25);
});


// ==========================
// 💱 CONVERSION POINTS → FC
// ==========================
window.convertPoints = async function(){

    try{
        const snap = await get(ref(db, "users/" + user));

        if(!snap.exists()) return;

        const data = snap.val();

        let points = data.points || 0;
        let balance = data.solde_principal || 0;

        if(points < 25){
            alert("❌ Minimum 25 points requis");
            return;
        }

        const fc = Math.floor(points / 25);
        const reste = points % 25;

        await update(ref(db, "users/" + user), {
            points: reste,
            solde_principal: balance + fc
        });

        alert("✅ Conversion réussie : +" + fc + " FC");

    }catch(e){
        alert("⚠️ Erreur conversion");
        console.error(e);
    }
};


// ==========================
// 📦 COMMANDES UTILISATEUR
// ==========================
onValue(ref(db, "orders"), (snap)=>{
    const container = document.getElementById("orders");
    container.innerHTML = "";

    const data = snap.val();

    if(!data){
        container.innerHTML = "<small>Aucune commande</small>";
        return;
    }

    let hasOrder = false;

    // Statuts
    const statuts = ["pending","validated","cancelled"];

    statuts.forEach(status=>{

        if(!data[status]) return;

        // 🔥 IMPORTANT: on filtre par utilisateur direct
        if(!data[status][user]) return;

        Object.values(data[status][user]).forEach(cmd=>{

            hasOrder = true;

            let css = "pending";
            if(status === "validated") css = "valid";
            if(status === "cancelled") css = "cancel";

            container.innerHTML += `
                <div class="order ${css}">
                    📦 <b>${cmd.service || "Service"}</b><br>
                    💰 ${cmd.price || 0} FC<br>
                    📅 ${cmd.date ? new Date(cmd.date).toLocaleString() : ""}<br>
                    📌 ${status.toUpperCase()}
                </div>
            `;
        });

    });

    if(!hasOrder){
        container.innerHTML = "<small>Aucune commande trouvée</small>";
    }
});
