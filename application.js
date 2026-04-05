import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ================= CONFIG =================
const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================= USER =================
const user = localStorage.getItem("userPhone");
if(!user) window.location.href = "index.html";

// ================= VARIABLES =================
let selectedType = "";
let price = 45000; // défaut lent
let loading = false;

// ================= TYPE APP =================
document.querySelectorAll(".type-item").forEach(el=>{
    el.onclick = ()=>{
        document.querySelectorAll(".type-item").forEach(i=>{
            i.classList.remove("active");
        });

        el.classList.add("active");
        selectedType = el.innerText;
    };
});

// ================= VITESSE =================
document.querySelectorAll("#speed div").forEach(el=>{
    el.onclick = ()=>{
        document.querySelectorAll("#speed div").forEach(i=>{
            i.classList.remove("active");
            i.style.transform = "scale(1)";
        });

        el.classList.add("active");
        el.style.transform = "scale(1.05)";

        price = parseInt(el.dataset.price);

        const priceEl = document.getElementById("price");
        priceEl.innerText = price + " FC";

        // animation
        priceEl.style.transform = "scale(1.2)";
        setTimeout(()=>{
            priceEl.style.transform = "scale(1)";
        },200);
    };
});

// ================= VALIDATION =================
window.valider = async ()=>{

if(loading) return;

const name = document.getElementById("name").value.trim();
const desc = document.getElementById("desc").value.trim();
const theme = document.getElementById("theme").value.trim();
const color = document.getElementById("color").value.trim();

const iconFile = document.getElementById("icon").files[0];
const pubFile = document.getElementById("pub").files[0];

// 🔒 VALIDATION
if(!name || !desc){
    alert("❌ Remplis le nom et la description");
    return;
}

if(!selectedType){
    alert("❌ Choisis un type d'application");
    return;
}

loading = true;

try{

    const userRef = ref(db,"users/"+user);
    const snap = await get(userRef);

    if(!snap.exists()){
        alert("❌ Utilisateur introuvable");
        loading=false;
        return;
    }

    const balance = snap.val().balance || 0;

    if(balance < price){
        alert("❌ Solde insuffisant");
        loading=false;
        return;
    }

    // 💰 RETRAIT
    await update(userRef,{
        balance: balance - price,
        lastOrder: Date.now()
    });

    // 📦 DATA
    const data = {
        service: "Application",
        user: user,
        name: name,
        type: selectedType,
        theme: theme || null,
        color: color || null,
        desc: desc,
        icon: iconFile ? iconFile.name : null,
        pub: pubFile ? pubFile.name : null,
        price: price,
        speed: price === 55000 ? "rapide" : "lent",
        statut: "pending",
        date: Date.now()
    };

    const id = Date.now();

    // 🔥 SAVE
    await set(ref(db,"orders/pending/"+user+"/"+id), data);

    console.log("COMMANDE:", data);

    alert("✅ Commande envoyée avec succès !");
    window.location.href = "dashboard.html";

}catch(e){
    console.error(e);
    alert("❌ Erreur réseau");
}

loading = false;
};
