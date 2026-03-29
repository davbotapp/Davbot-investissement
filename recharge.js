// 🔥 FIREBASE IMPORT
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔥 CONFIG COMPLETE (IMPORTANT)
const firebaseConfig = {
    apiKey: "AIzaSyA24pBo8mBWiZssPtep--MMBdB7c8_Lu4U",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit",
    storageBucket: "starlink-investit.appspot.com",
    messagingSenderId: "807081599583",
    appId: "1:807081599583:web:e00ec3959bc4acdae031ea"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🔐 USER CONNECTÉ
const user = localStorage.getItem("userPhone");

if(!user){
    window.location.href = "index.html";
}

// 🎯 ELEMENTS
const btn = document.getElementById("btn");
const amountInput = document.getElementById("amount");
const tidInput = document.getElementById("tid");

// ============================
// 🎯 SELECTION RAPIDE MONTANT
// ============================
document.querySelectorAll(".price-item").forEach(el=>{
    el.onclick = () => {

        // reset
        document.querySelectorAll(".price-item")
        .forEach(i => i.classList.remove("active"));

        // active
        el.classList.add("active");

        // set value
        amountInput.value = el.dataset.val;
    };
});

// ============================
// 🚀 ENVOI DEMANDE RECHARGE
// ============================
btn.onclick = async () => {

    const amount = parseInt(amountInput.value);
    const tid = tidInput.value.trim();

    // 🔎 VALIDATION
    if(!amount || amount < 5000){
        alert("❌ Minimum 5000 FC");
        return;
    }

    if(!tid || tid.length < 5){
        alert("❌ ID transaction invalide");
        return;
    }

    try{

        // 🔄 UI LOADING
        btn.disabled = true;
        btn.innerText = "⏳ Envoi en cours...";

        // 🔥 CREER DEMANDE
        const newRef = push(ref(db, "demandes_recharges"));

        await set(newRef, {
            user: user,
            amount: amount,
            tid: tid,
            status: "pending",
            date: Date.now()
        });

        // ✅ SUCCESS
        alert("✅ Demande envoyée ! En attente de validation admin");

        // 🔁 RESET
        amountInput.value = "";
        tidInput.value = "";

        document.querySelectorAll(".price-item")
        .forEach(i => i.classList.remove("active"));

        // 🔄 REDIRECTION
        setTimeout(()=>{
            window.location.href = "dashboard.html";
        }, 1500);

    } catch(e){

        console.error(e);

        alert("❌ Erreur lors de l'envoi");

        // 🔁 RESET BTN
        btn.disabled = false;
        btn.innerText = "Envoyer";
    }
};
