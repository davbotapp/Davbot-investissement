import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔥 CONFIG
const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🔐 USER
const user = localStorage.getItem("userPhone");

if(!user){
    window.location.href = "index.html";
}

// ================= USER DATA =================
onValue(ref(db, "users/" + user), (snap)=>{
    if(!snap.exists()) return;

    const data = snap.val();

    const balance = data.balance || 0;
    const points = data.points || 0;

    document.getElementById("balance").innerText = balance.toLocaleString();
    document.getElementById("points").innerText = points;
    document.getElementById("pointsFC").innerText = Math.floor(points * 2.5);
});

// ================= CONVERSION =================
async function convertPoints(){

    const snap = await get(ref(db, "users/" + user));
    if(!snap.exists()) return;

    const data = snap.val();

    let points = data.points || 0;
    let balance = data.balance || 0;

    if(points < 20){
        alert("❌ Minimum 20 points requis");
        return;
    }

    const fc = Math.floor(points * 2.5);

    await update(ref(db, "users/" + user), {
        points: 0,
        balance: balance + fc
    });

    alert("✅ +" + fc + " FC ajouté");
}

// ==========================
// 📊 TABLEAU DE BORD
// ==========================
onValue(ref(db, "orders"), async (snap)=>{
    if(!snap.exists()) return;

    let totalGain = 0;
    let totalDepense = 0;

    const data = snap.val();

    ["validated","cancelled"].forEach(status=>{

        if(!data[status]) return;
        if(!data[status][user]) return;

        Object.values(data[status][user]).forEach(cmd=>{

            const price = cmd.price || 0;

            if(status === "validated"){
                totalDepense += price;
            }

            if(status === "cancelled"){
                totalGain += price; // remboursement
            }
        });

    });

    // 🔥 afficher
    document.getElementById("totalGain").innerText =
        totalGain.toLocaleString();

    document.getElementById("totalDepense").innerText =
        totalDepense.toLocaleString();

    // 📊 évolution = balance actuel - dépense
    const userSnap = await get(ref(db,"users/"+user));
    const balance = userSnap.val().balance || 0;

    document.getElementById("evolution").innerText =
        (balance - totalDepense).toLocaleString();
});
// 🔥 LIAISON BOUTON
document.getElementById("convertBtn").onclick = convertPoints;

// ================= COMMANDES =================
const container = document.getElementById("orders");
container.innerHTML = "";

// 🔁 fonction
function loadOrders(path, status){

    onValue(ref(db, path + "/" + user), (snap)=>{

        if(!snap.exists()) return;

        Object.values(snap.val()).forEach(cmd=>{

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
}

// 🔥 LOAD
loadOrders("orders/pending", "pending");
loadOrders("orders/validated", "validated");
loadOrders("orders/cancelled", "cancelled");
