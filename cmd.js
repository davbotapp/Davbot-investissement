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

if(service === "Application"){
zone.innerHTML = `
<input type="text" id="name" placeholder="📱 Nom APK">
<input type="file" id="icon">
<input type="text" id="color" placeholder="🎨 Couleur">
<textarea id="desc" placeholder="📝 Description"></textarea>
`;
}

else if(service === "Site Web Pro"){
zone.innerHTML = `
<input type="text" id="name" placeholder="🌐 Nom du site">
<input type="text" id="color" placeholder="🎨 Couleur">
<textarea id="desc" placeholder="📝 Description"></textarea>
`;
}

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

else if(service === "Mini Jeux"){
zone.innerHTML = `
<input type="text" id="name" placeholder="🎮 Nom jeu">
<input type="text" id="color" placeholder="🎨 Couleur">
<textarea id="desc" placeholder="📝 Description"></textarea>
`;
}

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
<option>Membre Groupe</option>
<option>Membre Canal</option>
<option>Chaîne Followers</option>
</select>

<input type="number" id="nombre" placeholder="Quantité">
<input type="text" id="link" placeholder="🔗 Lien">
`;
}

else if(service === "Hébergement"){
zone.innerHTML = `
<select id="duree">
<option>7 jours</option>
<option>15 jours</option>
<option>30 jours</option>
<option>60 jours</option>
</select>

<input type="text" id="siteUrl" placeholder="🌐 Lien du site">
`;
}

else if(service === "VPN"){
zone.innerHTML = `
<input type="text" id="vpnName" placeholder="Nom VPN">

<select id="reseau">
<option>MTN</option>
<option>Airtel</option>
<option>Orange</option>
<option>Vodacom</option>
<option>africell</option>
</select>

<select id="duree">
<option>7 jour</option>
<option>15 jours</option>
<option>30 jours</option>
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

if(service === "Application") price = 45 000;
if(service === "Site Web Pro") price = 30 000;

if(service === "Intelligence Artificielle"){
const type = document.getElementById("aiType")?.value;
if(type === "fb_bot") price = 3000;
if(type === "fb_page") price = 6000;
if(type === "wa_bot") price = 5000;
if(type === "web_bot") price = 10 000;
}

if(service === "Mini Jeux") price = 10 000;

if(service === "Réseaux Sociaux"){
const type = document.getElementById("type")?.value;
const nb = parseInt(document.getElementById("nombre")?.value) || 0;

let p = 0;
if(type==="Vues") p=950;
if(type==="Likes") p=4500;
if(type==="Followers") p=12 000;
if(type==="Membre Groupe") p=5000;
if(type==="Membre Canal") p=6000;
if(type==="Chaîne Followers") p=6000;

price = (nb/1000) * p;
}

if(service === "Hébergement"){
const d = document.getElementById("duree")?.value;
if(d==="7 jours") price=3500;
if(d==="15 jours") price=6000;
if(d==="30 jours") price=8000;
if(d==="60 jours") price=12 000;
}

if(service === "VPN"){
const d = document.getElementById("duree")?.value;
if(d==="7 jour") price=2500;
if(d==="15 jours") price=5000;
if(d==="30 jours") price=8000;
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

// 📦 DATA COMPLETE
let data = {
service: service,
price: price,
user: user,
statut: "pending",
date: Date.now()
};

// 🔥 RÉCUPÉRATION CHAMPS
const inputs = document.querySelectorAll("#formZone input, #formZone select, #formZone textarea");

inputs.forEach(el=>{
if(!el.id) return;

if(el.type === "file"){
data[el.id] = el.files[0] ? el.files[0].name : null;
}else{
data[el.id] = el.value || null;
}
});

const id = Date.now();

// 🔥 SAVE
await set(ref(db,"orders/pending/"+user+"/"+id), data);

console.log("COMMANDE:", data);

alert("✅ Commande envoyée !");
window.location.href = "dashboard.html";

}catch(e){
console.error(e);
alert("❌ Erreur réseau");
}

loading=false;
};
