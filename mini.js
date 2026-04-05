// ================= FIREBASE =================
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

// ================= USER =================
const user = localStorage.getItem("userPhone");
if(!user){
alert("❌ Connecte-toi");
location.href = "index.html";
}

// ================= VARIABLES =================
let selectedType = "";
let selectedMode = "";
let price = 0;
let loading = false;

const formZone = document.getElementById("formZone");
const priceDisplay = document.getElementById("price");

// ================= SELECT TYPE =================
document.querySelectorAll("#typeSelect .item").forEach(el=>{
el.onclick = ()=>{
document.querySelectorAll("#typeSelect .item").forEach(i=>i.classList.remove("active"));
el.classList.add("active");

selectedType = el.dataset.type;
renderForm(selectedType);
updatePrice();
};
});

// ================= SELECT MODE =================
document.querySelectorAll("#modeSelect .item").forEach(el=>{
el.onclick = ()=>{
document.querySelectorAll("#modeSelect .item").forEach(i=>i.classList.remove("active"));
el.classList.add("active");

selectedMode = el.dataset.mode;
updatePrice();
};
});

// ================= FORM =================
function renderForm(type){

let html = `
<input id="name" placeholder="🎮 Nom du jeu">
<input id="color" placeholder="🎨 Couleur">
<textarea id="desc" placeholder="📝 Description"></textarea>
`;

if(type === "slot"){
html += `<input id="theme" placeholder="🎰 Thème du slot">`;
}

if(type === "quiz"){
html += `<input id="questions" placeholder="❓ Nombre de questions">`;
}

if(type === "arcade"){
html += `<select id="style">
<option>Voiture</option>
<option>Tir</option>
<option>Course</option>
</select>`;
}

if(type === "memory"){
html += `<input id="levels" placeholder="🧩 Niveaux">`;
}

if(type === "runner"){
html += `<input id="speedGame" placeholder="🏃 Vitesse">`;
}

if(type === "combat"){
html += `<input id="characters" placeholder="🥊 Personnages">`;
}

if(type === "puzzle"){
html += `<input id="difficulty" placeholder="🧠 Difficulté">`;
}

if(type === "multiplayer"){
html += `<input id="players" placeholder="🌐 Joueurs">`;
}

formZone.innerHTML = html;
}

// ================= PRIX =================
function updatePrice(){

if(!selectedType || !selectedMode){
priceDisplay.innerText = "💰 0 FC";
return;
}

let base = 10000;

if(selectedType === "quiz") base = 8000;
if(selectedType === "memory") base = 8000;
if(selectedType === "puzzle") base = 9000;
if(selectedType === "slot") base = 10000;
if(selectedType === "runner") base = 11000;
if(selectedType === "arcade") base = 12000;
if(selectedType === "combat") base = 13000;
if(selectedType === "multiplayer") base = 15000;

price = selectedMode === "rapide" ? base + 4000 : base;

priceDisplay.innerText = "💰 " + price + " FC";
}

// ================= VALIDATION =================
window.valider = async ()=>{

if(loading) return;

if(!selectedType || !selectedMode){
alert("❌ Choisir type + mode");
return;
}

loading = true;

try{

const userRef = ref(db,"users/"+user);
const snap = await get(userRef);

if(!snap.exists()){
alert("❌ Utilisateur introuvable");
loading = false;
return;
}

const balance = snap.val().balance || 0;

if(balance < price){
alert("❌ Solde insuffisant");
loading = false;
return;
}

// 💰 RETRAIT
await update(userRef,{
balance: balance - price,
lastOrder: Date.now()
});

// 📦 DATA PRO
let data = {
service: "Mini Jeux",
user: user,
gameType: selectedType,
mode: selectedMode,
price: price,
status: "pending",
date: Date.now()
};

// 🔥 ajouter champs dynamiques
formZone.querySelectorAll("input, textarea, select").forEach(el=>{
if(!el.id) return;
data[el.id] = el.value || "";
});

// 🔥 ID UNIQUE
const id = Date.now();

// ✅ ENVOI ADMIN (FIX)
await set(ref(db,"orders/pending/"+id), data);

console.log("✅ COMMANDE MINI :", data);

alert("✅ Commande envoyée !");
location.href = "dashboard.html";

}catch(e){
console.error(e);
alert("❌ Erreur réseau");
}

loading = false;
};
