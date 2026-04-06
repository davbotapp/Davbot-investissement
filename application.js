import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// ================= BASE64 IMAGE =================
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

// ================= ENVOI =================
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

  // 🔥 USER (IMPORTANT POUR ADMIN)
  const user = localStorage.getItem("userPhone");

  if(!user){
    alert("❌ Connecte-toi");
    return;
  }

  try{

    // UI loading
    btn.disabled = true;
    btn.innerText = "⏳ Envoi...";

    // 🔥 CONVERT IMAGES
    const icon = await toBase64(iconFile);
    const pub = await toBase64(pubFile);

    // 🔥 DATA (FORMAT ADMIN COMPATIBLE)
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
      user,
      status: "pending",
      date: Date.now()
    };

    // 🔥 PUSH
    await push(ref(db, "orders/pending/" + user), data);

    // 🔔 MESSAGE USER
    await push(ref(db, "messages/" + user), {
      text: `📦 Nouvelle commande envoyée\n📱 ${name}`,
      date: Date.now()
    });

    alert("✅ Commande envoyée");

    // 🔄 RESET
    document.querySelectorAll("input, textarea").forEach(el=>el.value="");

    selectedType = "";
    price = 45000;
    document.getElementById("price").innerText = "45000 FC";

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

};
