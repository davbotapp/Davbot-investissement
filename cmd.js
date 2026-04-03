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

if(service === "Réseaux Sociaux"){
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
<input type="text" id="link" placeholder="🔗 Lien">`;
}

attachEvents();
calcPrice();
}

renderForm();

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

if(service === "Réseaux Sociaux"){

const type = document.getElementById("type")?.value;
let nb = parseInt(document.getElementById("nombre")?.value) || 0;

// 🔒 minimum
if(nb < 100){
priceDisplay.innerText = 0;
return;
}

// 🔥 TES PRIX
let p1000 = 0;
let p10000 = 0;

if(type === "Likes"){
p1000 = 4000;
p10000 = 20000;
}

if(type === "Vues"){
p1000 = 1500;
p10000 = 10000;
}

if(type === "Followers"){
p1000 = 12000;
p10000 = 80000;
}

// ================= CALCUL PRO =================

// 🔹 cas 1 : petit volume
if(nb <= 1000){
price = (nb / 1000) * p1000;
}

// 🔹 cas 2 : moyen volume
else if(nb <= 10000){

let part1 = p1000;

let reste = nb - 1000;

// prix moyen progressif
let prixMilieu = (p1000 + p10000) / 2;

let part2 = (reste / 1000) * prixMilieu;

price = part1 + part2;
}

// 🔹 cas 3 : gros volume (réduction)
else{

let base = (nb / 1000) * p10000;

let discount = 0.1 + (nb / 100000); // 10% → 20%
if(discount > 0.2) discount = 0.2;

price = base * (1 - discount);
}

// 🔒 sécurité
price = Math.max(100, Math.floor(price));
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
