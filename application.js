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
let price = 45000;

// ================= INIT =================
window.addEventListener("DOMContentLoaded", () => {
  initTypes();
  initSpeed();
});

// ================= TYPES =================
function initTypes(){
  const items = document.querySelectorAll(".type-item");

  items.forEach(el=>{
    el.addEventListener("click", ()=>{
      items.forEach(i=>i.classList.remove("active"));
      el.classList.add("active");
      selectedType = el.innerText.trim();
    });
  });
}

// ================= SPEED =================
function initSpeed(){
  const speeds = document.querySelectorAll("#speed div");

  speeds.forEach(el=>{
    el.addEventListener("click", ()=>{
      speeds.forEach(s=>s.classList.remove("active"));
      el.classList.add("active");

      price = Number(el.dataset.price || 45000);
      document.getElementById("price").innerText = price + " FC";
    });
  });
}

// ================= BASE64 =================
function toBase64(file){
  return new Promise((resolve)=>{
    if(!file) return resolve("");

    const reader = new FileReader();
    reader.onload = ()=> resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

// ================= VALIDATION =================
function validate(name, type){
  if(!name){
    alert("❌ Nom requis");
    return false;
  }

  if(!type){
    alert("❌ Choisis un type");
    return false;
  }

  return true;
}

// ================= 🚀 COMMANDER =================
window.valider = async ()=>{

  const btn = document.querySelector("button");

  const name = document.getElementById("name").value.trim();
  const theme = document.getElementById("theme").value.trim();
  const color = document.getElementById("color").value.trim();
  const desc = document.getElementById("desc").value.trim();

  const iconFile = document.getElementById("icon").files[0];
  const pubFile = document.getElementById("pub").files[0];

  // 🔒 VALIDATION
  if(!validate(name, selectedType)) return;

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

    const dataUser = snap.val();
    const balance = dataUser.balance || 0;

    // ❌ SOLDE INSUFFISANT
    if(balance < price){
      alert("❌ Solde insuffisant");
      return;
    }

    // ================= 💸 DÉBIT =================
    await update(userRef,{
      balance: balance - price
    });

    // ================= 📸 IMAGES =================
    const icon = await toBase64(iconFile);
    const pub = await toBase64(pubFile);

    // ================= 📦 COMMANDE =================
    const data = {
      service: "Application",
      name,
      type: selectedType,
      theme,
      color,
      desc,
      icon,
      pub,
      price,
      status: "pending",
      date: Date.now()
    };

    await push(ref(db,"orders/pending/"+user), data);

    // ================= 💬 MESSAGE =================
    await push(ref(db,"messages/"+user),{
      text:`🚀 Commande envoyée\n📱 ${name}\n💰 ${price} FC`,
      date: Date.now()
    });

    alert("✅ Commande envoyée");

    // ================= RESET =================
    document.querySelectorAll("input, textarea").forEach(el=>el.value="");

    selectedType = "";
    price = 45000;
    document.getElementById("price").innerText = "45000 FC";

    document.querySelectorAll(".type-item").forEach(el=>{
      el.classList.remove("active");
    });

  }catch(err){
    console.error(err);
    alert("❌ Erreur réseau");
  }

  finally{
    btn.disabled = false;
    btn.innerText = "🚀 Commander";
  }

};
