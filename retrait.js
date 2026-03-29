import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔥 CONFIG FIREBASE
const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 👤 UTILISATEUR
const user = localStorage.getItem("userPhone");
if(!user) window.location.href = "index.html";

// 📌 ELEMENTS
const soldeEl = document.getElementById("solde");
const statusEl = document.getElementById("status");

// ==========================
// 🔄 SOLDE EN TEMPS RÉEL
// ==========================
onValue(ref(db, "users/" + user), snap=>{
    if(!snap.exists()) return;

    const data = snap.val();
    const solde = data.balance || 0;

    soldeEl.innerText = solde.toLocaleString();
});

// ==========================
// 🚀 DEMANDE RETRAIT
// ==========================
document.getElementById("btn").onclick = async ()=>{

    const amount = parseInt(document.getElementById("amount").value);
    const numero = document.getElementById("numero").value.trim();
    const method = document.getElementById("method").value;

    // 🔴 VALIDATION
    if(!amount || amount < 1500){
        statusEl.innerText = "❌ Minimum 1500 FC";
        return;
    }

    if(numero.length < 9){
        statusEl.innerText = "❌ Numéro invalide";
        return;
    }

    try{

        const snap = await get(ref(db, "users/" + user));
        if(!snap.exists()) return;

        const data = snap.val();
        const solde = data.balance || 0;

        if(amount > solde){
            statusEl.innerText = "❌ Solde insuffisant";
            return;
        }

        statusEl.innerText = "⏳ Envoi en cours...";

        // 🔥 ENVOI DEMANDE
        await push(ref(db, "demandes_retraits"), {
            user: user,
            montant: amount,
            numero: numero,
            methode: method,
            statut: "pending", // IMPORTANT POUR ADMIN
            date: Date.now()
        });

        statusEl.style.color = "lightgreen";
        statusEl.innerText = "✅ Demande envoyée";

        // 🔄 RESET
        document.getElementById("amount").value = "";
        document.getElementById("numero").value = "";

        // 🔁 REDIRECTION
        setTimeout(()=>{
            window.location.href = "profil.html";
        },1500);

    }catch(e){
        console.error(e);
        statusEl.innerText = "❌ Erreur réseau";
    }
};
