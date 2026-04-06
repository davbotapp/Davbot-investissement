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

// 🔥 AVATAR AUTO
function getAvatar(photo,name){
return photo
? `<img src="${photo}" style="width:45px;height:45px;border-radius:50%;">`
: `<div style="width:45px;height:45px;border-radius:50%;background:#00d2ff;display:flex;align-items:center;justify-content:center;color:black;font-weight:bold;">
${(name || "?").substring(0,2)}
</div>`;
}

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
const monetized = u.monetized ? "✅ Oui" : "❌ Non";

// 🔥 AVATAR
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

<hr style="opacity:0.2;">

🔐 Mot de passe : <b>${pass}</b><br>
💰 Solde : <b>${balance} FC</b><br>
⭐ Points : <b>${points}</b><br>
📈 Revenus : <b>${revenue} FC</b><br>
💸 Monétisé : <b>${monetized}</b><br>

${photo ? `<br>🖼️ Photo : <br><img src="${photo}" style="width:100%;border-radius:10px;">` : ""}

<div style="margin-top:10px;display:flex;gap:5px;">
<button class="no" onclick="delUser('${phone}')">❌ Supprimer</button>
</div>

</div>
`;

});
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
// ================= COMMANDES FINAL FIX =================
// ================= COMMANDES ULTRA OPTIMISÉ =================
onValue(ref(db,"orders/pending"), async snap=>{

const box = document.getElementById("commandes");
if(!box) return;

box.innerHTML = "<small>⏳ Chargement...</small>";

if(!snap.exists()){
    box.innerHTML = "<small>Aucune commande</small>";
    return;
}

// 🔥 récupérer TOUS les users en 1 seule fois (⚡ rapide)
const usersSnap = await get(ref(db,"users"));
const usersData = usersSnap.exists() ? usersSnap.val() : {};

let html = "";

// 🔥 LOOP USERS
for(const [user, cmds] of Object.entries(snap.val())){

    const u = usersData[user] || {};
    const name = u.name || "⚠️ Inconnu";
    const photo = u.photo || "";

    const avatar = photo
    ? `<img src="${photo}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">`
    : `<div style="width:50px;height:50px;border-radius:50%;background:#00d2ff;display:flex;align-items:center;justify-content:center;color:black;font-weight:bold;">
    ${name.substring(0,2)}
    </div>`;

    // 🔥 LOOP COMMANDES
    for(const [id, c] of Object.entries(cmds)){

        const date = c.date ? new Date(c.date).toLocaleString() : "Non défini";

        let details = "";

        // 📱 APPLICATION
        if(c.service === "Application"){
            details += `
            📱 Nom : ${c.name || "-"}<br>
            🎨 Couleur : ${c.color || "-"}<br>
            ⚡ Type : ${c.type || "-"}<br>`;
        }

        // 🌐 SITE WEB
        if(c.service === "Site Web Pro"){
            details += `
            🌐 Site : ${c.name || "-"}<br>
            🎨 Couleur : ${c.color || "-"}<br>
            ⚡ Type : ${c.type || "-"}<br>`;
        }

        // 🎮 MINI JEUX
        if(c.service === "Mini Jeux"){
            details += `🎮 Jeu : ${c.name || "-"}<br>`;
        }

        // 📲 RÉSEAUX SOCIAUX
        if(c.service === "Réseaux Sociaux"){
            details += `
            📱 Plateforme : ${c.platform || "-"}<br>
            🔢 Quantité : ${c.quantity || 0}<br>`;
        }

        // 🔥 AUTO DETAILS
        Object.entries(c).forEach(([k,v])=>{
            if(["service","price","date"].includes(k)) return;

            if(typeof v === "string" && v.startsWith("data:image")){
                details += `<img src="${v}" style="width:100%;border-radius:10px;"><br>`;
            }
        });

        html += `
        <div class="card">

        <div style="display:flex;gap:10px;">
        ${avatar}
        <div>
        <b>${name}</b><br>
        📱 ${user}
        </div>
        </div>

        <hr>

        📦 <b>${c.service || "Service"}</b><br>
        💰 <b>${c.price || 0} FC</b><br>
        📅 ${date}

        <div style="margin-top:10px;">
        ${details || "Aucun détail"}
        </div>

        <div style="margin-top:10px;display:flex;gap:5px;">
        <button onclick="valCmd('${user}','${id}')">✅</button>
        <button onclick="refCmd('${user}','${id}',${c.price || 0})">❌</button>
        </div>

        </div>
        `;
    }
}

// 🔥 injecter en une fois (⚡ ULTRA RAPIDE)
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

// ================= ACTIONS =================

// 🔥 LOGGER GLOBAL
async function logAction(type, data){
await push(ref(db,"admin_logs"),{
type,
...data,
date: Date.now()
});
}

// ================= RECHARGE =================
window.valRecharge = async(id,user,amount)=>{

const userRef = ref(db,"users/"+user);
const snap = await get(userRef);

if(!snap.exists()) return alert("Utilisateur introuvable");

const bal = snap.val().balance || 0;

// update solde
await update(userRef,{
balance: bal + amount
});

// log
await logAction("recharge_validée",{user,amount});

// message
await push(ref(db,"messages/"+user),{
text: `✅ Recharge validée\n💰 +${amount} FC`,
date: Date.now()
});

// archive
await set(ref(db,"recharges_validées/"+id),{
user, amount, date: Date.now(), status:"approved"
});

// delete pending
await remove(ref(db,"demandes_recharges/"+id));

alert("✅ Recharge validée");
};

window.refRecharge = async(id,user,amount)=>{

if(!confirm("Refuser recharge ?")) return;

// log
await logAction("recharge_refusée",{user,amount});

// message
await push(ref(db,"messages/"+user),{
text: `❌ Recharge refusée\n💰 ${amount} FC`,
date: Date.now()
});

// archive
await set(ref(db,"recharges_refusées/"+id),{
user, amount, date: Date.now(), status:"refused"
});

await remove(ref(db,"demandes_recharges/"+id));
};

// ================= COMMANDES =================
// ================= VALIDER =================
window.valCmd = async(user,id)=>{

const snapRef = ref(db,"orders/pending/"+user+"/"+id);
const snap = await get(snapRef);

if(!snap.exists()) return alert("Commande introuvable");

const data = snap.val();

// archive
await set(ref(db,"orders/validated/"+user+"/"+id),{
...data,
status:"approved",
dateValidated: Date.now()
});

// message user
await push(ref(db,"messages/"+user),{
text:`✅ Commande validée\n📦 ${data.service}`,
date: Date.now()
});

// delete
await remove(snapRef);

alert("✅ Validée");
};

// ================= REFUSER =================
window.refCmd = async(user,id,price)=>{

const userRef = ref(db,"users/"+user);
const snapUser = await get(userRef);

if(snapUser.exists()){
const bal = snapUser.val().balance || 0;

// remboursement
await update(userRef,{
balance: bal + price
});
}

// archive
const snapRef = ref(db,"orders/pending/"+user+"/"+id);
const snap = await get(snapRef);

await set(ref(db,"orders/cancelled/"+user+"/"+id),{
...(snap.val() || {}),
status:"refused",
dateCancelled: Date.now()
});

// message
await push(ref(db,"messages/"+user),{
text:`❌ Commande refusée\n💰 Remboursé ${price} FC`,
date: Date.now()
});

// delete
await remove(snapRef);

alert("❌ Refusée");
};

// ================= TRANSFERT =================
window.valTrans = async(id,from,to,amount)=>{

if(from === to) return alert("Erreur transfert");

const fromRef = ref(db,"users/"+from);
const toRef = ref(db,"users/"+to);

const snapFrom = await get(fromRef);
const snapTo = await get(toRef);

if(!snapFrom.exists() || !snapTo.exists()) return;

const balFrom = snapFrom.val().balance || 0;
const balTo = snapTo.val().balance || 0;

if(balFrom < amount) return alert("Solde insuffisant");

// update
await update(fromRef,{balance: balFrom - amount});
await update(toRef,{balance: balTo + amount});

// log
await logAction("transfert_validé",{from,to,amount});

// messages
await push(ref(db,"messages/"+from),{
text:`💸 -${amount} FC vers ${to}`,
date: Date.now()
});

await push(ref(db,"messages/"+to),{
text:`💰 +${amount} FC de ${from}`,
date: Date.now()
});

// archive
await set(ref(db,"transferts_validés/"+id),{
from,to,amount,date:Date.now()
});

await remove(ref(db,"transferts/"+id));
};

window.refTrans = async(id)=>{

await logAction("transfert_refusé",{id});

await remove(ref(db,"transferts/"+id));

alert("❌ Transfert refusé");
};

// ================= MONETISATION =================
window.valMonet = async(id,user)=>{

await update(ref(db,"users/"+user),{
monetized:true,
monetRequest:false,
monetApprovedDate: Date.now()
});

// log
await logAction("monetisation_validée",{user});

// message
await push(ref(db,"messages/"+user),{
text:"🎉 Monétisation activée",
date: Date.now()
});

// archive
await set(ref(db,"monetisations_validées/"+id),{
user,date:Date.now()
});

await remove(ref(db,"demandes_monetisation/"+id));

alert("✅ Monétisation validée");
};

window.refMonet = async(id,user)=>{

await update(ref(db,"users/"+user),{
monetRequest:false
});

// log
await logAction("monetisation_refusée",{user});

// message
await push(ref(db,"messages/"+user),{
text:"❌ Monétisation refusée",
date: Date.now()
});

// archive
await set(ref(db,"monetisations_refusées/"+id),{
user,date:Date.now()
});

await remove(ref(db,"demandes_monetisation/"+id));
};

// ================= 📩 MESSAGE =================
// ================= 📩 MESSAGE ADMIN → USER (VERSION PRO) =================
window.sendMsg = async () => {

const user = document.getElementById("target").value.trim();
const msg = document.getElementById("msg").value.trim();
const fileInput = document.getElementById("uploadFile");
const btn = document.querySelector(".mainBtn");

// 🔒 Vérification
if(!user){
    alert("❌ Numéro utilisateur requis");
    return;
}

// 🔍 Vérifier si user existe
const userSnap = await get(ref(db,"users/"+user));

if(!userSnap.exists()){
    alert("❌ Utilisateur introuvable");
    return;
}

// 🎯 UI loading
btn.disabled = true;
btn.innerText = "⏳ Envoi en cours...";

try{

    // 📤 CAS AVEC IMAGE
    if(fileInput.files.length > 0){

        const file = fileInput.files[0];

        // 🔒 sécurité type fichier
        if(!file.type.startsWith("image/")){
            alert("❌ Seules les images sont autorisées");
            btn.disabled = false;
            btn.innerText = "Envoyer";
            return;
        }

        const reader = new FileReader();

        reader.onload = async function(e){

            await push(ref(db,"messages/"+user),{
                text: msg || "📷 Image envoyée",
                image: e.target.result,
                from: "admin",
                date: Date.now(),
                read:false
            });

            alert("✅ Message + image envoyé");

            // reset
            document.getElementById("msg").value = "";
            fileInput.value = "";

            btn.disabled = false;
            btn.innerText = "Envoyer";
        };

        reader.readAsDataURL(file);

    } else {

        // 📤 TEXTE SIMPLE
        if(!msg){
            alert("❌ Message vide");
            btn.disabled = false;
            btn.innerText = "Envoyer";
            return;
        }

        await push(ref(db,"messages/"+user),{
            text: msg,
            from: "admin",
            date: Date.now(),
            read:false
        });

        alert("✅ Message envoyé");

        // reset
        document.getElementById("msg").value = "";

        btn.disabled = false;
        btn.innerText = "Envoyer";
    }

} catch(err){

    console.error(err);
    alert("❌ Erreur lors de l'envoi");

    btn.disabled = false;
    btn.innerText = "Envoyer";
}

};
// ================= 📩 MESSAGES UTILISATEURS =================
// ================= 📩 MESSAGES UTILISATEURS =================
onValue(ref(db,"support_messages"), snap=>{

const box = document.getElementById("userMessages");
if(!box) return;

box.innerHTML = "";

if(!snap.exists()){
box.innerHTML = "<p>Aucun message utilisateur</p>";
return;
}

Object.entries(snap.val()).reverse().forEach(([id,msg])=>{

const name = msg.name || "Utilisateur";
const phone = msg.phone || "Non défini";
const photo = msg.photo || "";
const text = msg.text || "";
const image = msg.image || "";
const date = msg.date ? new Date(msg.date).toLocaleString() : "Date inconnue";

// 🔥 AVATAR AUTO
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

// 🧠 IMAGE MESSAGE
const imageBox = image
? `<img src="${image}" style="width:100%;margin-top:10px;border-radius:10px;">`
: "";

// ✅ UI COMPLETE
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

📝 ${text || "<i>Aucun message</i>"}

${imageBox}

<br><small>${date}</small>

<div style="margin-top:10px;display:flex;gap:5px;flex-wrap:wrap;">

<button onclick="copyUserMsg(\`${text}\`)">
📋 Copier
</button>

<button onclick="deleteUserMsg('${id}')"
style="background:red;color:white;">
🗑️ Supprimer
</button>

</div>

</div>
`;
});
});
