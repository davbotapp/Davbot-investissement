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

// ================= LOGGER ERREUR =================
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

// SAFE CLICK
window.safeClick = async(id,cb)=>{
if(lock(id)) return;
try{ await cb(); } catch(e){ console.error(e); alert("Erreur"); }
unlock(id);
};

// ================= AUTH =================
const ADMIN_PHONE = "0982697752";
const ADMIN_PASS = "Davbotadmin123";

window.loginAdmin = ()=>{
if(adminPhone.value.trim()===ADMIN_PHONE && adminPass.value.trim()===ADMIN_PASS){
localStorage.setItem("adminAuth","true");
location.reload();
}else error.innerText="❌ Accès refusé";
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

// ================= HELPERS =================
const safeGet = async(path)=>{
const s = await get(ref(db,path));
return s.exists()? s.val():null;
};

// ================= USERS =================
onValue(ref(db,"users"), snap=>{

const box = document.getElementById("users");
if(!box) return;

if(!snap.exists()) return box.innerHTML="Aucun utilisateur";

let html="", total=0;

Object.entries(snap.val()).forEach(([phone,u])=>{

if(!u) return;

total++;

const name = u.name || "User";
const bal = Number(u.balance||0);

html+=`
<div class="card">
<b>${name}</b><br>
📱 ${phone}<br>
💰 ${bal} FC

<div>
<button onclick="addMoney('${phone}')">➕</button>
<button onclick="removeMoney('${phone}')">➖</button>
<button onclick="delUser('${phone}')">❌</button>
</div>
</div>`;
});

box.innerHTML = html;
document.getElementById("totalUsers").innerText = total;

});

// ================= USER ACTIONS =================
window.addMoney = async(phone)=>{
const amt = Number(prompt("Montant"));
if(!amt) return;

const u = await safeGet("users/"+phone);
await update(ref(db,"users/"+phone),{
balance:(u.balance||0)+amt
});
alert("Ajouté");
};

window.removeMoney = async(phone)=>{
const amt = Number(prompt("Montant"));
if(!amt) return;

const u = await safeGet("users/"+phone);
await update(ref(db,"users/"+phone),{
balance:(u.balance||0)-amt
});
alert("Retiré");
};

window.delUser = async(phone)=>{
if(!confirm("Supprimer ?")) return;
await remove(ref(db,"users/"+phone));
};

// ================= RECHARGES =================
onValue(ref(db,"demandes_recharges"), snap=>{

const box = document.getElementById("recharges");
if(!box) return;

if(!snap.exists()) return box.innerHTML="Aucune recharge";

let html="";

Object.entries(snap.val()).forEach(([id,r])=>{

if(!r || r.status==="done") return;

html+=`
<div class="card">
💰 ${r.amount} FC<br>
📱 ${r.user}

<button onclick="valRecharge('${id}','${r.user}',${r.amount})">✅</button>
<button onclick="refRecharge('${id}','${r.user}')">❌</button>
</div>`;
});

box.innerHTML = html;
});

// ACTIONS RECHARGE
window.valRecharge = async(id,user,amount)=>{
if(lock(id)) return;

try{
const u = await safeGet("users/"+user);

await update(ref(db,"users/"+user),{
balance:(u.balance||0)+Number(amount)
});

await remove(ref(db,"demandes_recharges/"+id));

alert("Validé");
}catch(e){ alert(e); }

unlock(id);
};

window.refRecharge = async(id)=>{
await remove(ref(db,"demandes_recharges/"+id);
alert("Refusé");
};

// ================= COMMANDES =================
onValue(ref(db,"orders/pending"), snap=>{

const box = document.getElementById("commandes");
if(!box) return;

if(!snap.exists()) return box.innerHTML="Aucune commande";

let html="";

Object.entries(snap.val()).forEach(([user,cmds])=>{
Object.entries(cmds).forEach(([id,c])=>{

html+=`
<div class="card">
📦 ${c.service}<br>
💰 ${c.price} FC

<button onclick="valCmd('${user}','${id}')">✅</button>
<button onclick="refCmd('${user}','${id}',${c.price})">❌</button>
</div>`;
});
});

box.innerHTML = html;
});

// ACTIONS CMD
window.valCmd = async(user,id)=>{
await set(ref(db,`orders/validated/${user}/${id}`),{
status:"ok"
});
await remove(ref(db,`orders/pending/${user}/${id}`));
alert("Validé");
};

window.refCmd = async(user,id,price)=>{
const u = await safeGet("users/"+user);

await update(ref(db,"users/"+user),{
balance:(u.balance||0)+Number(price)
});

await remove(ref(db,`orders/pending/${user}/${id}`));
alert("Refusé + remboursé");
};

// ================= TRANSFERT =================
window.valTrans = async(id,from,to,amt)=>{
const u1 = await safeGet("users/"+from);
const u2 = await safeGet("users/"+to);

await update(ref(db,"users/"+from),{
balance:u1.balance-amt
});
await update(ref(db,"users/"+to),{
balance:u2.balance+amt
});

await update(ref(db,"transferts/"+id),{status:"ok"});
};

window.refTrans = async(id)=>{
await update(ref(db,"transferts/"+id),{status:"refused"});
};

// ================= MONETISATION =================
window.valMonet = async(id,user)=>{
await update(ref(db,"users/"+user),{monetized:true});
await update(ref(db,"demandes_monetisation/"+id),{status:"ok"});
};

window.refMonet = async(id)=>{
await update(ref(db,"demandes_monetisation/"+id),{status:"refused"});
};

// ================= STATS =================
onValue(ref(db,"users"), snap=>{
if(!snap.exists()) return;

let total=0;

Object.values(snap.val()).forEach(u=>{
total += Number(u.balance||0);
});

document.getElementById("totalMoney").innerText = total+" FC";
});
