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

        


onValue(ref(db, "demandes_recharges"), snap=>{
    const box = document.getElementById("recharges");
    box.innerHTML = "";

    const data = snap.val();
    if(!data) return;

    Object.entries(data).forEach(([id, d])=>{

        box.innerHTML += `
        <div class="card">
            👤 ${d.user}<br>
            💰 ${d.amount} FC<br>
            🧾 ID: ${d.tid}<br>

            <button onclick="validerRecharge('${id}', '${d.user}', ${d.amount})">✅ Valider</button>
            <button onclick="refuserRecharge('${id}')">❌ Refuser</button>
        </div>
        `;
    });
});
