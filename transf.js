import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyA24pBo8mBWiZssPtep--MMBdB7c8_Lu4U",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// USER
const user = localStorage.getItem("userPhone");
if(!user) window.location.href = "index.html";

const soldeEl = document.getElementById("solde");

// 🔄 AFFICHER SOLDE
onValue(ref(db, "users/" + user), snap=>{
    if(snap.exists()){
        const data = snap.val();
        soldeEl.innerText = (data.balance || 0).toLocaleString();
    }
});

// 🚀 ENVOI DEMANDE
document.getElementById("btn").onclick = async () => {

    const receiver = document.getElementById("receiver").value.trim();
    const amount = parseInt(document.getElementById("amount").value);
    const status = document.getElementById("status");

    if(!receiver || !amount){
        status.innerText = "❌ Remplir tous les champs";
        return;
    }

    if(receiver === user){
        status.innerText = "❌ Impossible de s'envoyer à soi-même";
        return;
    }

    if(amount < 1000){
        status.innerText = "❌ Minimum 1000 FC";
        return;
    }

    try{
        status.innerText = "⏳ Vérification...";

        // vérifier utilisateur existe
        const snapReceiver = await get(ref(db, "users/" + receiver));
        if(!snapReceiver.exists()){
            status.innerText = "❌ Destinataire introuvable";
            return;
        }

        const snapUser = await get(ref(db, "users/" + user));
        const dataUser = snapUser.val();
        const balance = dataUser.balance || 0;

        if(amount > balance){
            status.innerText = "❌ Solde insuffisant";
            return;
        }

        // 🔥 ENVOI DEMANDE ADMIN
        await push(ref(db, "demandes_transferts"), {
            from: user,
            to: receiver,
            amount: amount,
            status: "pending",
            date: Date.now()
        });

        status.style.color = "lightgreen";
        status.innerText = "✅ Demande envoyée à l'admin";

        setTimeout(()=>{
            window.location.href = "dashboard.html";
        },1500);

    }catch(e){
        status.innerText = "❌ Erreur";
        console.error(e);
    }
};
