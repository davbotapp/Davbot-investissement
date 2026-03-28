import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const user = localStorage.getItem("userPhone");
if(!user) window.location.href = "index.html";

const service = localStorage.getItem("serviceCommande");

const zone = document.getElementById("formZone");
const priceDisplay = document.getElementById("price");

document.getElementById("serviceName").value = service;

// =====================
// FORMULAIRES
// =====================
function renderForm(){

if(service === "Application"){
    zone.innerHTML = `
        <select id="typeApp">
            <option>Simple</option>
            <option>Composé</option>
        </select>
        <textarea id="desc" placeholder="Description"></textarea>
    `;
}

else if(service === "Site Web Pro"){
    zone.innerHTML = `
        <select id="typeSite">
            <option>Simple</option>
            <option>Pro</option>
            <option>Premium</option>
        </select>
        <textarea id="desc"></textarea>
    `;
}

else if(service === "Hébergement"){
    zone.innerHTML = `
        <select id="duree">
            <option>7 jours</option>
            <option>15 jours</option>
            <option>30 jours</option>
            <option>Autre</option>
        </select>
        <input type="number" id="customDays" placeholder="Nombre de jours">
    `;
}

else if(service === "Réseaux Sociaux"){
    zone.innerHTML = `
        <select id="platform">
            <option>Facebook</option>
            <option>WhatsApp</option>
            <option>TikTok</option>
            <option>YouTube</option>
            <option>Instagram</option>
        </select>

        <select id="type">
            <option>Vues</option>
            <option>Likes</option>
            <option>Followers</option>
        </select>

        <input type="number" id="nombre" placeholder="Nombre">
    `;
}

else if(service === "Intelligence Artificielle"){
    zone.innerHTML = `<textarea id="desc"></textarea>`;
}

attachEvents();
calcPrice();
}

renderForm();

// =====================
// EVENTS (IMPORTANT)
// =====================
function attachEvents(){
    document.querySelectorAll("#formZone input, #formZone select")
    .forEach(el=>{
        el.addEventListener("input", calcPrice);
        el.addEventListener("change", calcPrice);
    });
}

// =====================
// CALCUL PRIX
// =====================
function calcPrice(){

    let price = 0;

    if(service === "Application"){
        const t = document.getElementById("typeApp")?.value;
        price = (t === "Simple") ? 40000 : 60000;
    }

    if(service === "Site Web Pro"){
        const t = document.getElementById("typeSite")?.value;
        if(t === "Simple") price = 20000;
        if(t === "Pro") price = 30000;
        if(t === "Premium") price = 40000;
    }

    if(service === "Hébergement"){
        const d = document.getElementById("duree")?.value;

        if(d === "7 jours") price = 3500;
        else if(d === "15 jours") price = 6000;
        else if(d === "30 jours") price = 8000;
        else {
            const days = parseInt(document.getElementById("customDays")?.value) || 0;
            price = days * 300;
        }
    }

    if(service === "Réseaux Sociaux"){
        const type = document.getElementById("type")?.value;
        const nb = parseInt(document.getElementById("nombre")?.value) || 0;

        let base = 0;
        if(type === "Vues") base = 2000;
        if(type === "Likes") base = 4000;
        if(type === "Followers") base = 12000;

        price = (nb / 1000) * base;
    }

    if(service === "Intelligence Artificielle"){
        price = 10000;
    }

    priceDisplay.innerText = Math.floor(price);
}

// =====================
// VALIDER
// =====================
window.valider = async function(){

    const price = parseInt(priceDisplay.innerText);

    if(price <= 0){
        alert("❌ Prix invalide");
        return;
    }

    const snap = await get(ref(db, "users/" + user));
    if(!snap.exists()) return;

    const dataUser = snap.val();
    const balance = dataUser.balance || 0;

    if(balance < price){
        alert("❌ Solde insuffisant");
        return;
    }

    // Déduction
    await update(ref(db, "users/" + user), {
        balance: balance - price
    });

    let data = {
        service,
        price,
        statut: "pending",
        date: Date.now(),
        user
    };

    document.querySelectorAll("#formZone input, #formZone select, #formZone textarea")
    .forEach(el=>{
        data[el.id] = el.value;
    });

    const id = Date.now();

    await set(ref(db, "orders/pending/" + user + "/" + id), data);

    alert("✅ Commande envoyée !");
    window.location.href = "dashboard.html";
};
