import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
getDatabase, ref, push, get, update
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ================= 🔥 CONFIG FIREBASE =================
const firebaseConfig = {
apiKey: "AIzaSyA24pBo8mBWiZssPtep--MMBdB7c8_Lu4U",
authDomain: "starlink-investit.firebaseapp.com",
databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================= USER =================
const userPhone = localStorage.getItem("userPhone");

if(!userPhone){
alert("❌ Connecte-toi");
window.location.href = "index.html";
}

// ================= VARIABLES =================
let selectedPlatform = "";
let selectedType = "";
let price = 0;

// ================= 💰 PRIX PAR 1000 =================
const PRICES = {

cheap: {

TikTok: { Vues:1100, Likes:3000, Followers:10000, Pack:6000 },
Facebook: { Vues:1000, Likes:2850, Followers:9500, Pack:5500 },
YouTube: { Vues:1100, Likes:3000, Followers:12000, Pack:6000 },
Instagram: { Vues:1100, Likes:2800, Followers:11000, Pack:6000 },
Telegram: { Membre:4000, Reaction:2500 },
WhatsApp: { Abonne:25000, Reaction:5000 },
Twitter: { Vues:1300, Likes:2000, Followers:8000 }

},

premium: {

TikTok: { Vues:1500, Likes:4500, Followers:40000, Pack:9000 },
Facebook: { Vues:1500, Likes:4400, Followers:35000, Pack:8800 },
Instagram: { Vues:1600, Likes:4300, Followers:28000, Pack:9000 },
YouTube: { Vues:1900, Likes:5000, Followers:50000, Pack:9000 }

}

};

// ================= 🔥 CONFIG API =================
const API_URL = "https://tonpanel.com/api/v2"; // 🔥 change
const API_KEY = "TA_API_KEY"; // 🔥 change

const SERVICES = {
cheap:{
TikTok:{ Vues:101, Likes:102, Followers:103 },
Facebook:{ Vues:201, Likes:202, Followers:203 }
},
premium:{
TikTok:{ Vues:401, Likes:402, Followers:403 }
}
};

// ================= INIT =================
window.addEventListener("DOMContentLoaded", ()=>{

// sélection plateforme
document.querySelectorAll("#platforms .card").forEach(card=>{
card.addEventListener("click", ()=>{
document.querySelectorAll("#platforms .card")
.forEach(c=>c.classList.remove("active"));

card.classList.add("active");
selectedPlatform = card.dataset.name;

updatePrice();
});
});

// type
document.getElementById("type").addEventListener("change", e=>{
selectedType = e.target.value;
updatePrice();
});

// autres
document.getElementById("plan").addEventListener("change", updatePrice);
document.getElementById("nombre").addEventListener("input", updatePrice);

});

// ================= 💰 CALCUL =================
function updatePrice(){

const plan = document.getElementById("plan").value;
const qty = parseInt(document.getElementById("nombre").value) || 0;

if(!selectedPlatform || !selectedType || qty <= 0){
price = 0;
document.getElementById("price").innerText = "0 FC";
return;
}

const base = PRICES[plan]?.[selectedPlatform]?.[selectedType];

if(!base){
price = 0;
document.getElementById("price").innerText = "Service indisponible";
return;
}

// 🔥 calcul pour n'importe quel nombre
price = Math.floor((qty / 1000) * base);

document.getElementById("price").innerText = price + " FC";
}

// ================= 📡 API =================
async function sendToAPI(order){

try{

const serviceId = SERVICES[order.plan]?.[order.platform]?.[order.type];

if(!serviceId){
console.log("❌ Service API introuvable");
return null;
}

const body = new URLSearchParams({
key: API_KEY,
action: "add",
service: serviceId,
link: order.link,
quantity: order.quantity
});

const res = await fetch(API_URL,{
method:"POST",
headers:{ "Content-Type":"application/x-www-form-urlencoded" },
body
});

const data = await res.json();
console.log("📡 API:", data);

return data;

}catch(e){
console.error("❌ API ERROR", e);
return null;
}

}

// ================= 🚀 COMMANDER =================
window.valider = async ()=>{

const qty = parseInt(document.getElementById("nombre").value);
const link = document.getElementById("link").value.trim();
const plan = document.getElementById("plan").value;

if(!selectedPlatform){
return alert("❌ Choisis une plateforme");
}

if(!selectedType){
return alert("❌ Choisis un service");
}

if(!qty || qty < 100){
return alert("❌ Minimum 100");
}

if(!link){
return alert("❌ Lien requis");
}

if(price <= 0){
return alert("❌ Service indisponible");
}

try{

const userRef = ref(db,"users/"+userPhone);
const snap = await get(userRef);

if(!snap.exists()){
return alert("❌ Compte introuvable");
}

const balance = snap.val().balance || 0;

if(Number(balance) < Number(price)){
return alert("❌ Solde insuffisant");
}

// 💸 débit
await update(userRef,{
balance: balance - price
});

// 📦 COMMANDE
let order = {
service: "Réseaux Sociaux",
platform: selectedPlatform,
type: selectedType,
quantity: qty,
link: link,
plan: plan,
price: price,

status: "processing",
api_sent: false,
api_id: null,

date: Date.now()
};

// 🔥 ENVOI API
const apiRes = await sendToAPI(order);

if(apiRes && apiRes.order){
order.api_sent = true;
order.api_id = apiRes.order;
order.status = "completed";
}else{
order.status = "error";
}

// 🔥 SAVE
await push(ref(db,"orders/"+userPhone), order);

// 📩 MESSAGE
await push(ref(db,"messages/"+userPhone),{
text:`🚀 Commande envoyée\n📱 ${selectedPlatform}\n📊 ${selectedType}\n🔢 ${qty}\n💰 ${price} FC`,
date: Date.now(),
read:false
});

alert("✅ Commande envoyée");

// RESET
document.getElementById("nombre").value = "";
document.getElementById("link").value = "";
document.getElementById("price").innerText = "0 FC";

selectedPlatform = "";
selectedType = "";

document.querySelectorAll("#platforms .card")
.forEach(c=>c.classList.remove("active"));

}catch(e){
console.error(e);
alert("❌ Erreur réseau");
}

};
