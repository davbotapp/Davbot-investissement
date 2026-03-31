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
// 👤 USER DATA
// ==========================
onValue(ref(db, "users/" + user), (snap)=>{
    if(!snap.exists()) return;

    const data = snap.val();

    const balance = data.solde_principal || data.balance || 0;
    const points = data.points || 0;

    document.getElementById("welcome").innerText = "Bienvenue " + user;
    document.getElementById("balance").innerText = balance.toLocaleString();
    document.getElementById("points").innerText = points;

    // aperçu conversion
    const preview = Math.floor(points / 20) * 50;
    document.getElementById("pointsFC").innerText = preview;
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

        const packs = Math.floor(points / 20);
        const fc = packs * 50;

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
// 📦 COMMANDES (FIX TOTAL)
// ==========================

const container = document.getElementById("orders");

function renderOrder(cmd, status){

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

    // 🔍 détails dynamiques
    let details = "";

    if(cmd.link) details += `🔗 ${cmd.link}<br>`;
    if(cmd.platform) details += `📱 ${cmd.platform}<br>`;
    if(cmd.type) details += `📊 ${cmd.type}<br>`;
    if(cmd.nombre) details += `🔢 ${cmd.nombre}<br>`;
    if(cmd.siteUrl) details += `🌐 ${cmd.siteUrl}<br>`;
    if(cmd.duree) details += `⏳ ${cmd.duree}<br>`;
    if(cmd.desc) details += `📝 ${cmd.desc}<br>`;
    if(cmd.typeApp) details += `📲 ${cmd.typeApp}<br>`;
    if(cmd.typeSite) details += `🌍 ${cmd.typeSite}<br>`;

    return `
        <div class="order ${css}">
            📦 <b>${cmd.service || "Service"}</b><br>
            💰 ${cmd.price || 0} FC<br>
            📅 ${cmd.date ? new Date(cmd.date).toLocaleString() : ""}<br>
            📌 ${label}<br>
            ${details}
        </div>
    `;
}

function loadOrders(){

    container.innerHTML = "";
    let hasOrder = false;

    const statuts = ["pending","validated","cancelled"];

    statuts.forEach(status=>{

        onValue(ref(db, "orders/" + status + "/" + user), (snap)=>{

            if(snap.exists()){

                const data = snap.val();

                Object.values(data).forEach(cmd=>{
                    hasOrder = true;
                    container.innerHTML += renderOrder(cmd, status);
                });

            }

            if(!hasOrder){
                container.innerHTML = "<small>Aucune commande</small>";
            }

        });

    });

}

loadOrders();
