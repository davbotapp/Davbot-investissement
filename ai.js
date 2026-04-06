import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
    <textarea id="scenario" placeholder="Messages automatiques (ex: bienvenue...)"></textarea>
    `;
  }

  else if(type === "fb_auto"){
    box.innerHTML = `
    <input id="account" placeholder="Nom du compte Facebook">
    <textarea id="actions" placeholder="Actions (like, commentaire, auto reply...)"></textarea>
    `;
  }

  else if(type === "wa"){
    box.innerHTML = `
    <input id="number" placeholder="Numéro WhatsApp">
    <textarea id="messages" placeholder="Messages automatiques"></textarea>
    `;
  }

  else if(type === "web"){
    box.innerHTML = `
    <input id="site" placeholder="Lien du site">
    <textarea id="features" placeholder="Fonctionnalités du bot"></textarea>
    `;
  }
}

// ================= RÉCUP DATA =================
function getFormData(type){

  let data = {};

  if(type === "fb_page"){
    data.pageName = document.getElementById("pageName").value;
    data.scenario = document.getElementById("scenario").value;
  }

  if(type === "fb_auto"){
    data.account = document.getElementById("account").value;
    data.actions = document.getElementById("actions").value;
  }

  if(type === "wa"){
    data.number = document.getElementById("number").value;
    data.messages = document.getElementById("messages").value;
  }

  if(type === "web"){
    data.site = document.getElementById("site").value;
    data.features = document.getElementById("features").value;
  }

  return data;
}

// ================= VALIDATION =================
function validate(type){
  if(!type){
    alert("❌ Choisis un type de bot");
    return false;
  }
  return true;
}

// ================= ENVOI =================
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
    btn.innerText = "⏳ Envoi...";

    const extraData = getFormData(selectedType);

    // 🔥 DATA ADMIN COMPATIBLE
    const data = {
      service: "IA Bot",
      botType: selectedType,
      ...extraData,
      price,
      user,
      status: "pending",
      date: Date.now()
    };

    // 🔥 FIREBASE
    await push(ref(db, "orders/pending/" + user), data);

    // 🔔 MESSAGE USER
    await push(ref(db, "messages/" + user), {
      text: `🤖 Bot commandé (${selectedType})`,
      date: Date.now()
    });

    alert("✅ Commande envoyée");

    // RESET
    document.getElementById("formZone").innerHTML = "";
    document.getElementById("price").innerText = "0 FC";

    selectedType = "";
    price = 0;

    document.querySelectorAll(".type-item").forEach(el=>{
      el.classList.remove("active");
    });

  }catch(err){
    console.error(err);
    alert("❌ Erreur");
  }finally{
    btn.disabled = false;
    btn.innerText = "🚀 Commander";
  }
}
