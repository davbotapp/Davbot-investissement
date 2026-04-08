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
// ================= RECHARGES =================
onValue(ref(db,"demandes_recharges"), async snap=>{
const box = document.getElementById("recharges");
if(!box) return;

box.innerHTML = "";

if(!snap.exists()){
box.innerHTML = "<small>Aucune recharge</small>";
return;
}

for(const [id,r] of Object.entries(snap.val())){

// 🔒 afficher seulement pending
if(r.status && r.status !== "pending") continue;

// 🔥 récupérer user
const userSnap = await get(ref(db,"users/"+r.user));
const u = userSnap.val() || {};

const name = u.name || "Utilisateur";
const photo = u.photo || "";
const phone = r.user || "Non défini";
const balance = u.balance || 0;

// 🔥 date
const date = r.date ? new Date(r.date).toLocaleString() : "Non défini";

// 🔥 statut
const status = r.status || "pending";

// 🔥 avatar
const avatar = photo
? `<img src="${photo}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">`
: `<div style="
width:50px;
height:50px;
border-radius:50%;
background:#00d2ff;
display:flex;
align-items:center;
justify-content:center;
color:black;
font-weight:bold;">
${name.substring(0,2)}
</div>`;

box.innerHTML += `

<div class="card">

<div style="display:flex;align-items:center;gap:10px;">
${avatar}

<div>
<b>${name}</b><br>
📱 ${phone}
</div>
</div>

<hr>

💰 Montant : <b>${r.amount} FC</b><br>
💳 Solde actuel : <b>${balance} FC</b><br>
📅 Date : <b>${date}</b><br>
📌 Statut : <b style="color:orange;">${status}</b><br>
🆔 ID : <small>${id}</small>

${r.proof ? `
<br><br>📸 Preuve :
<br><img src="${r.proof}" style="width:100%;border-radius:10px;">
` : ""}

<div style="margin-top:12px;display:flex;gap:5px;">

<button class="ok" onclick="valRecharge('${id}','${r.user}',${r.amount})">
✅ Valider
</button>

<button class="no" onclick="refRecharge('${id}','${r.user}',${r.amount})">
❌ Refuser
</button>

</div>

</div>

`;
}
});

