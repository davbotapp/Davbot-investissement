import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ================= CONFIG FIREBASE =================
const firebaseConfig = {
    apiKey: "AIzaSyA24pBo8mBWiZssPtep--MMBdB7c8_Lu4U",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================= USER =================
const user = localStorage.getItem("userPhone");

if(!user){
    window.location.href = "index.html";
}

// ================= UI ELEMENTS =================
const btn = document.getElementById("btn");
const amountInput = document.getElementById("amount");
const tidInput = document.getElementById("tid");

// ================= SELECT PRIX =================
document.querySelectorAll(".price-item").forEach(el=>{
    el.onclick = ()=>{
        document.querySelectorAll(".price-item")
        .forEach(i=>i.classList.remove("active"));

        el.classList.add("active");
        amountInput.value = el.dataset.val;
    };
});

// ================= ENVOI DEMANDE =================
btn.onclick = async ()=>{

    const amount = parseInt(amountInput.value);
    const tid = tidInput.value.trim();

    // 🔒 VALIDATION
    if(!amount || amount < 500){
        alert("❌ Minimum 500 FC");
        return;
    }

    if(!tid || tid.length < 5){
        alert("❌ ID transaction invalide");
        return;
    }

    try{
        btn.disabled = true;
        btn.innerText = "⏳ Envoi...";

        const newRef = push(ref(db, "demandes_recharges"));

        await set(newRef, {
            user: user,
            amount: amount,
            tid: tid,
            status: "pending",
            date: Date.now()
        });

        // 🔔 MESSAGE UTILISATEUR
        await push(ref(db, "messages/" + user), {
            text: "📥 Demande de recharge envoyée : " + amount + " FC",
            type: "recharge",
            date: Date.now()
        });

        alert("✅ Demande envoyée, en attente de validation admin");

        setTimeout(()=>{
            window.location.href = "dashboard.html";
        }, 1000);

    } catch(e){
        console.error(e);
        alert("❌ Erreur lors de l'envoi");

        btn.disabled = false;
        btn.innerText = "Envoyer";
    }
};
