import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase, ref, push, get, update
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔥 CONFIG FIREBASE
const firebaseConfig = {
  apiKey:"AIza...",
  authDomain:"starlink-investit.firebaseapp.com",
  databaseURL:"https://starlink-investit-default-rtdb.firebaseio.com",
  projectId:"starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================= VARIABLES =================
let selectedPlatform = "";
let selectedType = "Likes";
let price = 0;

// ================= INIT =================
window.addEventListener("DOMContentLoaded", ()=>{

  // 🔥 sélection plateforme
  document.querySelectorAll("#platforms .card").forEach(card=>{
    card.addEventListener("click", ()=>{
      document.querySelectorAll("#platforms .card")
      .forEach(c=>c.classList.remove("active"));

      card.classList.add("active");
      selectedPlatform = card.dataset.name;

      updatePrice();
    });
  });

  // 🔥 changement type
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

  // 🔥 PRIX BUSINESS (par 1000)
  const prices = {

    // 💸 MOINS CHER
    cheap: {
      Likes: 2900,
      Vues: 1000,
      Followers: 10000,
      "Membre Groupe": 4000,
      "Membre Chaîne": 6000,
      "Membre Canal": 5000
    },

    // 🔥 PREMIUM
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

  const user = JSON.parse(localStorage.getItem("user"));

  if(!user){
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

  // 🔍 vérifier user
  const userRef = ref(db,"users/"+user.phone);
  const snap = await get(userRef);

  if(!snap.exists()){
    alert("❌ Compte introuvable");
    return;
  }

  const balance = snap.val().balance || 0;

  if(balance < price){
    alert("❌ Solde insuffisant");
    return;
  }

  // 💸 débit
  await update(userRef,{
    balance: balance - price
  });

  // 📦 commande
  const order = {
    service: "Réseaux Sociaux",
    platform: selectedPlatform,
    type: selectedType,
    quantity: qty,
    link: link,
    plan: plan,
    price: price,
    user: user.phone,
    status: "pending",
    date: Date.now()
  };

  await push(ref(db,"orders/pending/"+user.phone), order);

  // 💬 message
  await push(ref(db,"messages/"+user.phone),{
    text:`🚀 Commande envoyée\n📱 ${selectedPlatform}\n📊 ${selectedType}\n🔢 ${qty}\n💰 ${price} FC`,
    date: Date.now()
  });

  alert("✅ Commande envoyée");

  // 🔄 reset
  document.getElementById("nombre").value = "";
  document.getElementById("link").value = "";
  document.getElementById("price").innerText = "0 FC";

  selectedPlatform = "";
  document.querySelectorAll("#platforms .card")
  .forEach(c=>c.classList.remove("active"));
};
