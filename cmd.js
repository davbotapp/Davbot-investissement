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

// ================= APPLICATION =================
if(service === "Application"){
zone.innerHTML = `
<input type="text" id="name" placeholder="📱 Nom de l'application">
<input type="text" id="color" placeholder="🎨 Couleur">
<textarea id="desc" placeholder="📝 Description et utilité"></textarea>
`;
}

// ================= SITE WEB =================
else if(service === "Site Web Pro"){
zone.innerHTML = `
<input type="text" id="name" placeholder="🌐 Nom du site">
<input type="text" id="color" placeholder="🎨 Couleur du site">
<input type="text" id="importance" placeholder="⭐ Importance du site">
<textarea id="desc" placeholder="📝 Description"></textarea>
`;
}

// ================= IA =================
else if(service === "Intelligence Artificielle"){
zone.innerHTML = `
<select id="aiType">
<option value="fb_bot">Facebook Bot</option>
<option value="fb_page">Page Bot Facebook</option>
<option value="wa_bot">WhatsApp Bot</option>
<option value="web_bot">Web Bot</option>
</select>

<input type="text" id="name" placeholder="Nom du bot">
<input type="text" id="adminNumber" placeholder="📞 Numéro admin">
<input type="text" id="color" placeholder="🎨 Couleur">
<textarea id="desc" placeholder="📝 Description"></textarea>
`;
}

// ================= MINI JEUX =================
else if(service === "Mini Jeux"){
zone.innerHTML = `
<select id="gameType">
<option>Slot</option>
<option>Snack</option>
<option>Arcade</option>
<option>Quiz</option>
</select>

<input type="text" id="name" placeholder="🎮 Nom du jeu">
<input type="text" id="color" placeholder="🎨 Couleur">
<textarea id="desc" placeholder="📝 Description"></textarea>
`;
}

// ================= RÉSEAUX SOCIAUX =================
else if(service === "Réseaux Sociaux"){
zone.innerHTML = `
<select id="platform">
<option>Facebook</option>
<option>TikTok</option>
<option>YouTube</option>
<option>Instagram</option>
<option>WhatsApp</option>
<option>Telegram</option>
</select>

<select id="type">
<option>Vues</option>
<option>Likes</option>
<option>Followers</option>
</select>

<input type="number" id="nombre" placeholder="Quantité (min 100)">
<input type="text" id="link" placeholder="🔗 Lien">
`;
}

// ================= HÉBERGEMENT =================
else if(service === "Hébergement"){
zone.innerHTML = `
<select id="duree">
<option>15 jours</option>
<option>30 jours</option>
<option>60 jours</option>
</select>

<input type="text" id="siteUrl" placeholder="🌐 Lien du site">
`;
}

// ================= VPN =================
else if(service === "VPN"){
zone.innerHTML = `
<input type="text" id="vpnName" placeholder="Nom du VPN">

<select id="reseau">
<option>MTN</option>
<option>Airtel</option>
<option>Orange</option>
<option>Vodacom</option>
<option>Africell</option>
</select>

<select id="duree">
<option>7 jour</option>
<option>15 jours</option>
<option>30 jours</option>
</select>

<textarea id="config" placeholder="⚙️ Configuration VPN (facultatif)"></textarea>
`;
}

// ================= PAR DÉFAUT =================
else{
zone.innerHTML = `<p>⚠️ Service non reconnu</p>`;
}

attachEvents();
calcPrice();
}
// ================= EVENTS =================
function attachEvents(){
document.querySelectorAll("#formZone input, #formZone select")
.forEach(el=>{
el.addEventListener("input", calcPrice);
});
}

// ================= PRIX =================
function calcPrice(){

let price = 0;

// ================= FIXES =================
if(service === "Application") price = 45000;
if(service === "Site Web Pro") price = 30000;

if(service === "Intelligence Artificielle"){
const type = document.getElementById("aiType")?.value;
if(type === "fb_bot") price = 3000;
if(type === "fb_page") price = 6000;
if(type === "wa_bot") price = 5000;
if(type === "web_bot") price = 10000;
}

if(service === "Mini Jeux") price = 10000;

// ================= RÉSEAUX SOCIAUX =================
if(service === "Réseaux Sociaux"){

const type = document.getElementById("type")?.value;
const nb = parseInt(document.getElementById("nombre")?.value) || 0;

// 🔒 minimum
if(nb < 1){
priceDisplay.innerText = 0;
return;
}

// 💰 prix par unité
let unit = 0;

if(type === "Likes") unit = 3.0;
if(type === "Vues") unit = 2.0;
if(type === "Followers") unit = 12;
if(type === "Membre Groupe") unit = 5;
if(type === "Membre Canal") unit = 6;
if(type === "Chaîne Followers") unit = 8;

// 💰 calcul simple
price = Math.floor(nb * unit);
}

// ================= AUTRES =================
if(service === "Hébergement"){
const d = document.getElementById("duree")?.value;
if(d==="7 jours") price=3500;
if(d==="15 jours") price=6000;
if(d==="30 jours") price=8000;
if(d==="60 jours") price=12000;
}

if(service === "VPN"){
const d = document.getElementById("duree")?.value;
if(d==="7 jour") price=2500;
if(d==="15 jours") price=5000;
if(d==="30 jours") price=8000;
}

priceDisplay.innerText = price;
}

// ================= VALIDATION =================
window.valider = async ()=>{

if(loading) return;
loading = true;

const price = parseInt(priceDisplay.innerText);

if(price <= 0){
alert("❌ Prix invalide");
loading=false;
return;
}

try{

const userRef = ref(db,"users/"+user);
const snap = await get(userRef);

if(!snap.exists()){
loading=false;
return;
}

const dataUser = snap.val();
const balance = dataUser.balance || 0;

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
let data = {
service: service,
price: price,
user: user,
statut: "pending",
date: Date.now()
};

// 🔥 champs dynamiques
const inputs = document.querySelectorAll("#formZone input, #formZone select");

inputs.forEach(el=>{
if(!el.id) return;
data[el.id] = el.value || null;
});

const id = Date.now();

// 🔥 SAVE
await set(ref(db,"orders/pending/"+user+"/"+id), data);

alert("✅ Commande envoyée !");
window.location.href = "dashboard.html";

}catch(e){
console.error(e);
alert("❌ Erreur réseau");
}

loading=false;
};
