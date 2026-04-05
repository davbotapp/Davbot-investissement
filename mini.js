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
let selectedMode = "";
let price = 0;
let loading = false;

const formZone = document.getElementById("formZone");

// ================= TYPES =================
document.querySelectorAll(".type-item[data-type]").forEach(el=>{
el.onclick = ()=>{
document.querySelectorAll(".type-item[data-type]").forEach(i=>i.classList.remove("active"));
el.classList.add("active");

selectedType = el.dataset.type;

renderForm(selectedType);
updatePrice();
};
});

// ================= MODE =================
document.querySelectorAll("#modeSelect .type-item").forEach(el=>{
el.onclick = ()=>{
document.querySelectorAll("#modeSelect .type-item").forEach(i=>i.classList.remove("active"));
el.classList.add("active");

selectedMode = el.dataset.mode;
updatePrice();
};
});

// ================= FORM =================
function renderForm(type){

let base = `
<input id="name" placeholder="🎮 Nom du jeu">
<input id="color" placeholder="🎨 Couleur du jeu">
<textarea id="desc" placeholder="📝 Description"></textarea>
`;

let extra = "";

if(type === "slot"){
extra = `<input id="theme" placeholder="Thème">`;
}

if(type === "quiz"){
extra = `<input id="questions" placeholder="Nombre de questions">`;
}

if(type === "arcade"){
extra = `<select id="style"><option>Voiture</option><option>Tir</option></select>`;
}

if(type === "memory"){
extra = `<input id="levels" placeholder="Niveaux">`;
}

if(type === "runner"){
extra = `<input id="speed" placeholder="Vitesse">`;
}

if(type === "combat"){
extra = `<input id="characters" placeholder="Personnages">`;
}

if(type === "puzzle"){
extra = `<input id="complexity" placeholder="Complexité">`;
}

if(type === "multiplayer"){
extra = `<input id="players" placeholder="Joueurs">`;
}

formZone.innerHTML = base + extra;
}

// ================= PRIX =================
function updatePrice(){

if(!selectedType || !selectedMode){
document.getElementById("price").innerText = "💰 0 FC";
return;
}

// 🔥 BASE PAR TYPE
let base = 10000;

if(selectedType === "slot") base = 10000;
if(selectedType === "quiz") base = 8000;
if(selectedType === "arcade") base = 12000;
if(selectedType === "memory") base = 8000;
if(selectedType === "runner") base = 11000;
if(selectedType === "combat") base = 13000;
if(selectedType === "puzzle") base = 9000;
if(selectedType === "multiplayer") base = 15000;

// 🔥 MODE
if(selectedMode === "lent"){
price = Math.max(8000, base);
}

if(selectedMode === "rapide"){
price = Math.min(18000, base + 4000);
}

// 🔒 sécurité plage
if(selectedMode === "lent" && price > 12000) price = 12000;
if(selectedMode === "rapide" && price < 12000) price = 12000;

document.getElementById("price").innerText = "💰 " + price + " FC";
}

// ================= VALIDATION =================
window.valider = async ()=>{

if(loading) return;

if(!selectedType || !selectedMode){
alert("❌ Choisis type + mode");
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
balance: balance - price
});

// 📦 DATA
let data = {
service:"Mini Jeux",
type:selectedType,
mode:selectedMode,
price,
user,
statut:"pending",
date:Date.now()
};

// 🔥 champs
formZone.querySelectorAll("input, textarea, select").forEach(el=>{
if(!el.id) return;
data[el.id] = el.value || null;
});

const id = Date.now();

await set(ref(db,"orders/pending/"+user+"/"+id), data);

alert("✅ Commande envoyée !");
location.href = "dashboard.html";

}catch(e){
console.error(e);
alert("❌ Erreur");
}

loading=false;
};
