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

        const fc = Math.floor(points * 2.5);

        await update(ref(db, "users/" + user), {
            points: 0,
            balance: balance + fc
        });

        alert("✅ +" + fc + " FC ajouté");

    }catch(e){
        console.error(e);
        alert("❌ Erreur conversion");
    }
}

// 🔥 BOUTON
document.getElementById("convertBtn").onclick = convertPoints;


// ================= 📊 STATS =================
onValue(ref(db, "orders"), async (snap)=>{
    if(!snap.exists()) return;

    let totalGain = 0;
    let totalDepense = 0;

    const data = snap.val();

    ["validated","cancelled"].forEach(status=>{

        if(!data[status] || !data[status][user]) return;

        Object.values(data[status][user]).forEach(cmd=>{
            const price = cmd.price || 0;

            if(status === "validated"){
                totalDepense += price;
            }

            if(status === "cancelled"){
                totalGain += price;
            }
        });

    });

    document.getElementById("totalGain").innerText = totalGain.toLocaleString();
    document.getElementById("totalDepense").innerText = totalDepense.toLocaleString();

    const userSnap = await get(ref(db,"users/"+user));
    const balance = userSnap.val()?.balance || 0;

    document.getElementById("evolution").innerText =
        (balance - totalDepense).toLocaleString();
});


// ================= 📦 COMMANDES =================
const container = document.getElementById("orders");

onValue(ref(db, "orders"), (snap)=>{

    container.innerHTML = "";

    if(!snap.exists()){
        container.innerHTML = "<small>Aucune commande</small>";
        return;
    }

    const data = snap.val();

    // 🔥 fonction affichage propre
    function show(status, css){

        if(!data[status] || !data[status][user]) return;

        Object.values(data[status][user])
        .sort((a,b)=> (b.date || 0) - (a.date || 0)) // 🔥 TRI RÉCENT
        .forEach(cmd=>{

            container.innerHTML += `
                <div class="order ${css}">
                    📦 <b>${cmd.service || "Service"}</b><br>
                    💰 ${Number(cmd.price || 0).toLocaleString()} FC<br>
                    📅 ${cmd.date ? new Date(cmd.date).toLocaleString() : "-"}<br>
                    📌 ${status.toUpperCase()}
                </div>
            `;
        });
    }

    // 🔥 ORDRE IMPORTANT
    show("pending", "pending");
    show("validated", "valid");
    show("cancelled", "cancel");

});
