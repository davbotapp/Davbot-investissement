import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// CONFIG
const firebaseConfig = {
    apiKey:"AIza...",
    authDomain:"starlink-investit.firebaseapp.com",
    databaseURL:"https://starlink-investit-default-rtdb.firebaseio.com",
    projectId:"starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const user = localStorage.getItem("userPhone");
if(!user) window.location.href="index.html";

// 🎯 SELECTION MONTANT
document.querySelectorAll(".price-item").forEach(el=>{
    el.onclick=()=>{
        document.querySelectorAll(".price-item")
        .forEach(i=>i.classList.remove("active"));

        el.classList.add("active");
        document.getElementById("amount").value = el.dataset.val;
    };
});

// 🚀 ENVOYER DEMANDE
document.getElementById("btn").onclick = async ()=>{

    const btn = document.getElementById("btn");
    const amount = parseInt(document.getElementById("amount").value);
    const tid = document.getElementById("tid").value.trim();

    if(!amount || amount < 5000){
        alert("❌ Minimum 5000 FC");
        return;
    }

    if(tid.length < 5){
        alert("❌ ID transaction invalide");
        return;
    }

    try{
        btn.disabled = true;
        btn.innerText = "⏳ Envoi...";

        const newRef = push(ref(db,"recharges"));

        await set(newRef,{
            user: user,
            amount: amount,
            tid: tid,
            status: "pending",
            date: Date.now()
        });

        alert("✅ Recharge envoyée\nEn attente validation admin");

        window.location.href="dashboard.html";

    }catch(e){
        console.error(e);
        alert("❌ Erreur réseau");
        btn.disabled = false;
        btn.innerText = "Envoyer";
    }
};