// ================= COMMANDES =================
onValue(ref(db,"orders/pending"), async snap=>{

const box = document.getElementById("commandes");
if(!box) return;

box.innerHTML = "<small>⏳ Chargement...</small>";

if(!snap.exists()){
    box.innerHTML = "<small>Aucune commande</small>";
    return;
}

// 🔥 USERS
const usersSnap = await get(ref(db,"users"));
const usersData = usersSnap.exists() ? usersSnap.val() : {};

let html = "";

// ================= LOOP =================
for(const [user, cmds] of Object.entries(snap.val())){

    const u = usersData[user] || {};
    const name = u.name || "Utilisateur";
    const photo = u.photo || "";

    const avatar = photo
    ? `<img src="${photo}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">`
    : `<div style="width:50px;height:50px;border-radius:50%;background:#00d2ff;display:flex;align-items:center;justify-content:center;color:black;font-weight:bold;">
        ${name.substring(0,2).toUpperCase()}
      </div>`;

    for(const [id, c] of Object.entries(cmds)){

        const date = c.date ? new Date(c.date).toLocaleString() : "-";

        let details = "";

        // ================= SERVICES =================

        if(c.service === "Application"){
            details += `
            📱 Nom : ${c.name || "-"}<br>
            🎨 Couleur : ${c.color || "-"}<br>
            ⚡ Type : ${c.type || "-"}<br>
            `;
        }

        if(c.service === "Site Web Pro"){
            details += `
            🌐 Nom : ${c.name || "-"}<br>
            🎨 Couleur : ${c.color || "-"}<br>
            ⚡ Type : ${c.type || "-"}<br>
            `;
        }

        if(c.service === "Mini Jeux"){

    const d = c.details || {};

    details += `
    🎮 Jeu : ${d.name || c.type || "-"}<br>
    ⚡ Mode : ${c.mode || "-"}<br>

    ${
        Object.entries(d)
        .filter(([k]) => k !== "name")
        .map(([k,v])=>`🔹 ${k} : ${v}<br>`)
        .join("") || ""
    }
    `;
}

        if(c.service === "IA Bot"){

    const d = c.details || {};

    details += `
    🤖 Type : ${c.botType || "-"}<br>
    📌 Infos :<br>

    ${
        Object.entries(d)
        .map(([k,v])=>`🔹 ${k} : ${v}<br>`)
        .join("") || "Aucune info"
    }
    `;
}

        if(c.service === "Réseaux Sociaux"){
            details += `
            📱 Plateforme : ${c.platform || "-"}<br>
            📊 Type : ${c.type || "-"}<br>
            🔢 Quantité : ${c.quantity || 0}<br>
            🔗 Lien : ${c.link || "-"}<br>
            `;
        }

        if(c.service === "VPN"){

    const d = c.details || {};

    details += `
    🔐 VPN : ${c.vpnType || "-"}<br>
    📡 Réseau : ${d.reseau || "-"}<br>
    🏷️ Nom : ${d.vpnName || "-"}<br>
    ⚙️ Config : ${d.config || "-"}<br>
    📦 Plan : ${c.plan || "-"}<br>
    `;
}

        // ================= IMAGES =================
        Object.entries(c).forEach(([k,v])=>{
            if(typeof v === "string" && v.startsWith("data:image")){
                details += `
                <div style="margin-top:10px;">
                    <img src="${v}" style="width:100%;border-radius:10px;">
                    <button onclick="downloadImage('${v}')" style="margin-top:5px;">📥 Télécharger</button>
                </div>
                `;
            }
        });

        // ================= CARD =================
        html += `
        <div class="card" style="
        background:rgba(255,255,255,0.03);
        padding:15px;
        border-radius:15px;
        margin-bottom:10px;
        border:1px solid rgba(255,255,255,0.05);
        ">

        <div style="display:flex;gap:10px;align-items:center;">
        ${avatar}
        <div>
        <b>${name}</b><br>
        <small style="opacity:0.6;">📱 ${user}</small>
        </div>
        </div>

        <hr style="opacity:0.1;margin:10px 0;">

        📦 <b>${c.service}</b><br>
        💰 <b style="color:#00d2ff">${(c.price || 0).toLocaleString()} FC</b><br>
        📅 ${date}

        <div style="margin-top:10px;line-height:1.6;">
        ${details || "Aucun détail"}
        </div>

        <div style="margin-top:12px;display:flex;gap:6px;">
        <button onclick="valCmd('${user}','${id}')" style="background:#4caf50;">✅</button>
        <button onclick="refCmd('${user}','${id}',${c.price || 0})" style="background:#ff4d4d;">❌</button>
        </div>

        </div>
        `;
    }
}

box.innerHTML = html;

});
// ================= TRANSFERTS =================
// ================= TRANSFERTS =================
onValue(ref(db,"transferts"), async snap=>{

const box = document.getElementById("transferts");
if(!box) return;

box.innerHTML = "";

if(!snap.exists()){
box.innerHTML = "<small>Aucun transfert</small>";
return;
}

for(const [id,t] of Object.entries(snap.val())){

// 🔒 afficher seulement pending
if(t.status && t.status !== "pending") continue;

// 🔥 récupérer utilisateurs
const fromSnap = await get(ref(db,"users/"+t.from));
const toSnap = await get(ref(db,"users/"+t.to));

const fromUser = fromSnap.val() || {};
const toUser = toSnap.val() || {};

// 🔥 infos
const fromName = fromUser.name || "Expéditeur";
const toName = toUser.name || "Receveur";
const fromPhoto = fromUser.photo || "";
const toPhoto = toUser.photo || "";

const date = t.date ? new Date(t.date).toLocaleString() : "Non défini";
const amount = t.amount || 0;
const status = t.status || "pending";

// 🔥 avatars
const fromAvatar = fromPhoto
? `<img src="${fromPhoto}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">`
: `<div style="
width:50px;height:50px;border-radius:50%;
background:#00d2ff;display:flex;align-items:center;
justify-content:center;color:black;font-weight:bold;">
${fromName.substring(0,2)}
</div>`;

const toAvatar = toPhoto
? `<img src="${toPhoto}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">`
: `<div style="
width:50px;height:50px;border-radius:50%;
background:#00d2ff;display:flex;align-items:center;
justify-content:center;color:black;font-weight:bold;">
${toName.substring(0,2)}
</div>`;

// 🔥 couleur statut
const statusColor = status === "pending" ? "orange" :
                    status === "approved" ? "green" : "red";

// 🔥 DETAILS AUTO (images incluses)
let details = "";

Object.entries(t).forEach(([key,value])=>{

if(["from","to","amount","status","date"].includes(key)) return;

// image détectée
if(typeof value === "string" && value.startsWith("data:image")){
details += `
📸 ${key} :<br>
<img src="${value}" style="width:100%;border-radius:10px;margin-top:5px;">
<br>
<a href="${value}" download="preuve.png">
<button style="margin-top:5px;">⬇️ Télécharger</button>
</a><br><br>
`;
}else{
details += `<b>${key}</b> : ${value}<br>`;
}

});

// ================= UI =================
box.innerHTML += `
<div class="card">

<!-- EXPEDITEUR -->
<div style="display:flex;align-items:center;gap:10px;">
${fromAvatar}
<div>
<b>${fromName}</b><br>
📱 ${t.from}
</div>
</div>

<div style="text-align:center;margin:10px 0;">⬇️</div>

<!-- RECEVEUR -->
<div style="display:flex;align-items:center;gap:10px;">
${toAvatar}
<div>
<b>${toName}</b><br>
📱 ${t.to}
</div>
</div>

<hr>

💰 Montant : <b>${amount} FC</b><br>
📅 Date : <b>${date}</b><br>
📌 Statut : <b style="color:${statusColor};">${status}</b><br>
🆔 <small>${id}</small>

<div class="details" style="margin-top:10px;">
${details || "Aucun détail"}
</div>

<div style="margin-top:10px;display:flex;gap:5px;">
<button class="ok" onclick="valTrans('${id}','${t.from}','${t.to}',${amount})">
✅ Valider
</button>

<button class="no" onclick="refTrans('${id}')">
❌ Refuser
</button>
</div>

</div>
`;

}

});
// ================= 💰 MONÉTISATION =================
onValue(ref(db,"demandes_monetisation"), async snap=>{

const box = document.getElementById("monetisations");
if(!box) return;

box.innerHTML = "";

if(!snap.exists()){
box.innerHTML = "<small>Aucune demande</small>";
return;
}

for(const [id,m] of Object.entries(snap.val())){

// 🔒 seulement pending
if(m.status && m.status !== "pending") continue;

// 🔥 récupérer user
const userSnap = await get(ref(db,"users/"+m.user));
const u = userSnap.val() || {};

const name = u.name || "Utilisateur";
const photo = u.photo || "";
const phone = m.user;

// 🔥 date
const date = m.date ? new Date(m.date).toLocaleString() : "Non défini";

// 🔥 statut
const status = m.status || "pending";
const statusColor = status === "pending" ? "orange" :
                    status === "approved" ? "green" : "red";

// 🔥 avatar
const avatar = photo
? `<img src="${photo}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">`
: `<div style="
width:50px;height:50px;border-radius:50%;
background:#00d2ff;display:flex;align-items:center;
justify-content:center;color:black;font-weight:bold;">
${name.substring(0,2)}
</div>`;

// 🔥 détails dynamiques + images
let details = "";

Object.entries(m).forEach(([key,value])=>{

if(["user","status","date"].includes(key)) return;

// 🖼️ IMAGE
if(typeof value === "string" && value.startsWith("data:image")){
details += `
📸 ${key} :<br>
<img src="${value}" style="width:100%;border-radius:10px;margin-top:5px;">
<br>
<a href="${value}" download="preuve.png">
<button style="margin-top:5px;">⬇️ Télécharger</button>
</a><br><br>
`;
}else{
details += `<b>${key}</b> : ${value}<br>`;
}

});

// ================= UI =================
box.innerHTML += `
<div class="card">

<div style="display:flex;align-items:center;gap:10px;">
${avatar}
<div>
<b>${name}</b><br>
📱 ${phone}
</div>
</div>

<hr>

💰 Demande de monétisation<br>
💵 Montant payé : <b>${m.amount || 2500} FC</b><br>
📅 Date : <b>${date}</b><br>
📌 Statut : <b style="color:${statusColor};">${status}</b><br>
🆔 <small>${id}</small>

<div class="details" style="margin-top:10px;">
${details || "Aucun détail"}
</div>

<div style="margin-top:10px;display:flex;gap:5px;">
<button class="ok" onclick="valMonet('${id}','${phone}')">
✅ Approuver
</button>

<button class="no" onclick="refMonet('${id}','${phone}')">
❌ Refuser
</button>
</div>

</div>
`;

}

});


