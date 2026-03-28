import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const user = localStorage.getItem("userPhone");
if(!user) window.location.href = "login.html";

let currentData = {};

// 🔥 USER DATA
onValue(ref(db, "users/" + user), snap=>{
    const data = snap.val();
    if(!data) return;

    currentData = data;

    document.getElementById("welcome").innerText =
        "Bienvenue " + user;

    document.getElementById("balance").innerText =
        data.balance || 0;

    const pts = data.points || 0;

    document.getElementById("points").innerText = pts;
    document.getElementById("pointsFC").innerText =
        Math.floor(pts / 25);
});


// 🔥 CONVERSION POINTS → FC
window.convertPoints = async function(){

    const pts = currentData.points || 0;

    if(pts < 25){
        alert("❌ Minimum 25 points");
        return;
    }

    const fc = Math.floor(pts / 25);
    const reste = pts % 25;

    await update(ref(db, "users/" + user), {
        points: reste,
        balance: (currentData.balance || 0) + fc
    });

    alert("✅ +" + fc + " FC ajouté");
};


// 🔥 COMMANDES
onValue(ref(db, "orders"), snap=>{
    const box = document.getElementById("orders");
    box.innerHTML = "";

    const data = snap.val();
    if(!data) return;

    ["pending","validated","cancelled"].forEach(status=>{
        if(data[status]){
            Object.values(data[status]).forEach(userOrders=>{
                Object.values(userOrders).forEach(cmd=>{

                    if(cmd.user !== user) return;

                    let css = "pending";
                    if(status === "validated") css = "valid";
                    if(status === "cancelled") css = "cancel";

                    box.innerHTML += `
                        <div class="order ${css}">
                            📦 ${cmd.service}<br>
                            💰 ${cmd.price} FC<br>
                            📌 ${status}
                        </div>
                    `;
                });
            });
        }
    });
});
