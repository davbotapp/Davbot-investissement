import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase, ref, get, update, push
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

// ================= DONNÉES FORMATION =================
const courses = {
  web: {
    name: "HTML CSS JS",
    price: 20000,
    duration: 70, // jours (2 mois 10j)
    page: "html.html"
  },
  ia: {
    name: "IA Bot",
    price: 10000,
    duration: 10,
    page: "bot.html"
  },
  business: {
    name: "Business",
    price: 15000,
    duration: 30,
    page: "business.html"
  },
  vpn: {
    name: "VPN",
    price: 7000,
    duration: 7,
    page: "cvpn.html"
  }
};

// ================= UI =================
const contentBox = document.getElementById("contentBox");

// ================= CLICK =================
document.querySelectorAll(".card").forEach(card=>{
  card.onclick = async ()=>{

    document.querySelectorAll(".card")
    .forEach(c=>c.classList.remove("active"));

    card.classList.add("active");

    const id = card.dataset.course;
    const course = courses[id];

    // 🔍 vérifier achat
    const userCourseRef = ref(db, `formations/${userPhone}/${id}`);
    const snap = await get(userCourseRef);

    let btn = "";

    if(snap.exists()){

      const data = snap.val();

      if(data.status === "approved"){
        btn = `<button onclick="startCourse('${id}')">🚀 Commencer</button>`;
      }

      else if(data.status === "pending"){
        btn = `<button disabled>⏳ En attente validation admin</button>`;
      }

    }else{
      btn = `<button onclick="buyCourse('${id}')">💳 Acheter (${course.price} FC)</button>`;
    }

    contentBox.style.display = "block";
    contentBox.innerHTML = `
      <h3>${course.name}</h3>
      <p>📅 Durée : ${course.duration} jours</p>
      <p>💰 Prix : ${course.price} FC</p>
      ${btn}
    `;
  };
});

// ================= 💳 ACHAT =================
window.buyCourse = async (id)=>{

  const course = courses[id];

  try{

    const userRef = ref(db, "users/"+userPhone);
    const snap = await get(userRef);

    if(!snap.exists()){
      return alert("❌ Compte introuvable");
    }

    const balance = snap.val().balance || 0;

    if(balance < course.price){
      return alert("❌ Solde insuffisant");
    }

    // 💸 débit
    await update(userRef,{
      balance: balance - course.price
    });

    // 📦 demande validation admin
    await update(ref(db, `formations/${userPhone}/${id}`),{
      status: "pending",
      start: null,
      end: null
    });

    // 📩 message
    await push(ref(db,"messages/"+userPhone),{
      text:`🎓 Formation demandée: ${course.name}\n💰 ${course.price} FC\n⏳ En attente admin`,
      date: Date.now(),
      read:false
    });

    alert("✅ Paiement effectué, en attente validation admin");

  }catch(e){
    console.error(e);
    alert("❌ Erreur");
  }
};

// ================= 🚀 START =================
window.startCourse = async (id)=>{

  const course = courses[id];

  const refCourse = ref(db, `formations/${userPhone}/${id}`);
  const snap = await get(refCourse);

  if(!snap.exists()){
    return alert("❌ Accès refusé");
  }

  const data = snap.val();

  if(data.status !== "approved"){
    return alert("⛔ Attends validation admin");
  }

  const now = Date.now();

  // 🔥 première fois → définir durée
  if(!data.start){

    const end = now + (course.duration * 24 * 60 * 60 * 1000);

    await update(refCourse,{
      start: now,
      end: end
    });

  }else{

    // 🔥 vérifier expiration
    if(now > data.end){
      return alert("⛔ Formation expirée");
    }

  }

  // 🔥 redirection vers cours
  window.location.href = course.page;
};
