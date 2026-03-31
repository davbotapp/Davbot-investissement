import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔥 CONFIG
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

// 📦 SERVICE
const service = localStorage.getItem("serviceCommande");

const zone = document.getElementById("formZone");
const priceDisplay = document.getElementById("price");
document.getElementById("serviceName").value = service;

let loading = false;

// ================= FORM =================
function renderForm(){

// 🎮 MINI JEUX
if(service === "Mini Jeux"){
    zone.innerHTML = `
        <input type="text" id="gameName" placeholder="🎮 Nom du jeu" />
        <textarea id="desc" placeholder="📝 Description du jeu"></textarea>
        
        <select id="gameType">
            <option>Memory</option>
            <option>Quiz</option>
            <option>Slot</option>
            <option>Devinez le nombre</option>
            <option>Autre (personnalisé)</option>
        </select>

        <textarea id="customIdea" placeholder="💡 Ton idée personnalisée (optionnel)"></textarea>

        <input type="text" id="color" placeholder="🎨 Couleur principale" />
    `;
}

// 🔐 SÉCURITÉ RÉSEAUX
else if(service === "Sécurité Réseaux Sociaux"){
    zone.innerHTML = `
        <input type="text" id="account" placeholder="📱 Nom du compte" />
        <select id="platform">
            <option>Facebook</option>
            <option>WhatsApp</option>
            <option>Instagram</option>
            <option>TikTok</option>
        </select>
        <textarea id="desc" placeholder="📝 Problème ou besoin"></textarea>
    `;
}

// 🤖 IA
else if(service === "Intelligence Artificielle"){
    zone.innerHTML = `
        <select id="iaType">
            <option value="4000">Bot WhatsApp (4000 FC)</option>
            <option value="3000">Bot Facebook (3000 FC)</option>
            <option value="6000">Page Bot Facebook (6000 FC)</option>
            <option value="12000">Site Web Bot (12000 FC)</option>
        </select>

        <input type="text" id="botName" placeholder="🤖 Nom du bot" />
        <textarea id="desc" placeholder="📝 Fonction du bot"></textarea>
    `;
}

// 🌐 SITE WEB
else if(service === "Site Web Pro"){
    zone.innerHTML = `
        <input type="text" id="siteName" placeholder="🌐 Nom du site" />
        
        <select id="typeSite">
            <option>Simple</option>
            <option>Pro</option>
            <option>Premium</option>
        </select>

        <input type="text" id="color" placeholder="🎨 Couleur" />
        <textarea id="desc" placeholder="📝 Description"></textarea>
    `;
}

// 📱 APPLICATION
else if(service === "Application"){
    zone.innerHTML = `
        <input type="text" id="appName" placeholder="📱 Nom de l'application" />
        
        <select id="typeApp">
            <option>Simple</option>
            <option>Composé</option>
        </select>

        <input type="text" id="color" placeholder="🎨 Couleur" />
        <textarea id="desc"></textarea>
    `;
}

// 🚀 BOOST
else if(service === "Réseaux Sociaux"){
    zone.innerHTML = `
        <input type="text" id="link" placeholder="🔗 Lien" />
        
        <select id="type">
            <option>Vues</option>
            <option>Likes</option>
            <option>Followers</option>
        </select>

        <input type="number" id="nombre" placeholder="Quantité" />
    `;
}

// 🌍 HÉBERGEMENT
else if(service === "Hébergement"){
    zone.innerHTML = `
        <input type="text" id="siteUrl" placeholder="🌐 Lien du site" />

        <select id="duree">
            <option>7 jours</option>
            <option>15 jours</option>
            <option>30 jours</option>
            <option>60 jours</option>
        </select>
    `;
}

attachEvents();
calcPrice();
}

renderForm();

// ================= EVENTS =================
function attachEvents(){
document.querySelectorAll("#formZone input, #formZone select, #formZone textarea")
.forEach(el=>{
    el.addEventListener("input", calcPrice);
});
}

// ================= PRIX =================
function calcPrice(){

let price = 0;

// 🎮 MINI JEUX
if(service === "Mini Jeux"){
    price = 8000 + Math.floor(Math.random()*7000);
}

// 🔐 SÉCURITÉ
if(service === "Sécurité Réseaux Sociaux"){
    price = 5000;
}

// 🤖 IA
if(service === "Intelligence Artificielle"){
    price = parseInt(document.getElementById("iaType")?.value || 0);
}

// 🌐 SITE
if(service === "Site Web Pro"){
    const t = document.getElementById("typeSite")?.value;
    if(t === "Simple") price = 20000;
    if(t === "Pro") price = 30000;
    if(t === "Premium") price = 40000;
}

// 📱 APP
if(service === "Application"){
    const t = document.getElementById("typeApp")?.value;
    price = (t === "Simple") ? 40000 : 60000;
}

// 🚀 BOOST
if(service === "Réseaux Sociaux"){
    const type = document.getElementById("type")?.value;
    const nb = parseInt(document.getElementById("nombre")?.value)||0;

    let base = 0;
    if(type === "Vues") base = 4000;
    if(type === "Likes") base = 4500;
    if(type === "Followers") base = 12000;

    price = (nb/1000)*base;
}

// 🌍 HÉBERGEMENT
if(service === "Hébergement"){
    const d = document.getElementById("duree")?.value;

    if(d==="7 jours") price=3500;
    if(d==="15 jours") price=6000;
    if(d==="30 jours") price=8000;
    if(d==="60 jours") price=12000;
}

priceDisplay.innerText = Math.floor(price);
}

// ================= VALIDATION =================
window.valider = async ()=>{

if(loading) return;
loading = true;

const price = parseInt(priceDisplay.innerText);

if(price <= 0){
    alert("❌ Prix invalide");
    loading = false;
    return;
}

try{

const userRef = ref(db,"users/"+user);
const snap = await get(userRef);

if(!snap.exists()) return;

const dataUser = snap.val();
const balance = dataUser.balance || 0;

if(balance < price){
    alert("❌ Solde insuffisant");
    loading = false;
    return;
}

// 💰 UPDATE USER
await update(userRef,{
    balance: balance - price,
    lastOrder: Date.now()
});

// 📦 DATA
let data = {
    service,
    price,
    user,
    statut:"pending",
    date:Date.now()
};

document.querySelectorAll("#formZone input, #formZone select, #formZone textarea")
.forEach(el=>{
    data[el.id] = el.value;
});

const id = Date.now();

// 📦 SAVE
await set(ref(db,"orders/pending/"+user+"/"+id), data);

// 🔔 ADMIN NOTIF
await set(ref(db,"notifications/admin/"+id),{
    user, service, price, date:Date.now()
});

alert("✅ Commande envoyée !");
window.location.href = "dashboard.html";

}catch(e){
console.error(e);
alert("❌ Erreur");
}

loading = false;
};
