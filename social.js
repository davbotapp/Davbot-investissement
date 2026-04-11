import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase, ref, push, get, update
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔥 CONFIG FIREBASE
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
let selectedType = "";
let price = 0;

// ================= SERVICES PAR PLATEFORME =================
const servicesByPlatform = {

  TikTok: ["👁️ Vues","❤️ Likes","👤 Followers","🛒 Pack complet"],

  Facebook: ["👁️ Vues","❤️ Likes","👤 Followers","🛒 Pack complet"],

  Instagram: ["👁️ Vues","❤️ Likes","👤 Followers","🛒 Pack complet"],

  YouTube: ["👁️ Vues","❤️ Likes","👤 Followers","🛒 Pack complet"],

  "Twitter/X": ["👁️ Vues","❤️ Likes","👤 Followers"],

  Telegram: ["🧑‍🤝‍🧑 Membres","🔥 Réactions"],

  WhatsApp: ["📩 Abonnés","🔥 Réactions"],

  Snapchat: ["👁️ Vues","👤 Followers"],

  Pinterest: ["👁️ Vues","👤 Followers"],

  Threads: ["👁️ Vues","❤️ Likes"],

  Reddit: ["👁️ Vues","❤️ Likes"],

  Twitch: ["👁️ Vues","👤 Followers"],

  Spotify: ["👤 Followers","👁️ Vues"],

  LinkedIn: ["👤 Followers","❤️ Likes"],

  Discord: ["🧑‍🤝‍🧑 Membres"],

  Messenger: ["🔥 Réactions"],

  Signal: ["🔥 Réactions"]
};

// ================= NORMALISATION =================
function normalizeType(type){
  type = type.toLowerCase();

  if(type.includes("like")) return "Likes";
  if(type.includes("vue")) return "Vues";
  if(type.includes("follow")) return "Followers";
  if(type.includes("pack")) return "Pack";
  if(type.includes("membre")) return "Membre";
  if(type.includes("abonné")) return "Abonne";
  if(type.includes("réaction")) return "Reaction";

  return null;
}

// ================= PRIX =================
const prices = {

  cheap: {

    TikTok: {Vues:1100, Likes:3000, Followers:10000, Pack:6000},
    Facebook: {Vues:1000, Likes:2850, Followers:9500, Pack:5500},
    YouTube: {Vues:1100, Likes:3000, Followers:12000, Pack:6000},
    Instagram: {Vues:1100, Likes:2800, Followers:11000, Pack:6000},

    Telegram: {Membre:4000, Reaction:2500},
    WhatsApp: {Abonne:25000, Reaction:5000},

    "Twitter/X": {Vues:1300, Likes:2000, Followers:8000},

    Snapchat: {Vues:1500, Followers:9000},
    Pinterest: {Vues:1200, Followers:7000},
    Threads: {Vues:1200, Likes:2500},
    Reddit: {Vues:1400, Likes:2600},
    Twitch: {Vues:2000, Followers:15000},
    Spotify: {Followers:18000, Vues:2000},
    LinkedIn: {Followers:15000, Likes:3500},

    Discord: {Membre:5000},
    Messenger: {Reaction:3000},
    Signal: {Reaction:3000}
  },

  premium: {

    TikTok: {Vues:1500, Likes:4500, Followers:40000, Pack:9000},
    Facebook: {Vues:1500, Likes:4400, Followers:35000, Pack:8800},
    Instagram: {Vues:1600, Likes:4300, Followers:28000, Pack:9000},
    YouTube: {Vues:1900, Likes:5000, Followers:50000, Pack:9000},

    "Twitter/X": {Vues:1800, Likes:3500, Followers:20000},

    Snapchat: {Vues:2000, Followers:15000},
    Pinterest: {Vues:1800, Followers:12000},
    Threads: {Vues:1800, Likes:3500},
    Reddit: {Vues:2000, Likes:4000},
    Twitch: {Vues:3000, Followers:30000},
    Spotify: {Followers:30000, Vues:3000},
    LinkedIn: {Followers:30000, Likes:6000}
  }
};

// ================= UPDATE SERVICES =================
function updateServices(){

  const select = document.getElementById("type");
  select.innerHTML = "";

  const services = servicesByPlatform[selectedPlatform] || [];

  services.forEach(service=>{
    const option = document.createElement("option");
    option.textContent = service;
    select.appendChild(option);
  });

  selectedType = services[0] || "";

  updatePrice();
}

// ================= UPDATE PRIX =================
function updatePrice(){

  const plan = document.getElementById("plan").value;
  const qty = parseInt(document.getElementById("nombre").value) || 0;

  if(!selectedPlatform || !selectedType || qty <= 0){
    price = 0;
    document.getElementById("price").innerText = "0 FC";
    return;
  }

  const type = normalizeType(selectedType);

  const base = prices?.[plan]?.[selectedPlatform]?.[type];

  if(!base){
    document.getElementById("price").innerText = "❌ Non dispo";
    price = 0;
    return;
  }

  price = Math.floor((qty / 1000) * base);

  document.getElementById("price").innerText = price + " FC";
}

// ================= INIT =================
window.addEventListener("DOMContentLoaded", ()=>{

  document.querySelectorAll("#platforms .card").forEach(card=>{
    card.onclick = ()=>{
      document.querySelectorAll("#platforms .card")
      .forEach(c=>c.classList.remove("active"));

      card.classList.add("active");

      selectedPlatform = card.dataset.name;

      updateServices();
    };
  });

  document.getElementById("type").addEventListener("change", e=>{
    selectedType = e.target.value;
    updatePrice();
  });

  document.getElementById("plan").addEventListener("change", updatePrice);
  document.getElementById("nombre").addEventListener("input", updatePrice);

  // 🔥 auto sélection premier
  const first = document.querySelector("#platforms .card");
  if(first){
    first.classList.add("active");
    selectedPlatform = first.dataset.name;
    updateServices();
  }
});

// ================= COMMANDER =================
window.valider = async ()=>{

  const qty = parseInt(document.getElementById("nombre").value);
  const link = document.getElementById("link").value.trim();
  const plan = document.getElementById("plan").value;

  if(!selectedPlatform) return alert("❌ Choisis plateforme");
  if(!selectedType) return alert("❌ Choisis service");
  if(!qty || qty < 100) return alert("❌ Minimum 100");
  if(!link) return alert("❌ Lien requis");
  if(price <= 0) return alert("❌ Service indisponible");

  try{

    const userRef = ref(db,"users/"+userPhone);
    const snap = await get(userRef);

    if(!snap.exists()) return alert("❌ Compte introuvable");

    const balance = snap.val().balance || 0;

    if(balance < price) return alert("❌ Solde insuffisant");

    await update(userRef,{
      balance: balance - price
    });

    const order = {
      service: "Réseaux Sociaux",
      platform: selectedPlatform,
      type: selectedType,
      quantity: qty,
      link,
      plan,
      price,
      status: "pending_admin",
      apiSent: false,
      date: Date.now()
    };

    await push(ref(db,"orders/pending/"+userPhone), order);

    await push(ref(db,"messages/"+userPhone),{
      text:`🚀 Commande envoyée\n📱 ${selectedPlatform}\n📊 ${selectedType}\n🔢 ${qty}\n💰 ${price} FC`,
      date: Date.now(),
      read:false
    });

    alert("✅ Commande envoyée");

    document.getElementById("nombre").value = "";
    document.getElementById("link").value = "";
    document.getElementById("price").innerText = "0 FC";

  }catch(e){
    console.error(e);
    alert("❌ Erreur réseau");
  }
};
