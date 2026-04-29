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

// ================= ERROR =================
window.addEventListener("unhandledrejection", e=>{
console.error("🔥 Error:", e.reason);
});

// ================= LOCK =================
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
if(lock(id)) return alert("⏳ Traitement...");
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

box.innerHTML = "<small>⏳ Chargement...</small>";

if(!snap.exists()){
    box.innerHTML = "<small>Aucun utilisateur</small>";
    return;
}

let html = "";

// 🔥 LOOP USERS
Object.entries(snap.val()).forEach(([phone,u])=>{

// 🛑 DATA INVALIDE
if(!u || !phone) return;

// 🛑 ignorer utilisateurs vides (optionnel PRO)
if(!u.name && !u.balance && !u.points) return;

const name = u.name || "Utilisateur";
const photo = u.photo || "";

// ⚠️ NE PAS afficher vrai mot de passe
const pass = u.password ? "••••••••" : "-";

const balance = Number(u.balance || 0);
const points = Number(u.points || 0);
const revenue = Number(u.revenus || 0);
const monetized = u.monetized ? "✅ Oui" : "❌ Non";

// 🔥 AVATAR
const avatar = photo
? `<img src="${photo}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">`
: `<div style="
width:50px;height:50px;border-radius:50%;
background:#00d2ff;display:flex;
align-items:center;justify-content:center;
color:black;font-weight:bold;">
${name.substring(0,2).toUpperCase()}
</div>`;

// 🔥 CARD
html += `
<div class="card" style="
background:rgba(255,255,255,0.03);
padding:15px;
border-radius:15px;
margin-bottom:10px;
border:1px solid rgba(255,255,255,0.05);
">

<div style="display:flex;align-items:center;gap:10px;">
${avatar}
<div>
<b>${name}</b><br>
<small style="opacity:0.6;">📱 ${phone}</small>
</div>
</div>

<hr style="opacity:0.1;margin:10px 0;">

<div style="line-height:1.6;">
🔐 Mot de passe : <b>${pass}</b><br>
💰 Solde : <b style="color:#00d2ff">${balance.toLocaleString()} FC</b><br>
⭐ Points : <b>${points}</b><br>
📈 Revenus : <b>${revenue.toLocaleString()} FC</b><br>
💸 Monétisé : <b>${monetized}</b>
</div>

<div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap;">

<button onclick="safeClick('add-${phone}',()=>addMoney('${phone}'))" style="background:#00d2ff;">➕</button>

<button onclick="safeClick('remove-${phone}',()=>removeMoney('${phone}'))" style="background:#ff9800;">➖</button>

<button onclick="sendMsg('${phone}')" style="background:#4caf50;">💬</button>

<button onclick="safeClick('del-${phone}',()=>delUser('${phone}'))" style="background:#ff4d4d;">❌</button>

</div>

</div>
`;

});

// 🔥 injecter
box.innerHTML = html || "<small>Aucun utilisateur valide</small>";

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

window.removeMoney = async(phone)=>{
const u = await safeGet("users/"+phone);
if(!u) return;

if((u.balance||0)<1000) return alert("Solde insuffisant");

await update(ref(db,"users/"+phone),{
balance:u.balance-1000
});

alert("-1000 FC");
};

// ================= DELETE USER =================
window.delUser = async(phone)=>{
if(!confirm("Supprimer ?")) return;

await remove(ref(db,"users/"+phone));
await safeDelete("messages/"+phone);
await safeDelete("orders/pending/"+phone);

alert("Supprimé");
};

// ================= RECHARGES =================
onValue(ref(db,"demandes_recharges"), async snap=>{
const box = document.getElementById("recharges");
if(!box) return;

let html="";
let count=0;

if(!snap.exists()){
box.innerHTML="Aucune recharge";
statRech.innerText=0;
return;
}

for(const [id,r] of Object.entries(snap.val())){

if(!r || !r.user) continue;
if(r.status && r.status!=="pending") continue;

const user = await safeGet("users/"+r.user);
if(!user) continue;

count++;

html += `
<div class="card">
📱 ${r.user}<br>
💰 ${r.amount} FC

<button onclick="safeClick('val-${id}',()=>valRecharge('${id}','${r.user}',${r.amount}))">✅</button>
<button onclick="safeClick('ref-${id}',()=>refRecharge('${id}','${r.user}',${r.amount}))">❌</button>
</div>`;
}

box.innerHTML = html || "Aucune recharge";
statRech.innerText = count;
});

