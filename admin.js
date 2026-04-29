// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
getDatabase, ref, onValue, update, remove, push, set, get
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const app = initializeApp({
apiKey:"AIza...",
authDomain:"starlink-investit.firebaseapp.com",
databaseURL:"https://starlink-investit-default-rtdb.firebaseio.com",
projectId:"starlink-investit"
});

const db = getDatabase(app);

// ================= ERROR =================
window.addEventListener("unhandledrejection", e=>{
console.error("🔥 Error:", e.reason);
});

// ================= ANTI DOUBLE CLICK =================
const clickLock = {};

window.safeClick = async (id, fn)=>{
if(clickLock[id]) return;

clickLock[id] = true;

try{
await fn();
}catch(e){
console.error(e);
alert("Erreur");
}

setTimeout(()=>delete clickLock[id],800);
};

// ================= AUTH =================
const ADMIN_PHONE = "0982697752";
const ADMIN_PASS = "Davbotadmin123";

window.loginAdmin = ()=>{
if(adminPhone.value === ADMIN_PHONE && adminPass.value === ADMIN_PASS){
localStorage.setItem("adminAuth","true");
location.reload();
}else{
error.innerText = "❌ Accès refusé";
}
};

window.logoutAdmin = ()=>{
localStorage.removeItem("adminAuth");
location.reload();
};

window.onload = ()=>{
if(localStorage.getItem("adminAuth")==="true"){
loginBox.style.display="none";
adminPanel.style.display="block";
}
};

// ================= TOOLS =================
async function safeGet(path){
const snap = await get(ref(db,path));
return snap.exists() ? snap.val() : null;
}

async function safeDelete(path){
const snap = await get(ref(db,path));
if(snap.exists()) await remove(ref(db,path));
}

// ================= USERS =================
onValue(ref(db,"users"), snap=>{

const box = document.getElementById("users");
if(!box) return;

const data = snap.val() || {};
let html = "";

Object.entries(data).forEach(([phone,u])=>{

if(!u || !phone) return;

const name = u.name || "User";
const balance = Number(u.balance||0);

html += `
<div class="card">
<b>${name}</b><br>
📱 ${phone}<br>
💰 ${balance} FC

<div>
<button onclick="safeClick('add-${phone}',()=>addMoney('${phone}'))">➕</button>
<button onclick="safeClick('del-${phone}',()=>delUser('${phone}'))">❌</button>
</div>
</div>`;
});

box.innerHTML = html || "Aucun utilisateur";
});

// ================= MONEY =================
window.addMoney = async(phone)=>{
const u = await safeGet("users/"+phone);
if(!u) return alert("User introuvable");

await update(ref(db,"users/"+phone),{
balance:(u.balance||0)+1000
});

alert("+1000 FC");
};

// ================= DELETE USER =================
window.delUser = async(phone)=>{
if(!confirm("Supprimer ?")) return;

await remove(ref(db,"users/"+phone));
await safeDelete("messages/"+phone);

alert("Supprimé");
};

// ================= RECHARGES =================
onValue(ref(db,"demandes_recharges"), async snap=>{

const box = document.getElementById("recharges");
if(!box) return;

const data = snap.val() || {};
const users = (await get(ref(db,"users"))).val() || {};

let html="";
let count=0;

Object.entries(data).forEach(([id,r])=>{

if(!r || !r.user) return;
if(r.status && r.status !== "pending") return;

const user = users[r.user];
if(!user) return;

count++;

html += `
<div class="card">
📱 ${r.user}<br>
💰 ${r.amount} FC

<button onclick="safeClick('val-${id}',()=>valRecharge('${id}','${r.user}',${r.amount}))">✅</button>
<button onclick="safeClick('ref-${id}',()=>refRecharge('${id}'))">❌</button>
</div>`;
});

box.innerHTML = html || "Aucune recharge";
statRech.innerText = count;
});

