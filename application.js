import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// CONFIG
const firebaseConfig = {
apiKey: "AIza...",
authDomain: "starlink-investit.firebaseapp.com",
databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// USER
const user = localStorage.getItem("userPhone");
if(!user) location.href = "index.html";

// ================= TYPE SELECT =================
let selectedType = "";

document.querySelectorAll(".type-item").forEach(el=>{
    el.onclick = ()=>{
        document.querySelectorAll(".type-item").forEach(i=>i.classList.remove("active"));
        el.classList.add("active");
        selectedType = el.innerText;
    }
});

// ================= SPEED =================
let price = 45000;

document.querySelectorAll("#speed div").forEach(el=>{
    el.onclick = ()=>{
        document.querySelectorAll("#speed div").forEach(i=>i.classList.remove("active"));
        el.classList.add("active");

        price = parseInt(el.dataset.price);
        document.getElementById("price").innerText = price + " FC";
    }
});

// ================= VALIDATION =================
window.valider = async ()=>{

const name = document.getElementById("name").value;
const desc = document.getElementById("desc").value;

if(!name || !desc){
    alert("❌ Remplis tous les champs");
    return;
}

try{

const userRef = ref(db,"users/"+user);
const snap = await get(userRef);

if(!snap.exists()) return;

const balance = snap.val().balance || 0;

if(balance < price){
    alert("❌ Solde insuffisant");
    return;
}

// RETRAIT
await update(userRef,{
balance: balance - price
});

// DATA
let data = {
service:"Application",
name,
desc,
type:selectedType,
theme:document.getElementById("theme").value,
color:document.getElementById("color").value,
price,
statut:"pending",
date:Date.now()
};

const id = Date.now();

// SAVE
await set(ref(db,"orders/pending/"+user+"/"+id), data);

alert("✅ Application envoyée !");
location.href="dashboard.html";

}catch(e){
console.error(e);
alert("❌ Erreur");
}
};
