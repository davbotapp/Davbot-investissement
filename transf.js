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

// 👤 USER CONNECTÉ
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
    soldeEl.innerText = (data.balance || 0).toLocaleString();
});

// ==========================
// 🚀 DEMANDE TRANSFERT
// ==========================
document.getElementById("btn").onclick = async ()=>{

    const to = document.getElementById("to").value.trim();
    const amount = parseInt(document.getElementById("amount").value);

    // 🔴 VALIDATIONS
    if(!to || to.length < 9){
        statusEl.innerText = "❌ Numéro invalide";
        return;
    }

    if(to === user){
        statusEl.innerText = "❌ Impossible de s'envoyer à soi-même";
        return;
    }

    if(!amount || amount < 500){
        statusEl.innerText = "❌ Minimum 500 FC";
        return;
    }

    try{

        // 🔍 Vérifier utilisateur source
        const snapUser = await get(ref(db, "users/" + user));
        if(!snapUser.exists()){
            statusEl.innerText = "❌ Utilisateur introuvable";
            return;
        }

        const myData = snapUser.val();
        const myBalance = myData.balance || 0;

        if(amount > myBalance){
            statusEl.innerText = "❌ Solde insuffisant";
            return;
        }

        // 🔍 Vérifier destinataire
        const snapTo = await get(ref(db, "users/" + to));
        if(!snapTo.exists()){
            statusEl.innerText = "❌ Destinataire introuvable";
            return;
        }

        statusEl.innerText = "⏳ Envoi de la demande...";

        // 🔥 ENVOI DEMANDE (ADMIN VA VALIDER)
        await push(ref(db, "transferts"), {
            from: user,
            to: to,
            amount: amount,
            status: "pending", // IMPORTANT
            date: Date.now()
        });

        statusEl.style.color = "lightgreen";
        statusEl.innerText = "✅ Demande envoyée à l'admin";

        // RESET
        document.getElementById("amount").value = "";
        document.getElementById("to").value = "";

        setTimeout(()=>{
            window.location.href = "dashboard.html";
        },1500);

    }catch(e){
        console.error(e);
        statusEl.innerText = "❌ Erreur réseau";
    }
};
