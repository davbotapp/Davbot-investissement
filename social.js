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
if(!user) window.location.href = "index.html";

// ================= VARIABLES =================
let selectedPlatform = "";
let plan = "";
let finalPrice = 0;

// ================= SELECT CARD =================
document.querySelectorAll(".card").forEach(card=>{
    card.onclick = ()=>{
        document.querySelectorAll(".card").forEach(c=>c.classList.remove("active"));
        card.classList.add("active");

        selectedPlatform = card.dataset.name;
        plan = card.dataset.plan;

        calcPrice();
    };
});

// ================= EVENTS =================
document.getElementById("type").addEventListener("input", calcPrice);
document.getElementById("nombre").addEventListener("input", calcPrice);

// ================= ANIMATION PRIX =================
function animatePrice(target){
    let current = 0;
    let step = target / 25;

    const interval = setInterval(()=>{
        current += step;

        if(current >= target){
            current = target;
            clearInterval(interval);
        }

        document.getElementById("price").innerText = Math.floor(current) + " FC";
    },20);
}

// ================= CALCUL PRIX =================
function calcPrice(){

    const type = document.getElementById("type").value;
    const nb = parseInt(document.getElementById("nombre").value) || 0;

    if(nb < 1 || !plan){
        document.getElementById("price").innerText = "0 FC";
        return;
    }

    let pricePer1000 = 0;

    // 🔥 PREMIUM (MEILLEUR QUALITÉ)
    if(plan === "premium"){
        if(type === "Likes") pricePer1000 = 4000;
        if(type === "Vues") pricePer1000 = 12000;
        if(type === "Followers") pricePer1000 = 12000;
    }

    // 💸 CHEAP (MOINS CHER)
    if(plan === "cheap"){
        if(type === "Likes") pricePer1000 = 3000;
        if(type === "Vues") pricePer1000 = 900;
        if(type === "Followers") pricePer1000 = 10000;
    }

    finalPrice = Math.floor((nb / 1000) * pricePer1000);

    animatePrice(finalPrice);
}

// ================= VALIDATION =================
window.valider = async ()=>{

    const loader = document.getElementById("loader");

    const type = document.getElementById("type").value;
    const nb = parseInt(document.getElementById("nombre").value);
    const link = document.getElementById("link").value.trim();

    // 🔒 VALIDATION
    if(!selectedPlatform){
        alert("❌ Choisis une plateforme");
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

        loader.style.display = "block";

        const id = Date.now();

        await set(ref(db, "orders/pending/"+user+"/"+id), {
            platform: selectedPlatform,
            plan: plan,
            type: type,
            quantity: nb,
            link: link,
            price: finalPrice,
            status: "pending",
            date: Date.now()
        });

        loader.style.display = "none";

        alert("✅ Commande envoyée avec succès");

        // 🔁 RESET
        document.getElementById("nombre").value = "";
        document.getElementById("link").value = "";
        document.getElementById("price").innerText = "0 FC";

    }catch(e){
        console.error(e);
        loader.style.display = "none";
        alert("❌ Erreur réseau");
    }
};
