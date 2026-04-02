import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
getDatabase, ref, onValue, update, remove, push, set, get
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔥 CONFIG
const firebaseConfig = {
apiKey:"AIza...",
authDomain:"starlink-investit.firebaseapp.com",
databaseURL:"https://starlink-investit-default-rtdb.firebaseio.com",
projectId:"starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================= 🔐 AUTH =================
const ADMIN_PHONE = "0982697752";
const ADMIN_PASS = "Davbotadmin123";

const isLogged = localStorage.getItem("adminAuth");

window.addEventListener("DOMContentLoaded", ()=>{

if(isLogged === "true"){
document.getElementById("loginBox").style.display = "none";
document.getElementById("adminPanel").style.display = "block";
}

});

// 🔐 LOGIN
window.loginAdmin = ()=>{
const phone = document.getElementById("adminPhone").value.trim();
const pass = document.getElementById("adminPass").value.trim();

if(phone === ADMIN_PHONE && pass === ADMIN_PASS){
localStorage.setItem("adminAuth","true");
location.reload();
}else{
document.getElementById("error").innerText = "❌ Accès refusé";
}
};

window.logoutAdmin = ()=>{
localStorage.removeItem("adminAuth");
location.reload();
};

// ================= USERS =================
onValue(ref(db,"users"), snap=>{
const box = document.getElementById("users");
if(!box) return;

box.innerHTML = "";

if(!snap.exists()){
box.innerHTML = "<small>Aucun utilisateur</small>";
return;
}

Object.entries(snap.val()).forEach(([phone,u])=>{

const name = u.name || "Non défini";
const photo = u.photo || "";
const pass = u.password || "Non défini";
const balance = u.balance || 0;
const points = u.points || 0;
const revenue = u.revenus || 0;

box.innerHTML += `
<div class="card">

<div style="display:flex;align-items:center;gap:10px;">

${
photo
? `<img src="${photo}" style="width:50px;height:50px;border-radius:50%;">`
: `<div style="width:50px;height:50px;border-radius:50%;background:#00d2ff;display:flex;align-items:center;justify-content:center;color:black;font-weight:bold;">
${name.substring(0,2)}
</div>`
}

<div>
<b>${name}</b><br>
📱 ${phone}
</div>

</div>

<hr style="opacity:0.2;">

🔐 Mot de passe : <b>${pass}</b><br>
💰 Solde : <b>${balance} FC</b><br>
⭐ Points : <b>${points}</b><br>
📈 Revenu : <b>${revenue} FC</b><br>

<button class="no" onclick="delUser('${phone}')">❌ Supprimer</button>

</div>
`;

});

});

// ================= COMMANDES =================
onValue(ref(db,"orders/pending"), async snap=>{

const box = document.getElementById("commandes");
if(!box) return;

box.innerHTML = "";

if(!snap.exists()){
box.innerHTML = "<small>Aucune commande</small>";
return;
}

for(const [user, cmds] of Object.entries(snap.val())){

const userSnap = await get(ref(db,"users/"+user));
const u = userSnap.val() || {};

const name = u.name || "Utilisateur";
const photo = u.photo || "";

for(const [id, c] of Object.entries(cmds)){

let details = "";

// 📱 APPLICATION
if(c.service==="Application"){
details += `📱 Nom APK : ${c.name || "-"}<br>`;
details += `🎨 Couleur : ${c.color || "-"}<br>`;
details += `📝 ${c.desc || "-"}<br>`;
details += `🖼️ Icône : ${c.icon || "non fourni"}<br>`;
}

// 🌐 SITE
if(c.service==="Site Web Pro"){
details += `🌐 Nom : ${c.name || "-"}<br>`;
details += `🎨 Couleur : ${c.color || "-"}<br>`;
details += `📝 ${c.desc || "-"}<br>`;
}

// 🤖 IA
if(c.service==="Intelligence Artificielle"){
details += `🤖 Type : ${c.aiType || "-"}<br>`;
details += `📛 Nom : ${c.name || "-"}<br>`;
details += `📞 Admin : ${c.adminNumber || "-"}<br>`;
}

// 🔥 fallback
Object.keys(c).forEach(k=>{
if(!["service","price","user","date"].includes(k)){
details += `${k} : ${c[k]}<br>`;
}
});

// UI
box.innerHTML += `
<div class="card">

<div style="display:flex;align-items:center;gap:10px;">

${
photo
? `<img src="${photo}" style="width:45px;height:45px;border-radius:50%;">`
: `<div style="width:45px;height:45px;border-radius:50%;background:#00d2ff;display:flex;align-items:center;justify-content:center;">
${name.substring(0,2)}
</div>`
}

<div>
<b>${name}</b><br>
📱 ${user}
</div>

</div>

<hr>

📦 ${c.service}<br>
💰 ${c.price} FC

<div class="details">
${details || "Aucun détail"}
</div>

<button class="ok" onclick="valCmd('${user}','${id}')">Valider</button>
<button class="no" onclick="refCmd('${user}','${id}',${c.price})">Refuser</button>

</div>
`;

}
}

});

// ================= ACTIONS =================

// ✅ COMMANDES
window.valCmd = async(user,id)=>{

const snapRef = ref(db,"orders/pending/"+user+"/"+id);
const snap = await get(snapRef);

if(!snap.exists()) return;

const data = snap.val();

// 🔥 Hébergement
if(data.service === "Hébergement"){
await set(ref(db,"hebergements/"+user+"/"+id),{
siteUrl: data.siteUrl || "Non défini",
status: "online",
duree: data.duree || "N/A",
dateStart: Date.now()
});

await push(ref(db,"messages/"+user),{
text: "🌐 Votre site est maintenant EN LIGNE",
date: Date.now()
});
}

// déplacer
await set(ref(db,"orders/validated/"+user+"/"+id), data);
await remove(snapRef);

alert("✅ Commande validée");
};

// ❌ REFUSER
window.refCmd = async(user,id,price)=>{

const userRef = ref(db,"users/"+user);
const snapUser = await get(userRef);
const bal = snapUser.val().balance || 0;

await update(userRef,{ balance: bal + price });

const snapRef = ref(db,"orders/pending/"+user+"/"+id);
const snap = await get(snapRef);

await set(ref(db,"orders/cancelled/"+user+"/"+id), snap.val());
await remove(snapRef);

};

// ❌ DELETE USER
window.delUser = async(phone)=>{
if(confirm("Supprimer cet utilisateur ?")){
await remove(ref(db,"users/"+phone));
}
};
