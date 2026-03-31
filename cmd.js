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
<input type="text" id="name" placeholder="🎮 Nom du jeu">
<textarea id="desc" placeholder="📝 Description"></textarea>

<select id="gameType">
<option>Slot</option>
<option>Memory</option>
<option>Quiz</option>
<option>Roulette</option>
<option>Coffre Mystère</option>
<option value="Autre">Autre</option>
</select>

<textarea id="customGame" placeholder="💡 Ton idée personnalisée"></textarea>

<input type="text" id="color" placeholder="🎨 Couleur">
`;
}

// 🤖 IA
else if(service === "Intelligence Artificielle"){
zone.innerHTML = `
<select id="aiType">
<option value="4000">Bot WhatsApp (4000 FC)</option>
<option value="3000">Bot Facebook (3000 FC)</option>
<option value="6000">Page Bot Facebook (6000 FC)</option>
<option value="12000">Web Bot IA (12000 FC)</option>
</select>

<input type="text" id="name" placeholder="Nom du bot">
<textarea id="desc"></textarea>
`;
}

// 🌐 SITE
else if(service === "Site Web Pro"){
zone.innerHTML = `
<input type="text" id="name" placeholder="Nom du site">

<select id="typeSite">
<option>Simple</option>
<option>Pro</option>
<option>Premium</option>
</select>

<input type="text" id="color" placeholder="Couleur">
<textarea id="desc"></textarea>
`;
}

// 📱 APP
else if(service === "Application"){
zone.innerHTML = `
<input type="text" id="name" placeholder="Nom app">

<select id="typeApp">
<option>Simple</option>
<option>Composé</option>
</select>

<input type="text" id="color">
<textarea id="desc"></textarea>
`;
}

// 🚀 BOOST RÉSEAUX
else if(service === "Réseaux Sociaux"){
zone.innerHTML = `
<input type="text" id="link" placeholder="🔗 Lien">

<select id="platform">
<option>Facebook</option>
<option>TikTok</option>
<option>Instagram</option>
<option>YouTube</option>
<option>WhatsApp</option>
<option>Telegram</option>
</select>

<select id="type">
<option>Likes</option>
<option>Vues</option>
<option>Followers</option>
<option>Membres Groupe</option>
<option>Membres Canal</option>
<option>Membres Chaîne</option>
</select>

<input type="number" id="nombre" placeholder="Quantité">
`;
}

// 🌍 HÉBERGEMENT
else if(service === "Hébergement"){
zone.innerHTML = `
<input type="text" id="siteUrl" placeholder="🌐 https://...">

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
const type = document.getElementById("gameType")?.value;

if(type === "Slot") price = 8000;
if(type === "Memory") price = 9000;
if(type === "Quiz") price = 10000;
if(type === "Roulette") price = 12000;
if(type === "Coffre Mystère") price = 15000;
if(type === "Autre") price = 15000;
}

// 🤖 IA
if(service === "Intelligence Artificielle"){
price = parseInt(document.getElementById("aiType")?.value || 0);
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
const nb = parseInt(document.getElementById("nombre")?.value) || 0;

let pricePer1000 = 0;

if(type === "Likes") pricePer1000 = 4500;
if(type === "Vues") pricePer1000 = 4000;
if(type === "Followers") pricePer1000 = 12000;
if(type === "Membres Groupe") pricePer1000 = 5000;
if(type === "Membres Canal") pricePer1000 = 6000;
if(type === "Membres Chaîne") pricePer1000 = 6000;

price = (nb / 1000) * pricePer1000;
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

// 🔐 VALIDATION BOOST
if(service === "Réseaux Sociaux"){
const link = document.getElementById("link").value.trim();
const nb = parseInt(document.getElementById("nombre").value) || 0;

if(!link.includes("http")){
alert("❌ Lien invalide");
loading = false;
return;
}

if(nb < 100){
alert("❌ Minimum 100");
loading = false;
return;
}
}

// 🎮 VALIDATION MINI JEUX
if(service === "Mini Jeux"){
const type = document.getElementById("gameType").value;
const custom = document.getElementById("customGame").value.trim();

if(type === "Autre" && custom.length < 10){
alert("❌ Décris ton jeu personnalisé");
loading = false;
return;
}
}

// 🌐 VALIDATION HÉBERGEMENT
if(service === "Hébergement"){
const url = document.getElementById("siteUrl").value.trim();

if(!url.includes("http")){
alert("❌ URL invalide");
loading = false;
return;
}
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

// 🔄 récupérer tous les champs
document.querySelectorAll("#formZone input, #formZone select, #formZone textarea")
.forEach(el=>{
data[el.id] = el.value;
});

// SAVE
const id = Date.now();

await set(ref(db,"orders/pending/"+user+"/"+id), data);

// 🔔 NOTIF ADMIN
await set(ref(db,"notifications/admin/"+id),{
user,
service, 
price,
date:Date.now()
});

alert("✅ Commande envoyée !");
window.location.href = "dashboard.html";

}catch(e){
console.error(e);
alert("❌ Erreur réseau");
}

loading = false;
};
