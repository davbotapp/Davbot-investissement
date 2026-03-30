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

if(!snap.exists()) return;

Object.entries(snap.val()).forEach(([phone,u])=>{
box.innerHTML += `
<div class="card">
📱 ${phone}<br>
💰 ${u.balance || 0} FC<br>

<button class="no" onclick="delUser('${phone}')">Supprimer</button>
</div>`;
});
});

// ================= RECHARGES =================
onValue(ref(db,"demandes_recharges"), snap=>{
const box = document.getElementById("recharges");
box.innerHTML = "";

if(!snap.exists()) return;

Object.entries(snap.val()).forEach(([id,r])=>{

if(r.status && r.status !== "pending") return;

box.innerHTML += `
<div class="card">
${r.user} - ${r.amount} FC<br>

<button class="ok" onclick="valRecharge('${id}','${r.user}',${r.amount})">Valider</button>
<button class="no" onclick="deleteItem('demandes_recharges','${id}')">Refuser</button>
</div>`;
});
});

// ================= RETRAITS =================
onValue(ref(db,"demandes_retraits"), snap=>{
const box = document.getElementById("retraits");
box.innerHTML = "";

if(!snap.exists()) return;

Object.entries(snap.val()).forEach(([id,r])=>{

if(r.statut === "validé") return;

box.innerHTML += `
<div class="card">
${r.numero} - ${r.montant} FC<br>

<button class="ok" onclick="valRetrait('${id}')">Valider</button>
<button class="no" onclick="deleteItem('demandes_retraits','${id}')">Refuser</button>
</div>`;
});
});

// ================= COMMANDES =================
// ================= COMMANDES =================
onValue(ref(db,"orders/pending"), snap=>{
const box = document.getElementById("commandes");
box.innerHTML = "";

if(!snap.exists()) return;

Object.entries(snap.val()).forEach(([user, cmds])=>{
Object.entries(cmds).forEach(([id,c])=>{

// 🔍 Détails dynamiques
let details = "";

// Réseaux sociaux
if(c.link){
    details += `🔗 ${c.link}<br>`;
}
if(c.platform){
    details += `📱 ${c.platform}<br>`;
}
if(c.type){
    details += `📊 ${c.type}<br>`;
}
if(c.nombre){
    details += `🔢 ${c.nombre}<br>`;
}

// Hébergement
if(c.siteUrl){
    details += `🌐 ${c.siteUrl}<br>`;
}
if(c.duree){
    details += `⏳ ${c.duree}<br>`;
}

// Application / IA / site
if(c.desc){
    details += `📝 ${c.desc}<br>`;
}
if(c.typeApp){
    details += `📲 ${c.typeApp}<br>`;
}
if(c.typeSite){
    details += `🌍 ${c.typeSite}<br>`;
}

// 📦 UI
box.innerHTML += `
<div class="card">
👤 ${c.user}<br>
📦 ${c.service}<br>
💰 ${c.price} FC<br>

${details}

<button class="ok" onclick="valCmd('${user}','${id}')">Valider</button>
<button class="no" onclick="refCmd('${user}','${id}',${c.price})">Refuser</button>
</div>`;
});
});
});

// ================= TRANSFERTS =================
onValue(ref(db,"transferts"), snap=>{
const box = document.getElementById("transferts");
box.innerHTML = "";

if(!snap.exists()) return;

Object.entries(snap.val()).forEach(([id,t])=>{

if(t.status !== "pending") return;

box.innerHTML += `
<div class="card">
${t.from} → ${t.to}<br>
💰 ${t.amount} FC<br>

<button class="ok" onclick="valTrans('${id}','${t.from}','${t.to}',${t.amount})">Valider</button>
<button class="no" onclick="deleteItem('transferts','${id}')">Refuser</button>
</div>`;
});
});

// ================= ACTIONS =================

// ✅ RECHARGE
window.valRecharge = async(id,user,amount)=>{
const userRef = ref(db,"users/"+user);
const snap = await get(userRef);

const bal = snap.val().balance || 0;

await update(userRef,{
balance: bal + amount
});

await remove(ref(db,"demandes_recharges/"+id));
};

// ✅ RETRAIT


window.valRetrait = async(id)=>{

    const retraitRef = ref(db,"demandes_retraits/"+id);
    const snap = await get(retraitRef);

    if(!snap.exists()) return;

    const data = snap.val();

    const user = data.user; // ✅ CORRIGÉ
    const amount = data.montant;

    const userRef = ref(db,"users/"+user);
    const snapUser = await get(userRef);

    if(!snapUser.exists()) return;

    const balance = snapUser.val().balance || 0;

        // sécurité

    if(balance < amount){
        alert("❌ Solde insuffisant !");
        return;
    }
// 🔻 déduction
    await update(userRef,{
        balance: balance - amount
    });

    // 🧾 supprimer demande
    await remove(retraitRef);
    // 📩 notifier utilisateur
    await push(ref(db,"messages/"+user),{
        text: "✅ Retrait validé : " + amount + " FC",
        date: Date.now()
    });

    alert("✅ Retrait validé");
};

// ✅ COMMANDES
window.valCmd = async(user,id)=>{
const snapRef = ref(db,"orders/pending/"+user+"/"+id);
const snap = await get(snapRef);

const data = snap.val();

await set(ref(db,"orders/validated/"+user+"/"+id), data);
await remove(snapRef);
};

window.refCmd = async(user,id,price)=>{
// 🔁 remboursement
const userRef = ref(db,"users/"+user);
const snapUser = await get(userRef);
const bal = snapUser.val().balance || 0;

await update(userRef,{
balance: bal + price
});

const snapRef = ref(db,"orders/pending/"+user+"/"+id);
const snap = await get(snapRef);

await set(ref(db,"orders/cancelled/"+user+"/"+id), snap.val());
await remove(snapRef);
};

// ✅ TRANSFERT (FIX BUG)
window.valTrans = async(id,from,to,amount)=>{

// 🔻 retirer chez l'expéditeur
const fromRef = ref(db,"users/"+from);
const snapFrom = await get(fromRef);
const balFrom = snapFrom.val().balance || 0;

await update(fromRef,{
balance: balFrom - amount
});

// ➕ ajouter chez receveur
const toRef = ref(db,"users/"+to);
const snapTo = await get(toRef);
const balTo = snapTo.val().balance || 0;

await update(toRef,{
balance: balTo + amount
});

// ✔ supprimer demande
await remove(ref(db,"transferts/"+id));
};

// ❌ DELETE
window.deleteItem = async(path,id)=>{
await remove(ref(db,path+"/"+id));
};

// ❌ DELETE USER
window.delUser = async(phone)=>{
if(confirm("Supprimer cet utilisateur ?")){
await remove(ref(db,"users/"+phone));
}
};

// ================= 📩 MESSAGE =================
window.sendMsg = async()=>{

const user = document.getElementById("target").value.trim();
const msg = document.getElementById("msg").value.trim();
const file = document.getElementById("file").value.trim();

if(!user) return alert("Numéro requis");

await push(ref(db,"messages/"+user),{
text: msg || null,
image: file || null,
file: file || null,
date: Date.now(),
read:false
});

alert("✅ Message envoyé");
};
