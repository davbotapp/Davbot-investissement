import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, update, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ================= 🔥 CONFIG =================
const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================= 👤 USER =================
const user = localStorage.getItem("userPhone");

if(!user){
    alert("❌ Connexion requise");
    location.href = "index.html";
}

// ================= VARIABLES =================
let selectedVpn = "OpenVPN";
let selectedPlan = "";
let selectedPrice = 0;
let loading = false;

// ================= VPN SELECT =================
document.querySelectorAll(".vpn-item").forEach(item=>{
    item.onclick = ()=>{
        document.querySelectorAll(".vpn-item")
        .forEach(i=>i.classList.remove("active"));

        item.classList.add("active");
        selectedVpn = item.dataset.vpn;
    };
});

// ================= PLAN SELECT =================
document.querySelectorAll(".option").forEach(opt=>{
    opt.onclick = ()=>{
        document.querySelectorAll(".option")
        .forEach(o=>o.classList.remove("active"));

        opt.classList.add("active");

        selectedPlan = opt.dataset.name;
        selectedPrice = parseInt(opt.dataset.price);

        animatePrice(selectedPrice);
    };
});

// ================= 💰 ANIMATION =================
function animatePrice(value){

    const el = document.getElementById("price");
    let start = 0;

    const step = ()=>{
        start += Math.ceil(value / 15);

        if(start >= value){
            el.innerText = value.toLocaleString() + " FC";
            return;
        }

        el.innerText = start.toLocaleString() + " FC";
        requestAnimationFrame(step);
    };

    step();
}

// ================= 🚀 COMMANDER =================
window.valider = async ()=>{

    if(loading) return;

    const btn = document.querySelector("button");

    const reseau = document.getElementById("reseau").value.trim();
    const vpnName = document.getElementById("vpnName").value.trim();
    const config = document.getElementById("config").value.trim();

    // 🔒 VALIDATION
    if(!selectedPlan){
        alert("❌ Choisir une durée");
        return;
    }

    if(!reseau){
        alert("❌ Entrer le réseau");
        return;
    }

    if(!vpnName){
        alert("❌ Nom VPN requis");
        return;
    }

    if(selectedPrice <= 0){
        alert("❌ Prix invalide");
        return;
    }

    try{

        loading = true;
        btn.disabled = true;
        btn.innerText = "⏳ Traitement...";

        // ================= 🔍 CHECK USER =================
        const userRef = ref(db,"users/"+user);
        const snap = await get(userRef);

        if(!snap.exists()){
            alert("❌ Utilisateur introuvable");
            return;
        }

        const dataUser = snap.val();
        const balance = dataUser.balance || 0;

        // ❌ PAS D'ARGENT
        if(balance < selectedPrice){
            alert("❌ Solde insuffisant");
            return;
        }

        // ================= 💸 DÉBIT =================
        await update(userRef,{
            balance: balance - selectedPrice,
            lastOrder: Date.now()
        });

        // ================= 📦 COMMANDE =================
        const data = {
            service: "VPN",
            vpnType: selectedVpn,
            plan: selectedPlan,

            // ✅ IMPORTANT POUR ADMIN
            details: {
                reseau,
                vpnName,
                config
            },

            price: selectedPrice,
            user,
            status: "pending",
            date: Date.now()
        };

        await push(ref(db,"orders/pending/"+user), data);

        // ================= 💬 MESSAGE =================
        await push(ref(db,"messages/"+user),{
            text: `🔐 VPN commandé\n📡 ${selectedVpn}\n💰 ${selectedPrice} FC`,
            date: Date.now()
        });

        alert("✅ Commande envoyée");

        // ================= RESET =================
        selectedPlan = "";
        selectedPrice = 0;

        document.getElementById("price").innerText = "0 FC";

        document.querySelectorAll(".option, .vpn-item").forEach(el=>{
            el.classList.remove("active");
        });

        document.querySelectorAll("input, textarea").forEach(el=>{
            el.value = "";
        });

    }catch(e){
        console.error(e);
        alert("❌ Erreur réseau");
    }

    loading = false;
    btn.disabled = false;
    btn.innerText = "🚀 Commander";
};
