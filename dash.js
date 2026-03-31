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

    const balance = data.balance || 0;
    const points = data.points || 0;

    document.getElementById("welcome").innerText =
        "Bienvenue " + user;

    document.getElementById("balance").innerText =
        balance.toLocaleString();

    document.getElementById("points").innerText =
        points;

    document.getElementById("pointsFC").innerText =
        Math.floor(points / 20) * 50;
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
        let balance = data.balance || 0;

        // ✅ Minimum
        if(points < 20){
            alert("❌ Minimum 20 points requis");
            return;
        }

        // ✅ Conversion: 20 pts = 50 FC
        const fc = Math.floor(points / 20) * 50;

        // 🔥 RESET TOTAL DES POINTS
        await update(ref(db, "users/" + user), {
            points: 0,
            balance: balance + fc
        });

        alert("✅ Conversion réussie : +" + fc + " FC");

    }catch(e){
        alert("⚠️ Erreur conversion");
        console.error(e);
    }
};

// ==========================
// 📦 COMMANDES UTILISATEUR (FIX COMPLET)
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

        // 🔥 ACCÈS DIRECT USER
        const userOrders = data[status][user];
        if(!userOrders) return;

        Object.values(userOrders).forEach(cmd=>{

            hasOrder = true;

            let css = "pending";
            if(status === "validated") css = "valid";
            if(status === "cancelled") css = "cancel";

            let details = "";

            if(cmd.siteUrl) details += "🌐 " + cmd.siteUrl + "<br>";
            if(cmd.link) details += "🔗 " + cmd.link + "<br>";
            if(cmd.platform) details += "📱 " + cmd.platform + "<br>";
            if(cmd.type) details += "📊 " + cmd.type + "<br>";
            if(cmd.nombre) details += "🔢 " + cmd.nombre + "<br>";
            if(cmd.desc) details += "📝 " + cmd.desc + "<br>";
            if(cmd.nomBot) details += "🤖 " + cmd.nomBot + "<br>";
            if(cmd.nomApp) details += "📱 " + cmd.nomApp + "<br>";
            if(cmd.nomSite) details += "🌍 " + cmd.nomSite + "<br>";

            container.innerHTML += `
                <div class="order ${css}">
                    📦 <b>${cmd.service || "Service"}</b><br>
                    💰 ${cmd.price || 0} FC<br>
                    📅 ${cmd.date ? new Date(cmd.date).toLocaleString() : ""}<br>
                    📌 ${status.toUpperCase()}<br><br>
                    ${details}
                </div>
            `;
        });

    });

    if(!hasOrder){
        container.innerHTML = "<small>Aucune commande trouvée</small>";
    }
});
