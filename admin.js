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

if(isLogged === "true"){
document.getElementById("loginBox").style.display = "none";
document.getElementById("adminPanel").style.display = "block";
}

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
box.innerHTML = "";

if(!snap.exists()){
box.innerHTML = "Aucun utilisateur";
return;
}

Object.entries(snap.val()).forEach(([phone,u])=>{
box.innerHTML += `
<div class="card">
👤 ${u.name || "User"}<br>
📱 ${phone}<br>
💰 ${u.balance || 0} FC<br>
⭐ ${u.points || 0}
</div>
`;
});
});

// ================= COMMANDES =================
onValue(ref(db,"orders/pending"), snap=>{
const box = document.getElementById("commandes");
box.innerHTML = "";

if(!snap.exists()) return;

Object.entries(snap.val()).forEach(([user,cmds])=>{

Object.entries(cmds).forEach(([id,c])=>{

let details = "";

details += `📦 ${c.service}<br>`;
details += `💰 ${c.price} FC<br>`;

// 🔥 message auto en attente
sendAutoMsg(user, `⏳ Votre commande "${c.service}" est en cours de traitement.\n\n⏱ Si elle n'est pas traitée sous 72h, vous serez automatiquement remboursé.`);

// 🔥 AUTO REMBOURSEMENT 72H
setTimeout(async ()=>{
const snap = await get(ref(db,"orders/pending/"+user+"/"+id));

if(snap.exists()){

// remboursement
const userRef = ref(db,"users/"+user);
const userSnap = await get(userRef);
const bal = userSnap.val().balance || 0;

await update(userRef,{
balance: bal + (c.price || 0)
});

// déplacer
await set(ref(db,"orders/cancelled/"+user+"/"+id), c);
await remove(ref(db,"orders/pending/"+user+"/"+id));

// message
sendAutoMsg(user, `❌ Votre commande "${c.service}" n'a pas été traitée.\n\n💰 Votre argent a été remboursé automatiquement.`);
}

}, 72 * 60 * 60 * 1000); // 72h

box.innerHTML += `
<div class="card">
👤 ${user}<br>
${details}

<button class="ok" onclick="valCmd('${user}','${id}')">Valider</button>
<button class="no" onclick="refCmd('${user}','${id}',${c.price})">Refuser</button>
</div>
`;

});

});

});

// ================= ACTIONS =================

// ✅ MESSAGE AUTO
async function sendAutoMsg(user, text){
await push(ref(db,"messages/"+user),{
text,
date: Date.now(),
read:false
});
}

// ✅ VALIDER CMD
window.valCmd = async(user,id)=>{

const snapRef = ref(db,"orders/pending/"+user+"/"+id);
const snap = await get(snapRef);

if(!snap.exists()) return;

const data = snap.val();

// déplacer
await set(ref(db,"orders/validated/"+user+"/"+id), data);
await remove(snapRef);

// message pro
sendAutoMsg(user, `✅ Votre commande "${data.service}" est prête !\n\n🙏 Merci pour votre patience.\n🚀 DAVBOT`);

// notif
alert("Commande validée");
};

// ❌ REFUSER CMD
window.refCmd = async(user,id,price)=>{

const userRef = ref(db,"users/"+user);
const snapUser = await get(userRef);

const bal = snapUser.val().balance || 0;

// remboursement
await update(userRef,{
balance: bal + price
});

// déplacer
const snapRef = ref(db,"orders/pending/"+user+"/"+id);
const snap = await get(snapRef);

await set(ref(db,"orders/cancelled/"+user+"/"+id), snap.val());
await remove(snapRef);

// message pro
sendAutoMsg(user, `❌ Une erreur est survenue lors du traitement de votre commande.\n\n💰 Votre argent a été remboursé.\n🙏 Merci pour votre compréhension.`);

alert("Commande refusée");
};

// ================= RECHARGES =================
onValue(ref(db,"demandes_recharges"), snap=>{
const box = document.getElementById("recharges");
box.innerHTML = "";

if(!snap.exists()) return;

Object.entries(snap.val()).forEach(([id,r])=>{
box.innerHTML += `
<div class="card">
📱 ${r.user}<br>
💰 ${r.amount}

<button class="ok" onclick="valRecharge('${id}','${r.user}',${r.amount})">OK</button>
<button class="no" onclick="deleteItem('demandes_recharges','${id}')">X</button>
</div>
`;
});
});

window.valRecharge = async(id,user,amount)=>{
const userRef = ref(db,"users/"+user);
const snap = await get(userRef);
const bal = snap.val().balance || 0;

await update(userRef,{
balance: bal + amount
});

await remove(ref(db,"demandes_recharges/"+id));

sendAutoMsg(user, "✅ Recharge validée !");
};

// ================= RETRAITS =================
onValue(ref(db,"demandes_retraits"), snap=>{
const box = document.getElementById("retraits");
box.innerHTML = "";

if(!snap.exists()) return;

Object.entries(snap.val()).forEach(([id,r])=>{
box.innerHTML += `
<div class="card">
📱 ${r.user}<br>
💸 ${r.montant}

<button class="ok" onclick="valRetrait('${id}')">OK</button>
<button class="no" onclick="deleteItem('demandes_retraits','${id}')">X</button>
</div>
`;
});
});

window.valRetrait = async(id)=>{

const retraitRef = ref(db,"demandes_retraits/"+id);
const snap = await get(retraitRef);

const data = snap.val();

const user = data.user;
const amount = data.montant;

const userRef = ref(db,"users/"+user);
const snapUser = await get(userRef);

const balance = snapUser.val().balance || 0;

if(balance < amount){
alert("Solde insuffisant");
return;
}

await update(userRef,{
balance: balance - amount
});

await remove(retraitRef);

sendAutoMsg(user, "✅ Retrait validé !");
};

// ================= DELETE =================
window.deleteItem = async(path,id)=>{
await remove(ref(db,path+"/"+id));
};
