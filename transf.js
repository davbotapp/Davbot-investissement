import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, push, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ================= CONFIG =================
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

// ================= ELEMENTS =================
const btn = document.getElementById("btn");
const toInput = document.getElementById("to");
const amountInput = document.getElementById("amount");
const statusBox = document.getElementById("status");

// ================= TRANSFERT =================
btn.onclick = async ()=>{

    const to = toInput.value.trim();
    const amount = parseInt(amountInput.value);

    // 🔒 VALIDATIONS
    if(!to || !amount){
        statusBox.innerText = "❌ Remplir tous les champs";
        return;
    }

    if(to === user){
        statusBox.innerText = "❌ Impossible de s'envoyer";
        return;
    }

    if(amount < 500){
        statusBox.innerText = "❌ Minimum 500 FC";
        return;
    }

    try{
        statusBox.innerText = "⏳ Vérification...";

        // 🔍 Vérifier destinataire
        const snapTo = await get(ref(db, "users/" + to));

        if(!snapTo.exists()){
            statusBox.innerText = "❌ Destinataire introuvable";
            return;
        }

        // 🔍 Vérifier solde utilisateur
        const snapMe = await get(ref(db, "users/" + user));

        if(!snapMe.exists()){
            statusBox.innerText = "❌ Erreur compte";
            return;
        }

        const myData = snapMe.val();
        const balance = myData.balance || 0;

        if(balance < amount){
            statusBox.innerText = "❌ Solde insuffisant";
            return;
        }

        // 🚀 ENVOI DEMANDE ADMIN
        btn.disabled = true;

        const newRef = push(ref(db, "transferts"));

        await set(newRef, {
            from: user,
            to: to,
            amount: amount,
            status: "pending",
            date: Date.now()
        });

        // 🔔 MESSAGE UTILISATEUR
        await push(ref(db, "messages/" + user), {
            text: `📤 Demande de transfert envoyée vers ${to} (${amount} FC)`,
            type: "transfert",
            date: Date.now()
        });

        statusBox.style.color = "lightgreen";
        statusBox.innerText = "✅ Demande envoyée à l'admin";

        setTimeout(()=>{
            window.location.href = "dashboard.html";
        },1200);

    }catch(e){
        console.error(e);
        statusBox.innerText = "❌ Erreur système";

        btn.disabled = false;
    }
};