// ================= ACTIONS =================
// ================= LOGGER =================
async function logAction(type, data){
try{
await push(ref(db,"admin_logs"),{
type,
...data,
date:Date.now()
});
}catch(e){
console.error("Log error:", e);
}
}

// ================= SAFE GET =================
async function safeGet(path){
const snap = await get(ref(db, path));
return snap.exists() ? snap.val() : null;
}

// ================= SAFE DELETE =================
async function safeDelete(path){
const snap = await get(ref(db, path));
if(!snap.exists()) return false;
await remove(ref(db, path));
return true;
}

// ================= VALID RECHARGE =================
window.valRecharge = async(id,user,amount)=>{

if(lock(id)) return alert("⏳ Traitement en cours...");

try{

if(!user || amount <= 0) throw "❌ Données invalides";

// 🔍 Vérifier recharge
const recharge = await safeGet("demandes_recharges/"+id);
if(!recharge) throw "⚠️ Déjà traité";

// 🔍 Vérifier user
const userData = await safeGet("users/"+user);
if(!userData) throw "❌ Utilisateur introuvable";

const oldBal = userData.balance || 0;
const newBal = oldBal + amount;

// 💰 Update solde
await update(ref(db,"users/"+user),{ balance:newBal });

// 📦 Archive
await set(ref(db,"recharges_validées/"+id),{
user, amount,
oldBalance:oldBal,
newBalance:newBal,
status:"approved",
date:Date.now()
});

// 🗑️ Supprimer demande
await safeDelete("demandes_recharges/"+id);

// 📩 Notification
await push(ref(db,"messages/"+user),{
text:`✅ Recharge validée\n💰 +${amount} FC`,
date:Date.now(),
read:false
});

// 📊 Log
await logAction("recharge_validée",{user,amount});

alert("✅ Recharge validée");

}catch(e){
console.error(e);
alert(e || "❌ Erreur système");
}

unlock(id);
};

