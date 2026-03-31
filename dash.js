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
    if(!snap.exists()) return;

    const data = snap.val();
    currentData = data;

    const balance = data.solde_principal || data.balance || 0;
    const points = data.points || 0;

    // UI
    document.getElementById("welcome").innerText = "Bienvenue " + user;

    document.getElementById("balance").innerText =
        balance.toLocaleString();

    document.getElementById("points").innerText =
        points;

    // 💱 aperçu conversion
    const preview = Math.floor(points / 20) * 50;

    document.getElementById("pointsFC").innerText =
        preview;
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
        let balance = data.solde_principal || data.balance || 0;

        if(points < 20){
            alert("❌ Minimum 20 points requis");
            return;
        }

        // 💰 calcul
        const packs = Math.floor(points / 20);
        const fc = packs * 50;

        // 🔥 reset points
        await update(ref(db, "users/" + user), {
            points: 0,
            solde_principal: balance + fc
        });

        alert("✅ +" + fc + " FC ajouté");

    }catch(e){
        alert("⚠️ Erreur");
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

    const statuts = ["pending","validated","cancelled"];

    statuts.forEach(status=>{

        if(!data[status]) return;
        if(!data[status][user]) return;

        Object.values(data[status][user]).forEach(cmd=>{

            hasOrder = true;

            let css = "pending";
            let label = "EN ATTENTE";

            if(status === "validated"){
                css = "valid";
                label = "VALIDÉ";
            }

            if(status === "cancelled"){
                css = "cancel";
                label = "REFUSÉ";
            }

            container.innerHTML += `
                <div class="order ${css}">
                    📦 <b>${cmd.service || "Service"}</b><br>
                    💰 ${cmd.price || 0} FC<br>
                    📅 ${cmd.date ? new Date(cmd.date).toLocaleString() : ""}<br>
                    📌 ${label}
                </div>
            `;
        });

    });

    if(!hasOrder){
        container.innerHTML = "<small>Aucune commande trouvée</small>";
    }
});
