import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase, ref, push, get, runTransaction
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔥 CONFIG
const firebaseConfig = {
  apiKey:"AIza...",
  authDomain:"starlink-investit.firebaseapp.com",
  databaseURL:"https://starlink-investit-default-rtdb.firebaseio.com",
  projectId:"starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================= USER =================
const userPhone = localStorage.getItem("userPhone");

if(!userPhone){
  alert("❌ Connecte-toi d'abord");
  window.location.href = "index.html";
}

// ================= VARIABLES =================
let selectedPlatform = "";
let selectedType = "Likes";
let price = 0;

// ================= INIT =================
window.addEventListener("DOMContentLoaded", ()=>{

  document.querySelectorAll("#platforms .card").forEach(card=>{
    card.addEventListener("click", ()=>{
      document.querySelectorAll("#platforms .card")
      .forEach(c=>c.classList.remove("active"));

      card.classList.add("active");
      selectedPlatform = card.dataset.name;

      updatePrice();
    });
  });

  document.getElementById("type").addEventListener("change", e=>{
    selectedType = e.target.value;
    updatePrice();
  });

  document.getElementById("plan").addEventListener("change", updatePrice);
  document.getElementById("nombre").addEventListener("input", updatePrice);

});

// ================= 💰 PRIX =================
function updatePrice(){

  const plan = document.getElementById("plan").value;
  const qty = parseInt(document.getElementById("nombre").value) || 0;

  if(!selectedPlatform || qty <= 0){
    price = 0;
    document.getElementById("price").innerText = "0 FC";
    return;
  }

  const prices = {

    cheap: {
      Likes: 2900,
      Vues: 1000,
      Followers: 10000,
      "Membre Groupe": 4000,
      "Membre Chaîne": 6000,
      "Membre Canal": 5000
    },

    premium: {
      Likes: 4000,
      Vues: 1250,
      Followers: 12000,
      "Membre Groupe": 4000,
      "Membre Chaîne": 6000,
      "Membre Canal": 5000
    }

  };

  const base = prices[plan]?.[selectedType] || 0;

  // 🔥 prix sécurisé
  price = parseInt(Math.floor((qty / 1000) * base));

  document.getElementById("price").innerText = price + " FC";
}

// ================= 🚀 COMMANDER =================
window.valider = async ()=>{

  if(!userPhone){
    alert("❌ Connecte-toi");
    return;
  }

  const qty = parseInt(document.getElementById("nombre").value);
  const link = document.getElementById("link").value.trim();
  const plan = document.getElementById("plan").value;

  if(!selectedPlatform){
    alert("❌ Choisis une plateforme");
    return;
  }

  if(!qty || qty < 100){
    alert("❌ Minimum 100");
    return;
  }

  if(!link){
    alert("❌ Lien requis");
    return;
  }

  if(price <= 0){
    alert("❌ Prix invalide");
    return;
  }

  const userRef = ref(db,"users/"+userPhone);

  // ================= 🔥 TRANSACTION =================
  const result = await runTransaction(userRef, (data)=>{

    if(data === null) return;

    const balance = parseInt(data.balance) || 0;
    const prix = parseInt(price) || 0;

    console.log("BALANCE:", balance);
    console.log("PRIX:", prix);

    if(balance < prix){
      return; // ❌ stop
    }

    data.balance = balance - prix;

    return data;
  });

  if(!result.committed){
    alert("❌ Solde insuffisant");
    return;
  }

  // ================= 📦 COMMANDE =================
  const order = {
    service: "Réseaux Sociaux",
    platform: selectedPlatform,
    type: selectedType,
    quantity: qty,
    link: link,
    plan: plan,
    price: price,
    user: userPhone,
    status: "pending",
    date: Date.now()
  };

  await push(ref(db,"orders/pending/"+userPhone), order);

  // ================= 💬 MESSAGE =================
  await push(ref(db,"messages/"+userPhone),{
    text:`🚀 Commande envoyée
📱 ${selectedPlatform}
📊 ${selectedType}
🔢 ${qty}
💰 ${price} FC`,
    date: Date.now()
  });

  alert("✅ Commande envoyée");

  // ================= RESET =================
  document.getElementById("nombre").value = "";
  document.getElementById("link").value = "";
  document.getElementById("price").innerText = "0 FC";

  selectedPlatform = "";
  document.querySelectorAll("#platforms .card")
  .forEach(c=>c.classList.remove("active"));
};
