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

TikTok: {
Vues: 1100,
Likes: 3000,
Followers: 10000,
"Pack": 6000
},

Facebook: {
Vues: 1000,
Likes: 2850,
Followers: 9500,
"Pack": 5500
},

YouTube: {
Vues: 1100,
Likes: 3000,
Followers: 12000,
"Pack": 6000
},

Instagram: {
Vues: 1100,
Likes: 2800,
Followers: 11000,
"Pack": 6000
},

Telegram: {
Membre: 4000,
Reaction: 2500
},

WhatsApp: {
Abonne: 25000,
Reaction: 5000
},

X: {
Vues: 1300,
Likes: 2000,
Followers: 8000
}

},

premium: {

TikTok: {
Vues: 1500,
Likes: 4500,
Followers: 40000,
"Pack": 9000
},

Facebook: {
Vues: 1500,
Likes: 4400,
Followers: 35000,
"Pack": 88000
},

Instagram: {
Vues: 1600,
Likes: 4300,
Followers: 28000,
"Pack": 9000
},

YouTube: {
Vues: 1900,
Likes: 5000,
Followers: 50000,
"Pack": 9000
}

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
