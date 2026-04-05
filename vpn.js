import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ================= 🔥 CONFIG FIREBASE =================
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

// ================= 💰 ANIMATION PRIX =================
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

// ================= ✅ VALIDATION =================
window.valider = async ()=>{

    if(loading) return;

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

    loading = true;

    try{

        // 🔍 Vérifier utilisateur
        const userRef = ref(db,"users/"+user);
        const snap = await get(userRef);

        if(!snap.exists()){
            alert("❌ Utilisateur introuvable");
            loading = false;
            return;
        }

        const balance = snap.val().balance || 0;

        // 💰 Vérifier solde
        if(balance < selectedPrice){
            alert("❌ Solde insuffisant");
            loading = false;
            return;
        }

        // 💸 RETRAIT
        await update(userRef,{
            balance: balance - selectedPrice,
            lastOrder: Date.now()
        });

        // 📦 DATA PROPRE
        const id = Date.now();

        const data = {
            service: "VPN",
            user: user,
            vpnType: selectedVpn,
            reseau: reseau,
            vpnName: vpnName,
            config: config || null,
            plan: selectedPlan,
            price: selectedPrice,
            status: "pending",
            date: Date.now()
        };

        // 🔥 STRUCTURE CORRECTE
        await set(ref(db,"orders/pending/"+user+"/"+id), data);

        // 📩 MESSAGE USER
        await set(ref(db,"messages/"+user+"/"+id),{
            text: `📦 Commande VPN envoyée\n💰 ${selectedPrice} FC`,
            date: Date.now()
        });

        alert("✅ Commande envoyée avec succès");

        // 🔄 RESET
        selectedPlan = "";
        selectedPrice = 0;
        document.getElementById("price").innerText = "0 FC";

        setTimeout(()=>{
            location.href = "dashboard.html";
        }, 800);

    }catch(e){
        console.error(e);
        alert("❌ Erreur réseau");
    }

    loading = false;
};
