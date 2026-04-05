import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔥 CONFIG FIREBASE
const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 👤 USER
const user = localStorage.getItem("userPhone");
if(!user){
    window.location.href = "index.html";
}

// ================= VARIABLES =================
let selectedPlatform = "";
let platformType = "";
let finalPrice = 0;

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

// ================= TYPES AUTO =================
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

// ================= ANIMATION PRIX =================
function animatePrice(target){

    let current = 0;
    const step = target / 25;

    const interval = setInterval(()=>{
        current += step;

        if(current >= target){
            current = target;
            clearInterval(interval);
        }

        document.getElementById("price").innerText =
            Math.floor(current).toLocaleString() + " FC";

    },15);
}

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

    // 💸 MOINS CHER
    if(plan === "cheap"){
        if(type==="Likes") p1000 = 2900;
        if(type==="Vues") p1000 = 1000;
        if(type==="Followers") p1000 = 10000;

        if(type==="Membre Groupe") p1000 = 4000;
        if(type==="Membre Chaîne") p1000 = 6000;
        if(type==="Membre Canal") p1000 = 6000;
    }

    // 🔥 MEILLEUR PRIX
    if(plan === "premium"){
        if(type==="Likes") p1000 = 4000;
        if(type==="Vues") p1000 = 1200;
        if(type==="Followers") p1000 = 12000;

        if(type==="Membre Groupe") p1000 = 4500;
        if(type==="Membre Chaîne") p1000 = 6500;
        if(type==="Membre Canal") p1000 = 6500;
    }

    finalPrice = Math.floor((nb / 1000) * p1000);

    animatePrice(finalPrice);
}

// ================= VALIDATION =================
window.valider = async ()=>{

    const plan = document.getElementById("plan").value;
    const type = document.getElementById("type").value;
    const nb = parseInt(document.getElementById("nombre").value);
    const link = document.getElementById("link").value.trim();

    // 🔒 VALIDATION
    if(!selectedPlatform){
        alert("❌ Choisir une plateforme");
        return;
    }

    if(!nb || nb < 1){
        alert("❌ Quantité invalide");
        return;
    }

    if(!link){
        alert("❌ Lien obligatoire");
        return;
    }

    if(finalPrice <= 0){
        alert("❌ Prix invalide");
        return;
    }

    try{

        const id = Date.now();

        await set(ref(db, "orders/pending/"+user+"/"+id), {
            platform: selectedPlatform,
            category: platformType,
            plan: plan,
            type: type,
            quantity: nb,
            link: link,
            price: finalPrice,
            status: "pending",
            date: Date.now()
        });

        alert("✅ Commande envoyée");

        // RESET
        document.getElementById("nombre").value = "";
        document.getElementById("link").value = "";
        document.getElementById("price").innerText = "0 FC";

    }catch(e){
        console.error(e);
        alert("❌ Erreur réseau");
    }
};

// ================= INIT =================
window.onload = ()=>{
    calcPrice();
};
