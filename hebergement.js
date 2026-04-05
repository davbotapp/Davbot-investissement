import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
apiKey: "AIza...",
authDomain: "starlink-investit.firebaseapp.com",
databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const user = localStorage.getItem("userPhone");
if(!user) location.href="index.html";

let selectedPlan = "";
let selectedPrice = 0;

// SELECT PLAN
document.querySelectorAll(".option").forEach(opt=>{
opt.onclick=()=>{
document.querySelectorAll(".option").forEach(o=>o.classList.remove("active"));
opt.classList.add("active");

selectedPlan = opt.dataset.name;
selectedPrice = parseInt(opt.dataset.price);

document.getElementById("price").innerText = selectedPrice+" FC";
};
});

// VALIDATION
window.valider = async()=>{

const siteName = document.getElementById("siteName").value;
const siteUrl = document.getElementById("siteUrl").value;

if(!selectedPlan) return alert("Choisir durée");
if(!siteName) return alert("Nom requis");
if(!siteUrl) return alert("Lien requis");

const id = Date.now();

await set(ref(db,"hebergements/"+user+"/"+id),{
siteName,
siteUrl,
plan:selectedPlan,
price:selectedPrice,
date:Date.now()
});

alert("✅ Hébergement enregistré");

location.href="heberge.html";
};
