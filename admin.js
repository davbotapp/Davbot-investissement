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

// ================= ERROR LOGGER =================
window.addEventListener("unhandledrejection", e=>{
console.error("🔥 Firebase Error:", e.reason);
});

// ================= SECURITY LOCK =================
let loading = {};

function lock(id){
if(loading[id]) return true;
loading[id] = true;
return false;
}

function unlock(id){
delete loading[id];
}

// ================= AUTH =================
const ADMIN_PHONE = "0982697752";
const ADMIN_PASS = "Davbotadmin123";

window.loginAdmin = ()=>{
const p = adminPhone.value.trim();
const pass = adminPass.value.trim();

if(p === ADMIN_PHONE && pass === ADMIN_PASS){
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

// ================= USERS =================
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

const name = u.name || "Utilisateur";
const photo = u.photo || "";
const pass = u.password || "-";
const balance = u.balance || 0;
const points = u.points || 0;
const revenue = u.revenus || 0;
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

<button onclick="addMoney('${phone}')" style="background:#00d2ff;">➕</button>
<button onclick="removeMoney('${phone}')" style="background:#ff9800;">➖</button>
<button onclick="sendMsg('${phone}')" style="background:#4caf50;">💬</button>
<button onclick="delUser('${phone}')" style="background:#ff4d4d;">❌</button>

</div>

</div>
`;

});

// 🔥 injecter en une fois
box.innerHTML = html;

});
// ================= RECHARGES =================
onValue(ref(db,"demandes_recharges"), async snap=>{

const box = document.getElementById("recharges");
if(!box) return;

if(!snap.exists()){
box.innerHTML = "Aucune recharge";
return;
}

// 🔥 charger users UNE FOIS
const usersSnap = await get(ref(db,"users"));
const users = usersSnap.val() || {};

let html = "";

for(const [id,r] of Object.entries(snap.val())){

if(r.status && r.status !== "pending") continue;

const u = users[r.user] || {};

html += `
<div class="card">
<b>${u.name || "User"}</b><br>
💰 ${r.amount} FC<br>

<button onclick="valRecharge('${id}','${r.user}',${r.amount})">✅</button>
<button onclick="refRecharge('${id}','${r.user}',${r.amount})">❌</button>
</div>`;
}

box.innerHTML = html;
});

// ================= ACTION RECHARGE =================
window.valRecharge = async(id,user,amount)=>{

if(lock(id)) return;

try{

if(amount <= 0) return alert("Montant invalide");

const rRef = ref(db,"demandes_recharges/"+id);
const check = await get(rRef);

if(!check.exists()) return alert("Déjà traité");

const userRef = ref(db,"users/"+user);
const snap = await get(userRef);

const bal = snap.val().balance || 0;

await update(userRef,{
balance: bal + amount
});

await set(ref(db,"recharges_validées/"+id),{
user, amount, date:Date.now()
});

await remove(rRef);

await push(ref(db,"messages/"+user),{
text:`+${amount} FC`,
date:Date.now()
});

alert("Validé");

}catch(e){
console.error(e);
alert("Erreur");
}

unlock(id);
};

// ================= REFUSE =================
window.refRecharge = async(id,user,amount)=>{

if(lock(id)) return;

try{

await set(ref(db,"recharges_refusées/"+id),{
user,amount,date:Date.now()
});

await remove(ref(db,"demandes_recharges/"+id));

alert("Refusé");

}catch(e){
alert("Erreur");
}

unlock(id);
};

// ================= COMMANDES =================
onValue(ref(db,"orders/pending"), async snap=>{

const box = document.getElementById("commandes");
if(!box) return;

if(!snap.exists()){
box.innerHTML = "Aucune commande";
return;
}

const users = (await get(ref(db,"users"))).val() || {};

let html = "";

for(const [user,cmds] of Object.entries(snap.val())){

for(const [id,c] of Object.entries(cmds)){

const u = users[user] || {};

html += `
<div class="card">
<b>${u.name}</b><br>
📦 ${c.service}<br>
💰 ${c.price} FC

<button onclick="valCmd('${user}','${id}')">✅</button>
<button onclick="refCmd('${user}','${id}',${c.price})">❌</button>
</div>`;
}
}

box.innerHTML = html;
});

// ================= VALID CMD =================
window.valCmd = async(user,id)=>{

if(lock(id)) return;

try{

const snap = await get(ref(db,"orders/pending/"+user+"/"+id));
const data = snap.val();

await set(ref(db,"orders/validated/"+user+"/"+id),{
...data,status:"ok"
});

await remove(ref(db,"orders/pending/"+user+"/"+id));

alert("Commande validée");

}catch(e){
alert("Erreur");
}

unlock(id);
};

// ================= REF CMD =================
window.refCmd = async(user,id,price)=>{

if(lock(id)) return;

try{

const uRef = ref(db,"users/"+user);
const snap = await get(uRef);

await update(uRef,{
balance: (snap.val().balance || 0) + price
});

await remove(ref(db,"orders/pending/"+user+"/"+id));

alert("Refusé + remboursé");

}catch(e){
alert("Erreur");
}

unlock(id);
};

// ================= MESSAGE =================
window.sendMsg = async ()=>{

const user = target.value.trim();
const msg = msgInput.value.trim();

if(!user || !msg) return alert("Erreur");

await push(ref(db,"messages/"+user),{
text: msg,
date: Date.now()
});

alert("Message envoyé");
msgInput.value="";
};
