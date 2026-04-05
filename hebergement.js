import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ================= CONFIG =================
const firebaseConfig = {
apiKey: "AIza...",
authDomain: "starlink-investit.firebaseapp.com",
databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================= USER =================
const user = localStorage.getItem("userPhone");
if(!user){
alert("❌ Connecte-toi");
location.href="index.html";
}

let selectedPlan = "";
let selectedPrice = 0;
let loading = false;

// ================= SELECT PLAN =================
document.querySelectorAll(".option").forEach(opt=>{
opt.onclick=()=>{
document.querySelectorAll(".option").forEach(o=>o.classList.remove("active"));
opt.classList.add("active");

selectedPlan = opt.dataset.name;
selectedPrice = parseInt(opt.dataset.price);

document.getElementById("price").innerText = selectedPrice+" FC";
};
});

// ================= VALIDATION =================
window.valider = async()=>{

if(loading) return;

const siteName = document.getElementById("siteName").value.trim();
const siteUrl = document.getElementById("siteUrl").value.trim();

if(!selectedPlan) return alert("❌ Choisir durée");
if(!siteName) return alert("❌ Nom requis");
if(!siteUrl) return alert("❌ Lien requis");

loading = true;

try{

// 🔥 CHECK USER
const userRef = ref(db,"users/"+user);
const snap = await get(userRef);

if(!snap.exists()){
alert("❌ Utilisateur introuvable");
loading=false;
return;
}

const balance = snap.val().balance || 0;

if(balance < selectedPrice){
alert("❌ Solde insuffisant");
loading=false;
return;
}

// 💰 RETRAIT
await update(userRef,{
balance: balance - selectedPrice,
lastOrder: Date.now()
});

// 📦 DATA COMMANDE
const data = {
service: "Hébergement",
user: user,
siteName: siteName,
siteUrl: siteUrl,
plan: selectedPlan,
price: selectedPrice,
status: "pending",
date: Date.now()
};

const id = Date.now();

// 🔥 ENVOI ADMIN (IMPORTANT)
await set(ref(db,"orders/pending/"+id), data);

console.log("✅ COMMANDE HÉBERGEMENT :", data);

alert("✅ Commande envoyée !");
location.href="dashboard.html";

}catch(e){
console.error(e);
alert("❌ Erreur réseau");
}

loading = false;
};