// ================= REFUSE RECHARGE =================
window.refRecharge = async(id,user,amount)=>{

if(lock(id)) return alert("⏳ Traitement...");

try{

const recharge = await safeGet("demandes_recharges/"+id);
if(!recharge) throw "⚠️ Déjà traité";

// 📦 Archive
await set(ref(db,"recharges_refusées/"+id),{
user, amount,
status:"refused",
date:Date.now()
});

// 🗑️ Delete
await safeDelete("demandes_recharges/"+id);

// 📩 Message
await push(ref(db,"messages/"+user),{
text:`❌ Recharge refusée\n💰 ${amount} FC`,
date:Date.now()
});

// 📊 Log
await logAction("recharge_refusée",{user,amount});

alert("❌ Recharge refusée");

}catch(e){
console.error(e);
alert(e || "Erreur");
}

unlock(id);
};

// ================= VALID COMMAND =================
window.valCmd = async(user,id)=>{

if(lock(id)) return alert("⏳ Traitement...");

try{

const cmd = await safeGet(`orders/pending/${user}/${id}`);
if(!cmd) throw "⚠️ Déjà traité";

// 📦 Archive
await set(ref(db,`orders/validated/${user}/${id}`),{
...cmd,
status:"approved",
dateValidated:Date.now()
});

// 🗑️ Delete
await safeDelete(`orders/pending/${user}/${id}`);

// 📩 Message
await push(ref(db,"messages/"+user),{
text:`✅ Commande validée\n📦 ${cmd.service}`,
date:Date.now()
});

// 📊 Log
await logAction("commande_validée",{user,price:cmd.price || 0});

alert("✅ Commande validée");

}catch(e){
console.error(e);
alert(e || "Erreur");
}

unlock(id);
};

// ================= REFUSE COMMAND =================
window.refCmd = async(user,id,price)=>{

if(lock(id)) return alert("⏳ Traitement...");

try{

if(price < 0) throw "❌ Prix invalide";

// 🔍 Commande
const cmd = await safeGet(`orders/pending/${user}/${id}`);
if(!cmd) throw "⚠️ Déjà traité";

// 🔍 User
const userData = await safeGet("users/"+user);
if(!userData) throw "❌ User introuvable";

const oldBal = userData.balance || 0;
const newBal = oldBal + price;

// 💰 Remboursement
await update(ref(db,"users/"+user),{
balance:newBal
});

// 📦 Archive
await set(ref(db,`orders/cancelled/${user}/${id}`),{
...cmd,
status:"refused",
price,
oldBalance:oldBal,
newBalance:newBal,
dateCancelled:Date.now()
});

// 🗑️ Delete
await safeDelete(`orders/pending/${user}/${id}`);

// 📩 Message
await push(ref(db,"messages/"+user),{
text:`❌ Commande refusée\n💰 ${price} FC remboursé`,
date:Date.now()
});

// 📊 Log
await logAction("commande_refusée",{user,price});

alert("❌ Refusée + remboursée");

}catch(e){
console.error(e);
alert(e || "Erreur");
}

unlock(id);
};
