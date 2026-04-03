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
if(!user) window.location.href = "index.html";

// ================= TAUX =================
const RATE = 2200; // 1$ = 2200 FC

// ================= UI =================
const btn = document.getElementById("btn");
const amountInput = document.getElementById("amount");
const tidInput = document.getElementById("tid");
const currency = document.getElementById("currency");
const preview = document.getElementById("preview");

// ================= PREVIEW CONVERSION =================
function updatePreview(){

    const amount = parseFloat(amountInput.value) || 0;
    const cur = currency.value;

    if(amount <= 0){
        preview.innerHTML = "";
        return;
    }

    const fc = cur === "USD" ? amount * RATE : amount;

    preview.innerHTML = `
        💱 ${amount} ${cur === "USD" ? "$" : "FC"} 
        = <b>${Math.floor(fc)} FC</b>
    `;
}

// events
amountInput.addEventListener("input", updatePreview);
currency.addEventListener("change", updatePreview);

// ================= PRIX RAPIDES =================
document.querySelectorAll(".price-item").forEach(el=>{
    el.onclick = ()=>{
        document.querySelectorAll(".price-item")
        .forEach(i=>i.classList.remove("active"));

        el.classList.add("active");
        amountInput.value = el.dataset.val;

        updatePreview(); // 🔥 update direct
    };
});

// ================= ENVOI =================
btn.onclick = async ()=>{

    const amount = parseFloat(amountInput.value);
    const tid = tidInput.value.trim();
    const cur = currency.value;

    // 🔒 VALIDATION
    if(!amount || amount <= 0){
        alert("❌ Montant invalide");
        return;
    }

    if(cur === "FC" && amount < 500){
        alert("❌ Minimum 500 FC");
        return;
    }

    if(cur === "USD" && amount < 1){
        alert("❌ Minimum 1$");
        return;
    }

    if(!tid || tid.length < 5){
        alert("❌ ID transaction invalide");
        return;
    }

    try{
        btn.disabled = true;
        btn.innerText = "⏳ Envoi...";

        // 💰 conversion FC
        const amountFC = cur === "USD" ? amount * RATE : amount;

        const newRef = push(ref(db, "demandes_recharges"));

        await set(newRef, {
            user: user,

            // 🔥 ADMIN VOIT TOUJOURS FC
            amount: Math.floor(amountFC),

            // ℹ️ INFO BONUS
            currency: cur,
            originalAmount: amount,

            tid: tid,
            status: "pending",
            date: Date.now()
        });

        // 🔔 MESSAGE UTILISATEUR
        await push(ref(db, "messages/" + user), {
            text: `📥 Recharge envoyée\n💰 ${amount} ${cur}\n💱 = ${Math.floor(amountFC)} FC`,
            type: "recharge",
            date: Date.now()
        });

        alert("✅ Demande envoyée avec succès");

        setTimeout(()=>{
            window.location.href = "dashboard.html";
        }, 1000);

    }catch(e){
        console.error(e);
        alert("❌ Erreur réseau");

        btn.disabled = false;
        btn.innerText = "Envoyer";
    }
};
