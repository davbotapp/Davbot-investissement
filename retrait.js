import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// CONFIG
const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const user = localStorage.getItem("userPhone");
if(!user) window.location.href = "index.html";

const userRef = ref(db, "users/" + user);

// 🔄 Affichage solde
onValue(userRef, snap=>{
    if(snap.exists()){
        const data = snap.val();
        document.getElementById("solde").innerText =
            (data.balance || 0).toLocaleString();
    }
});

// 🚀 ENVOYER DEMANDE
document.getElementById("btn").onclick = async ()=>{

    const amount = parseInt(document.getElementById("amount").value);
    const numero = document.getElementById("numero").value.trim();
    const method = document.getElementById("method").value;
    const status = document.getElementById("status");

    try{

        const snap = await get(userRef);
        if(!snap.exists()) return;

        const data = snap.val();
        const solde = data.balance || 0;

        if(!amount || amount < 1500){
            status.innerText = "❌ Minimum 1500 FC";
            return;
        }

        if(amount > solde){
            status.innerText = "❌ Solde insuffisant";
            return;
        }

        if(numero.length < 9){
            status.innerText = "❌ Numéro invalide";
            return;
        }

        status.innerText = "⏳ Envoi...";

        // 🔥 ENVOI (ADMIN VA VALIDER)
        await push(ref(db, "retraits"), {
            user,
            montant: amount,
            numero,
            methode: method,
            statut: "pending",
            date: Date.now()
        });

        status.style.color = "lightgreen";
        status.innerText = "✅ Demande envoyée";

        setTimeout(()=>{
            window.location.href = "dashboard.html";
        },1500);

    }catch(e){
        console.error(e);
        status.innerText = "❌ Erreur réseau";
    }
};