// ================= VALID RECHARGE =================
window.valRecharge = async(id,user,amount)=>{

const key="rech-"+id;
if(lock(key)) return;

try{

const recharge = await safeGet("demandes_recharges/"+id);
if(!recharge) throw "Déjà traité";

const u = await safeGet("users/"+user);
if(!u) throw "User introuvable";

const amt = Number(amount||0);
if(amt<=0) throw "Montant invalide";

await update(ref(db,"users/"+user),{
balance:(u.balance||0)+amt
});

await remove(ref(db,"demandes_recharges/"+id));

alert("Recharge validée");

}catch(e){
alert(e);
}

unlock(key);
};

// ================= REFUSE RECHARGE =================
window.refRecharge = async(id)=>{
await safeDelete("demandes_recharges/"+id);
alert("Refusé");
};

// ================= COMMANDES =================
onValue(ref(db,"orders/pending"), async snap=>{
const box = document.getElementById("commandes");
if(!box) return;

let html="";
let count=0;

if(!snap.exists()){
box.innerHTML="Aucune commande";
statCmd.innerText=0;
return;
}

for(const [user,cmds] of Object.entries(snap.val())){

for(const [id,c] of Object.entries(cmds)){

if(!c || !c.service) continue;

count++;

html += `
<div class="card">
📱 ${user}<br>
📦 ${c.service}<br>
💰 ${c.price||0} FC

<button onclick="safeClick('ok-${id}',()=>valCmd('${user}','${id}'))">✅</button>
<button onclick="safeClick('no-${id}',()=>refCmd('${user}','${id}',${c.price||0}))">❌</button>
</div>`;
}

}

box.innerHTML = html || "Aucune commande";
statCmd.innerText = count;
});

// ================= VALID CMD =================
window.valCmd = async(user,id)=>{
const key="cmd-"+id;
if(lock(key)) return;

try{

const cmd = await safeGet(`orders/pending/${user}/${id}`);
if(!cmd) throw "Déjà traité";

await set(ref(db,`orders/validated/${user}/${id}`),{
...cmd,
status:"approved"
});

await remove(ref(db,`orders/pending/${user}/${id}`));

alert("Validé");

}catch(e){
alert(e);
}

unlock(key);
};

// ================= REF CMD =================
window.refCmd = async(user,id,price)=>{
const key="cmd-"+id;
if(lock(key)) return;

try{

const u = await safeGet("users/"+user);
if(!u) throw "User introuvable";

await update(ref(db,"users/"+user),{
balance:(u.balance||0)+Number(price||0)
});

await remove(ref(db,`orders/pending/${user}/${id}`));

alert("Refusé + remboursé");

}catch(e){
alert(e);
}

unlock(key);
};

// ================= TRANSFERT =================
onValue(ref(db,"transferts"), async snap=>{
const box = document.getElementById("transferts");
if(!box) return;

let html="";

if(!snap.exists()){
box.innerHTML="Aucun transfert";
return;
}

for(const [id,t] of Object.entries(snap.val())){

if(!t || t.status!=="pending") continue;

html += `
<div class="card">
${t.from} ➜ ${t.to}<br>
💰 ${t.amount}

<button onclick="safeClick('t-ok-${id}',()=>valTrans('${id}','${t.from}','${t.to}',${t.amount}))">✅</button>
<button onclick="safeClick('t-no-${id}',()=>refTrans('${id}')">❌</button>
</div>`;
}

box.innerHTML = html;
});

// ================= VALID TRANS =================
window.valTrans = async(id,from,to,amount)=>{
await update(ref(db,"users/"+to),{
balance:(await safeGet("users/"+to)).balance + Number(amount)
});

await safeDelete("transferts/"+id);
alert("Validé");
};

window.refTrans = async(id)=>{
await safeDelete("transferts/"+id);
alert("Refusé");
};

// ================= MONETISATION =================
onValue(ref(db,"demandes_monetisation"), async snap=>{
const box = document.getElementById("monetisations");
if(!box) return;

let html="";

if(!snap.exists()){
box.innerHTML="Aucune";
return;
}

for(const [id,m] of Object.entries(snap.val())){

if(!m || m.status!=="pending") continue;

html += `
<div class="card">
📱 ${m.user}

<button onclick="safeClick('m-ok-${id}',()=>valMonet('${id}','${m.user}'))">✅</button>
<button onclick="safeClick('m-no-${id}',()=>refMonet('${id}')">❌</button>
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

window.refMonet = async(id)=>{
await safeDelete("demandes_monetisation/"+id);
alert("Refusé");
};
