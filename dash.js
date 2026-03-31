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
const user = localStorage.getItem("username");

if(!user){
    window.location.href = "index.html";
}

// ==========================
// 🔄 LOAD USER
// ==========================
onValue(ref(db, "users/" + user), (snap)=>{
    if(!snap.exists()) return;

    const data = snap.val();

    const balance = data.balance || 0;
    const points = data.points || 0;

    document.getElementById("balance").innerText =
        balance.toLocaleString();

    document.getElementById("points").innerText =
        points;

    document.getElementById("pointsFC").innerText =
        Math.floor(points * 2.5);
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

        if(points < 20){
            alert("❌ Minimum 20 points requis");
            return;
        }

        // 💰 Conversion
        const fc = Math.floor(points * 2.5);

        // 🔥 UPDATE FIREBASE
        await update(ref(db, "users/" + user), {
            points: 0, // 🔥 RESET COMPLET
            balance: balance + fc
        });

        alert("✅ Conversion réussie : +" + fc + " FC");

    }catch(e){
        console.error(e);
        alert("❌ Erreur conversion");
    }
};

// ==========================
// 📦 COMMANDES
// ==========================
onValue(ref(db, "orders"), (snap)=>{
    const container = document.getElementById("orders");
    container.innerHTML = "";

    if(!snap.exists()){
        container.innerHTML = "<small>Aucune commande</small>";
        return;
    }

    const data = snap.val();
    let hasOrder = false;

    ["pending","validated","cancelled"].forEach(status=>{

        if(!data[status]) return;
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
