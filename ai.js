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
if(!user) location.href = "index.html";

let selectedType = "";
let price = 0;
let loading = false;

const formZone = document.getElementById("formZone");

// ================= TYPES =================
document.querySelectorAll(".type-item").forEach(el=>{
    el.onclick = ()=>{

        document.querySelectorAll(".type-item").forEach(i=>i.classList.remove("active"));
        el.classList.add("active");

        selectedType = el.dataset.type;
        price = parseInt(el.dataset.price);

        renderForm(selectedType);

        document.getElementById("price").innerText = "💰 " + price + " FC";
    }
});

// ================= FORMULAIRES =================
function renderForm(type){

if(type === "fb_page"){
formZone.innerHTML = `
<input id="pageLink" placeholder="Lien page Facebook">
<input id="admin" placeholder="Numéro admin">
<textarea id="desc" placeholder="Fonction du bot"></textarea>
`;
}

else if(type === "fb_goat"){
formZone.innerHTML = `
<input id="account" placeholder="Compte Facebook">
<input id="admin" placeholder="Numéro admin">
<textarea id="strategy" placeholder="Stratégie Goat"></textarea>
`;
}

else if(type === "fb_auto"){
formZone.innerHTML = `
<input id="page" placeholder="Page Facebook">
<input id="reply" placeholder="Réponse automatique">
<textarea id="keywords" placeholder="Mots-clés"></textarea>
`;
}

else if(type === "wa"){
formZone.innerHTML = `
<input id="number" placeholder="Numéro WhatsApp">
<input id="autoReply" placeholder="Message automatique">
<textarea id="commands" placeholder="Commandes du bot"></textarea>
`;
}

else if(type === "web"){
formZone.innerHTML = `
<input id="site" placeholder="Lien du site">
<input id="botName" placeholder="Nom du bot">
<textarea id="features" placeholder="Fonctionnalités"></textarea>
`;
}

}

// ================= VALIDATION =================
window.valider = async ()=>{

if(loading) return;

if(!selectedType){
alert("❌ Choisis un type de bot");
return;
}

loading = true;

try{

const userRef = ref(db,"users/"+user);
const snap = await get(userRef);

if(!snap.exists()) return;

const balance = snap.val().balance || 0;

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

// 📦 DATA BASE
let data = {
service:"Intelligence Artificielle",
type:selectedType,
user:user,
price,
statut:"pending",
date:Date.now()
};

// 🔥 RÉCUP CHAMPS
const inputs = formZone.querySelectorAll("input, textarea");

inputs.forEach(el=>{
if(!el.id) return;
data[el.id] = el.value || null;
});

const id = Date.now();

// SAVE
await set(ref(db,"orders/pending/"+user+"/"+id), data);

alert("✅ Bot commandé !");
location.href="dashboard.html";

}catch(e){
console.error(e);
alert("❌ Erreur");
}

loading=false;
};
