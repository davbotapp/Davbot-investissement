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
alert("❌ Connexion requise");
location.href = "index.html";
}

// ================= VARIABLES =================
let selectedVpn = "OpenVPN";
let selectedPlan = "";
let selectedPrice = 0;

// ================= VPN SELECT =================
document.querySelectorAll(".vpn-item").forEach(item=>{
item.onclick = ()=>{

document.querySelectorAll(".vpn-item")
.forEach(i=>i.classList.remove("active"));

item.classList.add("active");

selectedVpn = item.dataset.vpn;

};
});

// ================= PLAN SELECT =================
document.querySelectorAll(".option").forEach(opt=>{
opt.onclick = ()=>{

document.querySelectorAll(".option")
.forEach(o=>o.classList.remove("active"));

opt.classList.add("active");

selectedPlan = opt.dataset.name;
selectedPrice = parseInt(opt.dataset.price);

// 💰 update prix avec animation
animatePrice(selectedPrice);

};
});

// ================= ANIMATION PRIX =================
function animatePrice(value){

const el = document.getElementById("price");
let start = 0;

const step = ()=>{
start += Math.ceil(value / 15);

if(start >= value){
el.innerText = value.toLocaleString() + " FC";
return;
}

el.innerText = start.toLocaleString() + " FC";
requestAnimationFrame(step);
};

step();
}

// ================= VALIDATION =================
window.valider = async ()=>{

const reseau = document.getElementById("reseau").value.trim();
const vpnName = document.getElementById("vpnName").value.trim();
const config = document.getElementById("config").value.trim();

// 🔒 VALIDATION
if(!selectedPlan) return alert("❌ Choisir une durée");
if(!reseau) return alert("❌ Entrer le réseau");
if(!vpnName) return alert("❌ Nom VPN requis");

try{

const id = Date.now();

// 🔥 ENVOI ADMIN
await set(ref(db,"orders/pending/"+id),{
user: user,
service: "VPN",
type: "vpn",
vpnType: selectedVpn,
reseau: reseau,
vpnName: vpnName,
config: config,
plan: selectedPlan,
price: selectedPrice,
status: "pending",
date: Date.now()
});

alert("✅ Commande envoyée à l'admin");

// 🔄 reset
selectedPlan = "";
selectedPrice = 0;
document.getElementById("price").innerText = "0 FC";

setTimeout(()=>{
location.href = "dashboard.html";
}, 800);

}catch(e){
console.error(e);
alert("❌ Erreur réseau");
}

};
