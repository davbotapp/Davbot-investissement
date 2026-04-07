import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔥 CONFIG
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
let price = 0;

// ================= INIT =================
window.addEventListener("DOMContentLoaded", () => {
  initTypes();
});

// ================= TYPES =================
function initTypes(){
  const items = document.querySelectorAll("#types .type-item");

  items.forEach(el=>{
    el.addEventListener("click", ()=>{
      items.forEach(i=>i.classList.remove("active"));
      el.classList.add("active");

      selectedType = el.dataset.type;
      price = Number(el.dataset.price);

      document.getElementById("price").innerText = price + " FC";

      loadForm(selectedType);
    });
  });
}

// ================= FORM DYNAMIQUE =================
function loadForm(type){

  const box = document.getElementById("formZone");

  if(type === "fb_page"){
    box.innerHTML = `
      <input id="pageName" placeholder="Nom de la page Facebook">
      <textarea id="scenario" placeholder="Description & info pour votre bot"></textarea>
    `;
  }

  else if(type === "fb_auto"){
    box.innerHTML = `
      <input id="account" placeholder="❌❌❌">
      <textarea id="actions" placeholder="Actions (like, commentaire, auto reply...)"></textarea>
    `;
  }

  else if(type === "wa"){
    box.innerHTML = `
      <input id="number" placeholder="Numéro WhatsApp du bot si vous avez pas mette "" ">
      <textarea id="messages" placeholder="Description et info ( ex num admin , prefix...)"></textarea>
    `;
  }

  else if(type === "web"){
    box.innerHTML = `
      <input id="site" placeholder="Nom du bot">
      <textarea id="features" placeholder="Fonctionnalités du bot"></textarea>
    `;
  }
}

// ================= RÉCUP DATA =================
function getFormData(type){

  let data = {};

  if(type === "fb_page"){
    data.pageName = document.getElementById("pageName").value.trim();
    data.scenario = document.getElementById("scenario").value.trim();
  }

  if(type === "fb_auto"){
    data.account = document.getElementById("account").value.trim();
    data.actions = document.getElementById("actions").value.trim();
  }

  if(type === "wa"){
    data.number = document.getElementById("number").value.trim();
    data.messages = document.getElementById("messages").value.trim();
  }

  if(type === "web"){
    data.site = document.getElementById("site").value.trim();
    data.features = document.getElementById("features").value.trim();
  }

  return data;
}

// ================= VALIDATION =================
function validate(type){
  if(!type){
    alert("❌ Choisis un type de bot");
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

  if(!validate(selectedType)) return;

  const user = localStorage.getItem("userPhone");

  if(!user){
    alert("❌ Connecte-toi");
    return;
  }

  try{

    btn.disabled = true;
    btn.innerText = "⏳ Traitement...";

    // ================= 🔍 CHECK USER =================
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

    // ================= 💸 DÉBIT =================
    await update(userRef,{
      balance: balance - price
    });

    const extraData = getFormData(selectedType);

    // ================= 📦 COMMANDE =================
    const data = {
      service: "IA Bot",
      botType: selectedType,
      details: extraData, // ✅ STRUCTURE ADMIN
      price,
      user,
      status: "pending",
      date: Date.now()
    };

    await push(ref(db,"orders/pending/"+user), data);

    // ================= 💬 MESSAGE =================
    await push(ref(db,"messages/"+user), {
      text: `🤖 Bot commandé\n📦 ${selectedType}\n💰 ${price} FC`,
      date: Date.now()
    });

    alert("✅ Commande envoyée");

    // ================= RESET =================
    document.getElementById("formZone").innerHTML = "";
    document.getElementById("price").innerText = "0 FC";

    selectedType = "";
    price = 0;

    document.querySelectorAll(".type-item").forEach(el=>{
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