// ================= VALID RECHARGE =================
window.valRecharge = async(id,user,amount)=>{
const u = await safeGet("users/"+user);
if(!u) return alert("User introuvable");

await update(ref(db,"users/"+user),{
balance:(u.balance||0)+Number(amount)
});

await safeDelete("demandes_recharges/"+id);

alert("Validé");
};

window.refRecharge = async(id)=>{
await safeDelete("demandes_recharges/"+id);
alert("Refusé");
};

// ================= COMMANDES =================
onValue(ref(db,"orders/pending"), async snap=>{

const box = document.getElementById("commandes");
if(!box) return;

const data = snap.val() || {};
const users = (await get(ref(db,"users"))).val() || {};

let html="";

Object.entries(data).forEach(([user,cmds])=>{

if(!cmds || !users[user]) return;

Object.entries(cmds).forEach(([id,c])=>{

if(!c || !c.service) return;

html += `
<div class="card">
📱 ${user}<br>
📦 ${c.service}<br>
💰 ${c.price||0} FC

<button onclick="safeClick('ok-${id}',()=>valCmd('${user}','${id}'))">✅</button>
<button onclick="safeClick('no-${id}',()=>refCmd('${user}','${id}',${c.price||0}))">❌</button>
</div>`;
});

});

box.innerHTML = html || "Aucune commande";
});

// ================= VALID CMD =================
window.valCmd = async(user,id)=>{
const cmd = await safeGet(`orders/pending/${user}/${id}`);
if(!cmd) return alert("Déjà traité");

await set(ref(db,`orders/validated/${user}/${id}`),{
...cmd,status:"approved"
});

await safeDelete(`orders/pending/${user}/${id}`);

alert("Validé");
};

// ================= REF CMD =================
window.refCmd = async(user,id,price)=>{
const u = await safeGet("users/"+user);
if(!u) return;

await update(ref(db,"users/"+user),{
balance:(u.balance||0)+Number(price)
});

await safeDelete(`orders/pending/${user}/${id}`);

alert("Refusé + remboursé");
};

// ================= TRANSFERT =================
onValue(ref(db,"transferts"), snap=>{

const box = document.getElementById("transferts");
if(!box) return;

const data = snap.val() || {};
let html="";

Object.entries(data).forEach(([id,t])=>{

if(!t || t.status!=="pending") return;

html += `
<div class="card">
${t.from} ➜ ${t.to}<br>
💰 ${t.amount}

<button onclick="safeClick('t-ok-${id}',()=>valTrans('${id}','${t.from}','${t.to}',${t.amount}))">✅</button>
<button onclick="safeClick('t-no-${id}',()=>refTrans('${id}'))">❌</button>
</div>`;
});

box.innerHTML = html || "Aucun transfert";
});

// ================= TRANS ACTION =================
window.valTrans = async(id,from,to,amount)=>{
const u = await safeGet("users/"+to);
if(!u) return alert("User introuvable");

await update(ref(db,"users/"+to),{
balance:(u.balance||0)+Number(amount)
});

await safeDelete("transferts/"+id);
alert("Validé");
};

window.refTrans = async(id)=>{
await safeDelete("transferts/"+id);
alert("Refusé");
};

// ================= MONETISATION =================
onValue(ref(db,"demandes_monetisation"), snap=>{

const box = document.getElementById("monetisations");
if(!box) return;

const data = snap.val() || {};
let html="";

Object.entries(data).forEach(([id,m])=>{

if(!m || m.status!=="pending") return;

html += `
<div class="card">
📱 ${m.user}

<button onclick="safeClick('m-ok-${id}',()=>valMonet('${id}','${m.user}'))">✅</button>
<button onclick="safeClick('m-no-${id}',()=>refMonet('${id}'))">❌</button>
</div>`;
});

box.innerHTML = html || "Aucune demande";
});

// ================= MONET ACTION =================
window.valMonet = async(id,user)=>{
await update(ref(db,"users/"+user),{ monetized:true });
await safeDelete("demandes_monetisation/"+id);
alert("Activé");
};

window.refMonet = async(id)=>{
await safeDelete("demandes_monetisation/"+id);
alert("Refusé");
};
