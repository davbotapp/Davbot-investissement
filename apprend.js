import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase, ref, get, push, update
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
const contentBox = document.getElementById("contentBox");

// ================= FORMATIONS =================
const courses = {

  web:{
    name:"HTML CSS JS",
    price:20000,
    duration:"2 mois 10 jours",
    page:"HTML.html"
  },

  ia:{
    name:"IA Bot",
    price:10000,
    duration:"10 jours",
    page:"Bot.html"
  },

  business:{
    name:"Business",
    price:15000,
    duration:"30 jours",
    page:"Business.html"
  },

  vpn:{
    name:"VPN",
    price:7000,
    duration:"7 jours",
    page:"Cvpn.html"
  }

};

// ================= CLICK CARD =================
document.querySelectorAll(".card").forEach(card=>{
  card.onclick = ()=>{
    document.querySelectorAll(".card")
    .forEach(c=>c.classList.remove("active"));

    card.classList.add("active");

    const course = card.dataset.course;

    loadCourse(course);
  };
});

// ================= LOAD =================
async function loadCourse(courseKey){

  const course = courses[courseKey];

  const userCourseRef = ref(db,`formations/${userPhone}/${courseKey}`);
  const snap = await get(userCourseRef);

  let status = "not_paid";

  if(snap.exists()){
    status = snap.val().status;
  }

  render(courseKey, course, status);
}

// ================= AFFICHAGE =================
function render(key, course, status){

  let btn = "";

  if(status === "not_paid"){
    btn = `<button onclick="payer('${key}')">💰 Acheter (${course.price} FC)</button>`;
  }

  else if(status === "pending"){
    btn = `<button disabled>⏳ En attente validation admin</button>`;
  }

  else if(status === "approved"){
    btn = `<button onclick="start('${course.page}')">🚀 Commencer</button>`;
  }

  contentBox.style.display = "block";
  contentBox.innerHTML = `
    <h3>${course.name}</h3>
    <p>⏱ Durée : ${course.duration}</p>
    <p>💰 Prix : ${course.price} FC</p>
    ${btn}
  `;
}

// ================= PAIEMENT =================
window.payer = async (courseKey)=>{

  const course = courses[courseKey];

  try{

    const userRef = ref(db,"users/"+userPhone);
    const snap = await get(userRef);

    if(!snap.exists()){
      return alert("❌ Compte introuvable");
    }

    const balance = snap.val().balance || 0;

    if(balance < course.price){
      return alert("❌ Solde insuffisant");
    }

    // 💸 RETRAIT
    await update(userRef,{
      balance: balance - course.price
    });

    // 📦 DEMANDE ADMIN
    await push(ref(db,"formations/pending"),{
      user:userPhone,
      course:courseKey,
      price:course.price,
      status:"pending",
      date:Date.now()
    });

    // 💾 USER STATUS
    await update(ref(db,`formations/${userPhone}/${courseKey}`),{
      status:"pending"
    });

    alert("✅ Paiement effectué\n⏳ En attente validation admin");

    loadCourse(courseKey);

  }catch(e){
    console.error(e);
    alert("❌ Erreur réseau");
  }
};

// ================= START =================
window.start = (page)=>{
  window.location.href = page;
};
