import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔥 CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "starlink-investit.firebaseapp.com",
  databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
  projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================= VARIABLES =================
let selectedType = "";
let selectedMode = "";
let price = 0;

// ================= INIT =================
window.addEventListener("DOMContentLoaded", () => {
  initType();
  initMode();
});

// ================= TYPE =================
function initType(){
  const items = document.querySelectorAll("#typeSelect .item");

  items.forEach(el=>{
    el.addEventListener("click", ()=>{
      items.forEach(i=>i.classList.remove("active"));
      el.classList.add("active");

      selectedType = el.dataset.type;
      loadForm(selectedType);
      updatePrice();
    });
  });
}

// ================= MODE =================
function initMode(){
  const items = document.querySelectorAll("#modeSelect .item");

  items.forEach(el=>{
    el.addEventListener("click", ()=>{
      items.forEach(i=>i.classList.remove("active"));
      el.classList.add("active");

      selectedMode = el.dataset.mode;
      updatePrice();
    });
  });
}

// ================= PRIX =================
function updatePrice(){

  if(!selectedType || !selectedMode){
    price = 0;
  } else {

    const base = {
      slot: 5000,
      quiz: 4000,
      arcade: 6000,
      memory: 3500,
      runner: 7000,
      combat: 8000,
      puzzle: 4500,
      multiplayer: 12000
    };

    price = base[selectedType] || 4000;

    if(selectedMode === "rapide"){
      price += 2000;
    }
  }

  document.getElementById("price").innerText = price + " FC";
}

// ================= FORM =================
function loadForm(type){

  const box = document.getElementById("formZone");

  if(type === "slot"){
    box.innerHTML = `
      <input id="name" placeholder="Nom du jeu">
      <textarea id="theme" placeholder="Thème du slot"></textarea>
    `;
  }

  else if(type === "quiz"){
    box.innerHTML = `
      <input id="name" placeholder="Nom du quiz">
      <textarea id="questions" placeholder="Questions / réponses"></textarea>
    `;
  }

  else if(type === "arcade"){
    box.innerHTML = `
      <input id="name" placeholder="Nom du jeu">
      <textarea id="style" placeholder="Style du jeu"></textarea>
    `;
  }

  else if(type === "multiplayer"){
    box.innerHTML = `
      <input id="name" placeholder="Nom du jeu">
      <textarea id="server" placeholder="Type serveur"></textarea>
    `;
  }

  else{
    box.innerHTML = `
      <input id="name" placeholder="Nom du jeu">
      <textarea id="desc" placeholder="Description"></textarea>
    `;
  }
}

// ================= DATA =================
function getFormData(){
  const inputs = document.querySelectorAll("#formZone input, #formZone textarea");

  let data = {};
  inputs.forEach(el=>{
    data[el.id] = el.value.trim();
  });

  return data;
}

// ================= VALIDATION =================
function validate(){

  if(!selectedType){
    alert("❌ Choisis un type de jeu");
    return false;
  }

  if(!selectedMode){
    alert("❌ Choisis un mode");
    return false;
  }

  if(price <= 0){
    alert("❌ Prix invalide");
    return false;
  }

  return true;
}

// ================= 🚀 COMMANDER =================
window.valider = async ()=>{

  const btn = document.querySelector("button");

  if(!validate()) return;

  const user = localStorage.getItem("userPhone");

  if(!user){
    alert("❌ Connecte-toi");
    return;
  }

  try{

    btn.disabled = true;
    btn.innerText = "⏳ Traitement...";

    // 🔍 CHECK USER
    const userRef = ref(db,"users/"+user);
    const snap = await get(userRef);

    if(!snap.exists()){
      alert("❌ Compte introuvable");
      return;
    }

    const userData = snap.val();
    const balance = userData.balance || 0;

    // ❌ PAS D'ARGENT
    if(balance < price){
      alert("❌ Solde insuffisant");
      return;
    }

    // 💸 DÉBIT
    await update(userRef,{
      balance: balance - price
    });

    const extra = getFormData();

    // 📦 COMMANDE
    const data = {
      service: "Mini Jeux",
      type: selectedType,
      mode: selectedMode,
      details: extra, // ✅ IMPORTANT POUR ADMIN
      price,
      user,
      status: "pending",
      date: Date.now()
    };

    await push(ref(db,"orders/pending/"+user), data);

    // 💬 MESSAGE
    await push(ref(db,"messages/"+user), {
      text: `🎮 Jeu commandé\n📦 ${selectedType}\n💰 ${price} FC`,
      date: Date.now()
    });

    alert("✅ Commande envoyée");

    // RESET
    document.getElementById("formZone").innerHTML = "";
    document.getElementById("price").innerText = "0 FC";

    selectedType = "";
    selectedMode = "";
    price = 0;

    document.querySelectorAll(".item").forEach(el=>{
      el.classList.remove("active");
    });

  }catch(err){

    console.error(err);
    alert("❌ Erreur réseau");

  }finally{

    btn.disabled = false;
    btn.innerText = "🚀 Commander";
  }
};
