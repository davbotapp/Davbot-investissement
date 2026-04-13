import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase, ref, push, get, update, onValue
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

// ================= 💳 PAYER =================
window.payer = async (course, prix) => {

  try {

    const userRef = ref(db, "users/" + userPhone);
    const snap = await get(userRef);

    if(!snap.exists()){
      return alert("❌ Compte introuvable");
    }

    const balance = snap.val().balance || 0;

    if(balance < prix){
      return alert("❌ Solde insuffisant");
    }

    // 💸 RETIRER ARGENT
    await update(userRef, {
      balance: balance - prix
    });

    // 📦 ENVOYER DEMANDE ADMIN
    const formation = {
      course: course,
      price: prix,
      status: "pending_admin",
      approved: false,
      date: Date.now()
    };

    await push(ref(db, "formations/" + userPhone), formation);

    alert("✅ Paiement effectué\n⏳ En attente validation admin");

  } catch(e){
    console.error(e);
    alert("❌ Erreur");
  }
};

// ================= 🔓 ACTIVER BOUTON =================
function checkAccess(){

  const refForm = ref(db, "formations/" + userPhone);

  onValue(refForm, (snapshot)=>{

    if(!snapshot.exists()) return;

    let approved = false;

    snapshot.forEach(child=>{
      const data = child.val();

      if(data.approved === true){
        approved = true;
      }
    });

    const btn = document.getElementById("startBtn");

    if(!btn) return;

    if(approved){
      btn.classList.remove("locked");
      btn.innerText = "🚀 Commencer";
      btn.onclick = ()=>{
        window.location.href = "cours.html"; // page cours
      };
    } else {
      btn.innerText = "⏳ En attente validation admin";
    }

  });
}

// ================= INIT =================
window.addEventListener("DOMContentLoaded", ()=>{
  checkAccess();
});
