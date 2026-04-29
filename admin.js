// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
getDatabase, ref, onValue, update, remove, push, set, get
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
apiKey:"AIza...",
authDomain:"starlink-investit.firebaseapp.com",
databaseURL:"https://starlink-investit-default-rtdb.firebaseio.com",
projectId:"starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================= LOGGER ERROR =================
window.addEventListener("unhandledrejection", e=>{
console.error("🔥 Firebase Error:", e.reason);
});

// ================= LOCK SYSTEM =================
let loading = {};

function lock(id){
if(loading[id]) return true;
loading[id] = true;
return false;
}

function unlock(id){
delete loading[id];
}

function safeClick(id, fn){
if(lock(id)) return;
Promise.resolve(fn()).finally(()=>unlock(id));
}

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
if(!snap.exists()) return;
await remove(ref(db,path));
}

async function logAction(type,data){
await push(ref(db,"admin_logs"),{
type,...data,date:Date.now()
});
}

// ================= USERS =================
onValue(ref(db,"users"), snap=>{
const box = document.getElementById("users");
if(!box) return;

if(!snap.exists()){
box.innerHTML = "Aucun utilisateur";
return;
}

let html="";

Object.entries(snap.val()).forEach(([phone,u])=>{
if(!u || !phone) return;
if(!u.name && !u.balance) return;

const name = u.name || "User";
const balance = Number(u.balance || 0);

html += `
<div class="card">
<b>${name}</b><br>
📱 ${phone}<br>
💰 ${balance} FC

<div>
<button onclick="safeClick('add-${phone}',()=>addMoney('${phone}'))">➕</button>
<button onclick="safeClick('rem-${phone}',()=>removeMoney('${phone}'))">➖</button>
<button onclick="safeClick('del-${phone}',()=>delUser('${phone}'))">❌</button>
</div>
</div>`;
});

box.innerHTML = html;
});

// ================= ADD MONEY =================
window.addMoney = async(phone)=>{
const user = await safeGet("users/"+phone);
if(!user) return alert("User introuvable");

await update(ref(db,"users/"+phone),{
balance:(user.balance||0)+1000
});

alert("+1000 FC");
};

// ================= REMOVE MONEY =================
window.removeMoney = async(phone)=>{
const user = await safeGet("users/"+phone);
if(!user) return;

if(user.balance < 1000) return alert("Solde insuffisant");

await update(ref(db,"users/"+phone),{
balance:user.balance - 1000
});

alert("-1000 FC");
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
if(!snap.exists()) return box.innerHTML="Aucune recharge";

let html="";

for(const [id,r] of Object.entries(snap.val())){

if(!r || !r.user) continue;
if(r.status && r.status !== "pending") continue;

const user = await safeGet("users/"+r.user);
if(!user) continue;

html += `
<div class="card">
📱 ${r.user}<br>
💰 ${r.amount} FC

<button onclick="safeClick('v-${id}',()=>valRecharge('${id}','${r.user}',${r.amount}))">✅</button>
<button onclick="safeClick('r-${id}',()=>refRecharge('${id}','${r.user}',${r.amount}))">❌</button>
</div>`;
}

box.innerHTML = html;
});

// ================= VALID RECHARGE =================
window.valRecharge = async(id,user,amount)=>{

if(lock(id)) return;

const u = await safeGet("users/"+user);
if(!u) return;

await update(ref(db,"users/"+user),{
balance:(u.balance||0)+amount
});

await safeDelete("demandes_recharges/"+id);

alert("Recharge validée");

unlock(id);
};

// ================= REFUSE =================
window.refRecharge = async(id)=>{
await safeDelete("demandes_recharges/"+id);
alert("Refusé");
};

// ================= COMMANDES =================
onValue(ref(db,"orders/pending"), async snap=>{
const box = document.getElementById("commandes");

if(!snap.exists()) return box.innerHTML="Aucune commande";

let html="";

for(const [user,cmds] of Object.entries(snap.val())){

for(const [id,c] of Object.entries(cmds)){
if(!c || !c.service) continue;

html += `
<div class="card">
📱 ${user}<br>
📦 ${c.service}<br>
💰 ${c.price||0}

<button onclick="safeClick('ok-${id}',()=>valCmd('${user}','${id}'))">✅</button>
<button onclick="safeClick('no-${id}',()=>refCmd('${user}','${id}',${c.price||0}))">❌</button>
</div>`;
}

}

box.innerHTML = html;
});

// ================= VALID CMD =================
window.valCmd = async(user,id)=>{
await set(ref(db,`orders/validated/${user}/${id}`),{
status:"ok"
});

await safeDelete(`orders/pending/${user}/${id}`);
alert("Validé");
};

// ================= REF CMD =================
window.refCmd = async(user,id,price)=>{

const u = await safeGet("users/"+user);

await update(ref(db,"users/"+user),{
balance:(u.balance||0)+price
});

await safeDelete(`orders/pending/${user}/${id}`);
alert("Refusé + remboursé");
};

// ================= TRANSFERT =================
onValue(ref(db,"transferts"), async snap=>{
const box = document.getElementById("transferts");

if(!snap.exists()) return box.innerHTML="Aucun";

let html="";

for(const [id,t] of Object.entries(snap.val())){

if(!t || t.status !== "pending") continue;

html += `
<div class="card">
${t.from} ➜ ${t.to}<br>
💰 ${t.amount}

<button onclick="valTrans('${id}','${t.from}','${t.to}',${t.amount})">✅</button>
<button onclick="refTrans('${id}')">❌</button>
</div>`;
}

box.innerHTML = html;
});

// ================= VALID TRANS =================
window.valTrans = async(id,from,to,amount)=>{

const fromUser = await safeGet("users/"+from);
const toUser = await safeGet("users/"+to);

if(!fromUser || !toUser) return;

await update(ref(db,"users/"+to),{
balance:(toUser.balance||0)+amount
});

await safeDelete("transferts/"+id);
alert("Validé");
};

// ================= REF TRANS =================
window.refTrans = async(id)=>{
await safeDelete("transferts/"+id);
alert("Refusé");
};

// ================= MONETISATION =================
onValue(ref(db,"demandes_monetisation"), async snap=>{
const box = document.getElementById("monetisations");

if(!snap.exists()) return box.innerHTML="Aucune";

let html="";

for(const [id,m] of Object.entries(snap.val())){

if(!m || m.status !== "pending") continue;

html += `
<div class="card">
📱 ${m.user}

<button onclick="valMonet('${id}','${m.user}')">✅</button>
<button onclick="refMonet('${id}')">❌</button>
</div>`;
}

box.innerHTML = html;
});

// ================= VALID MONET =================
window.valMonet = async(id,user)=>{
await update(ref(db,"users/"+user),{
monetized:true
});

await safeDelete("demandes_monetisation/"+id);
alert("Activé");
};

// ================= REF MONET =================
window.refMonet = async(id)=>{
await safeDelete("demandes_monetisation/"+id);
alert("Refusé");
};

// ================= STATS =================
onValue(ref(db,"users"), snap=>{
let total=0, money=0;

if(snap.exists()){
Object.values(snap.val()).forEach(u=>{
total++;
money += u.balance||0;
});
}

statUsers.innerText = total;
statMoney.innerText = money+" FC";
});
