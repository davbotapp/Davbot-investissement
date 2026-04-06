import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase, ref, push, get, update
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔥 CONFIG
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
let selectedType = "Likes";
let price = 0;

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

  price = Math.floor((qty / 1000) * base);

  document.getElementById("price").innerText = price + " FC";
}

// ================= 🚀 COMMANDER =================
window.valider = async ()=>{

  const qty = parseInt(document.getElementById("nombre").value);
  const link = document.getElementById("link").value.trim();
  const plan = document.getElementById("plan").value;

  if(!selectedPlatform){
    return alert("❌ Choisis une plateforme");
  }

  if(!qty || qty < 100){
    return alert("❌ Minimum 100");
  }

  if(!link){
    return alert("❌ Lien requis");
  }

  if(price <= 0){
    return alert("❌ Prix invalide");
  }

  try{

    const userRef = ref(db,"users/"+userPhone);
    const snap = await get(userRef);

    if(!snap.exists()){
      return alert("❌ Compte introuvable");
    }

    const balance = snap.val().balance || 0;

    console.log("💰 Solde:", balance, "| Prix:", price);

    // 🔥 FIX IMPORTANT
    if(Number(balance) < Number(price)){
      return alert("❌ Solde insuffisant");
    }

    // 💸 DEBIT
    await update(userRef,{
      balance: balance - price
    });

    // 📦 COMMANDE
    const order = {
      service: "Réseaux Sociaux",
      platform: selectedPlatform,
      type: selectedType,
      quantity: qty,
      link: link,
      plan: plan,
      price: price,
      status: "pending",
      date: Date.now()
    };

    await push(ref(db,"orders/pending/"+userPhone), order);

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
    document.querySelectorAll("#platforms .card")
    .forEach(c=>c.classList.remove("active"));

  }catch(e){
    console.error(e);
    alert("❌ Erreur réseau");
  }
};
