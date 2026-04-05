import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ================= FIREBASE =================
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

if(!user){
    alert("❌ Connecte-toi");
    location.href = "index.html";
}

// ================= VARIABLES =================
let selectedPlatform = "";
let platformType = "";
let finalPrice = 0;
let loading = false;

// ================= SELECT PLATFORM =================
document.querySelectorAll(".card").forEach(card=>{
    card.onclick = ()=>{
        document.querySelectorAll(".card").forEach(c=>c.classList.remove("active"));
        card.classList.add("active");

        selectedPlatform = card.dataset.name;
        platformType = card.dataset.type;

        updateTypes();
        calcPrice();
    };
});

// ================= TYPES =================
function updateTypes(){

    const typeSelect = document.getElementById("type");

    if(platformType === "social"){
        typeSelect.innerHTML = `
            <option>Likes</option>
            <option>Vues</option>
            <option>Followers</option>
        `;
    }

    if(platformType === "messaging"){
        typeSelect.innerHTML = `
            <option>Membre Groupe</option>
            <option>Membre Chaîne</option>
            <option>Membre Canal</option>
        `;
    }
}

// ================= EVENTS =================
document.getElementById("plan").addEventListener("input", calcPrice);
document.getElementById("type").addEventListener("input", calcPrice);
document.getElementById("nombre").addEventListener("input", calcPrice);

// ================= CALCUL PRIX =================
function calcPrice(){

    const plan = document.getElementById("plan").value;
    const type = document.getElementById("type").value;
    const nb = parseInt(document.getElementById("nombre").value) || 0;

    if(nb <= 0){
        document.getElementById("price").innerText = "0 FC";
        return;
    }

    let p1000 = 0;

    // 💸 CHEAP
    if(plan === "cheap"){
        if(type==="Likes") p1000 = 2900;
        if(type==="Vues") p1000 = 1000;
        if(type==="Followers") p1000 = 10000;

        if(type==="Membre Groupe") p1000 = 4000;
        if(type==="Membre Chaîne") p1000 = 6000;
        if(type==="Membre Canal") p1000 = 6000;
    }

    // 🔥 PREMIUM
    if(plan === "premium"){
        if(type==="Likes") p1000 = 4000;
        if(type==="Vues") p1000 = 1200;
        if(type==="Followers") p1000 = 12000;

        if(type==="Membre Groupe") p1000 = 4500;
        if(type==="Membre Chaîne") p1000 = 6500;
        if(type==="Membre Canal") p1000 = 6500;
    }

    finalPrice = Math.floor((nb / 1000) * p1000);

    document.getElementById("price").innerText =
        finalPrice.toLocaleString() + " FC";
}

// ================= VALIDATION =================
window.valider = async ()=>{

    if(loading) return;

    const plan = document.getElementById("plan").value;
    const type = document.getElementById("type").value;
    const nb = parseInt(document.getElementById("nombre").value);
    const link = document.getElementById("link").value.trim();

    // 🔒 VALIDATION
    if(!selectedPlatform){
        alert("❌ Choisir plateforme");
        return;
    }

    if(!nb || nb < 1){
        alert("❌ Quantité invalide");
        return;
    }

    if(!link){
        alert("❌ Lien requis");
        return;
    }

    if(finalPrice <= 0){
        alert("❌ Prix invalide");
        return;
    }

    loading = true;

    try{

        // 🔍 CHECK USER
        const userRef = ref(db,"users/"+user);
        const snap = await get(userRef);

        if(!snap.exists()){
            alert("❌ Utilisateur introuvable");
            loading = false;
            return;
        }

        const balance = snap.val().balance || 0;

        // 💰 CHECK SOLDE
        if(balance < finalPrice){
            alert("❌ Solde insuffisant");
            loading = false;
            return;
        }

        // 💸 RETRAIT
        await update(userRef,{
            balance: balance - finalPrice,
            lastOrder: Date.now()
        });

        // 📦 DATA PRO
        const id = Date.now();

        const data = {
            service: "Réseaux Sociaux",
            user: user,
            platform: selectedPlatform,
            category: platformType,
            plan: plan,
            type: type,
            quantity: nb,
            link: link,
            price: finalPrice,
            status: "pending",
            date: Date.now()
        };

        // 🔥 STRUCTURE FIX (IMPORTANT)
        await set(ref(db,"orders/pending/"+user+"/"+id), data);

        console.log("✅ COMMANDE SOCIAL :", data);

        alert("✅ Commande envoyée !");
        location.href = "dashboard.html";

    }catch(e){
        console.error(e);
        alert("❌ Erreur réseau");
    }

    loading = false;
};

// ================= INIT =================
window.onload = ()=>{
    calcPrice();
};
