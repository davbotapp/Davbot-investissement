// 🔥 FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔥 CONFIG
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

// 🔐 USER
const user = localStorage.getItem("userPhone");
if(!user){
    window.location.href = "index.html";
}

// 🎯 ELEMENTS
const soldeEl = document.getElementById("solde");
const btn = document.getElementById("btn");
const status = document.getElementById("status");

// 🔄 SOLDE TEMPS RÉEL
onValue(ref(db, "users/" + user), snap=>{
    if(snap.exists()){
        const data = snap.val();
        soldeEl.innerText = (data.balance || 0).toLocaleString();
    }
});

// ============================
// 🚀 ENVOI DEMANDE RETRAIT
// ============================
btn.onclick = async () => {

    const amount = parseInt(document.getElementById("amount").value);
    const numero = document.getElementById("numero").value.trim();
    const method = document.getElementById("method").value;

    // 🔎 VALIDATION
    if(!amount || amount < 1500){
        status.innerText = "❌ Minimum 1500 FC";
        return;
    }

    if(!numero || numero.length < 9){
        status.innerText = "❌ Numéro invalide";
        return;
    }

    try{

        status.style.color = "#ffeb3b";
        status.innerText = "⏳ Vérification...";

        // 🔍 GET USER DATA
        const snap = await get(ref(db, "users/" + user));

        if(!snap.exists()){
            status.innerText = "❌ Utilisateur introuvable";
            return;
        }

        const data = snap.val();
        const solde = data.balance || 0;

        // 💰 CHECK SOLDE
        if(amount > solde){
            status.innerText = "❌ Solde insuffisant";
            return;
        }

        // 🔄 LOADING
        btn.disabled = true;
        btn.innerText = "⏳ Envoi...";

        // 🔥 ENVOI DEMANDE (ADMIN VALIDE)
        await push(ref(db, "demandes_retraits"), {
            telephone: user,
            montant: amount,
            methode: method,
            numero: numero,
            statut: "En attente",
            date: Date.now()
        });

        // ✅ SUCCESS
        status.style.color = "#4caf50";
        status.innerText = "✅ Demande envoyée à l'admin";

        // 🔁 RESET
        document.getElementById("amount").value = "";
        document.getElementById("numero").value = "";

        // 🔄 REDIRECTION
        setTimeout(()=>{
            window.location.href = "profil.html";
        },1500);

    } catch(e){

        console.error(e);

        status.style.color = "red";
        status.innerText = "❌ Erreur lors de l'envoi";

        btn.disabled = false;
        btn.innerText = "Envoyer la demande";
    }
};
