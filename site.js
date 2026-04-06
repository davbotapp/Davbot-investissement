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
let price = 35000;

// ================= INIT =================
window.addEventListener("DOMContentLoaded", () => {
  initTypes();
  initSpeed();
});

// ================= TYPE =================
function initTypes(){
  const items = document.querySelectorAll("#types .type-item");

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
  const speeds = document.querySelectorAll("#speed .type-item");

  speeds.forEach(el=>{
    el.addEventListener("click", ()=>{
      speeds.forEach(s=>s.classList.remove("active"));
      el.classList.add("active");

      price = Number(el.dataset.price || 35000);
      document.getElementById("price").innerText = price + " FC";
    });
  });
}

// ================= IMAGE =================
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
    alert("❌ Nom du site requis");
    return false;
  }

  if(!type){
    alert("❌ Choisis un type de site");
    return false;
  }

  return true;
}

// ================= 🚀 COMMANDER =================
window.valider = async ()=>{

  const btn = document.querySelector("button");

  const name = document.getElementById("name").value.trim();
  const color = document.getElementById("color").value.trim();
  const importance = document.getElementById("importance").value.trim();
  const desc = document.getElementById("desc").value.trim();
  const features = document.getElementById("features").value.trim();

  const imageFile = document.getElementById("image").files[0];

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

    // ================= 📸 IMAGE =================
    const image = await toBase64(imageFile);

    // ================= 📦 COMMANDE =================
    const data = {
      service: "Site Web Pro",
      name,
      type: selectedType,
      color,
      importance,
      desc,
      features,
      image,
      price,
      status: "pending",
      date: Date.now()
    };

    await push(ref(db,"orders/pending/"+user), data);

    // ================= 💬 MESSAGE =================
    await push(ref(db,"messages/"+user), {
      text: `🌐 Commande site envoyée\n💻 ${name}\n💰 ${price} FC`,
      date: Date.now()
    });

    alert("✅ Commande envoyée");

    // ================= RESET =================
    document.querySelectorAll("input, textarea").forEach(el=>el.value="");

    selectedType = "";
    price = 35000;
    document.getElementById("price").innerText = "35000 FC";

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
