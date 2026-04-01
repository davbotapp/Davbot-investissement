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

const app = initializeApp(firebaseConfig);0
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
// ================= USERS =================
onValue(ref(db,"users"), snap=>{
    const box = document.getElementById("users");
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
                    : `<div style="
                        width:50px;
                        height:50px;
                        border-radius:50%;
                        background:#00d2ff;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        color:black;
                        font-weight:bold;
                    ">${name.substring(0,2)}</div>`
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

            <button class="no" onclick="delUser('${phone}')">
                ❌ Supprimer
            </button>

        </div>
        `;
    });

});
// ================= RECHARGES =================
// ================= RECHARGES =================

onValue(ref(db,"demandes_recharges"), async snap=>{
const box = document.getElementById("recharges");
box.innerHTML = "";

if(!snap.exists()) return;

for(const [id,r] of Object.entries(snap.val())){

if(r.status && r.status !== "pending") continue;

// 🔥 récupérer user
const userSnap = await get(ref(db,"users/"+r.user));
const u = userSnap.val() || {};

const name = u.name || "Utilisateur";
const photo = u.photo || "";

box.innerHTML += `
<div class="card">

<div style="display:flex;align-items:center;gap:10px;">

${photo 
? `<img src="${photo}" style="width:45px;height:45px;border-radius:50%;">`
: `<div style="width:45px;height:45px;border-radius:50%;background:#00d2ff;display:flex;align-items:center;justify-content:center;color:black;font-weight:bold;">
${name.substring(0,2)}
</div>`
}

<div>
<b>${name}</b><br>
📱 ${r.user}
</div>

</div>

<hr>

💰 ${r.amount} FC

<button class="ok" onclick="valRecharge('${id}','${r.user}',${r.amount})">Valider</button>
<button class="no" onclick="deleteItem('demandes_recharges','${id}')">Refuser</button>

</div>
`;
}
});

// ================= RETRAITS =================
// ================= RETRAITS =================

onValue(ref(db,"demandes_retraits"), async snap=>{
const box = document.getElementById("retraits");
box.innerHTML = "";

if(!snap.exists()) return;

for(const [id,r] of Object.entries(snap.val())){

if(r.statut === "validé") continue;

// 🔥 récupérer user
const userSnap = await get(ref(db,"users/"+r.user));
const u = userSnap.val() || {};

const name = u.name || "Utilisateur";
const photo = u.photo || "";

box.innerHTML += `
<div class="card">

<div style="display:flex;align-items:center;gap:10px;">

${photo 
? `<img src="${photo}" style="width:45px;height:45px;border-radius:50%;">`
: `<div style="width:45px;height:45px;border-radius:50%;background:#00d2ff;display:flex;align-items:center;justify-content:center;color:black;font-weight:bold;">
${name.substring(0,2)}
</div>`
}

<div>
<b>${name}</b><br>
📱 ${r.user}
</div>

</div>

<hr>

💸 ${r.montant} FC

<button class="ok" onclick="valRetrait('${id}')">Valider</button>
<button class="no" onclick="deleteItem('demandes_retraits','${id}')">Refuser</button>

</div>
`;
}
});

// ================= COMMANDES =================
// ================= COMMANDES =================
// ================= COMMANDES =================
onValue(ref(db,"orders/pending"), snap=>{
const box = document.getElementById("commandes");
box.innerHTML = "";

if(!snap.exists()) return;

Object.entries(snap.val()).forEach(([user, cmds])=>{
Object.entries(cmds).forEach(([id,c])=>{

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
details += `📞 Admin : ${c.adminNumber || "non"}<br>`;
details += `🎨 ${c.color || "-"}<br>`;
details += `📝 ${c.desc || "-"}<br>`;
}

// 🎮 MINI JEUX
if(c.service==="Mini Jeux"){
details += `🎮 Nom : ${c.name || "-"}<br>`;
details += `🎨 ${c.color || "-"}<br>`;
details += `📝 ${c.desc || "-"}<br>`;
}

// 🚀 BOOST
if(c.service==="Réseaux Sociaux"){
details += `📱 Plateforme : ${c.platform || "-"}<br>`;
details += `📊 Type : ${c.type || "-"}<br>`;
details += `🔢 Quantité : ${c.nombre || 0}<br>`;
details += `🔗 Lien : ${c.link || "-"}<br>`;
}

// 🌍 HÉBERGEMENT
if(c.service==="Hébergement"){
details += `🌐 Site : ${c.siteUrl || "-"}<br>`;
details += `⏳ Durée : ${c.duree || "-"}<br>`;
}

// 🛡️ VPN
if(c.service==="VPN"){
details += `🛡️ Nom : ${c.vpnName || "-"}<br>`;
details += `📶 Réseau : ${c.reseau || "-"}<br>`;
details += `⏳ Durée : ${c.duree || "-"}<br>`;
}

// 🔥 fallback (au cas où champ nouveau)
Object.keys(c).forEach(k=>{
if(!["service","price","user","date"].includes(k)){
if(!details.includes(k)){
details += `${k} : ${c[k]}<br>`;
}
}
});

// UI
box.innerHTML += `
<div class="card">
👤 ${c.user}<br>
📦 ${c.service}<br>
💰 ${c.price} FC<br>

<div style="
margin-top:8px;
background:#111;
padding:10px;
border-radius:8px;
font-size:13px;
line-height:1.5;
">
${details}
</div>

<button class="ok" onclick="valCmd('${user}','${id}')">Valider</button>
<button class="no" onclick="refCmd('${user}','${id}',${c.price})">Refuser</button>
</div>
`;

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
// 📋 Copier message
// 📋 Copier message utilisateur
window.copyUserMsg = (text)=>{
    if(!text) return alert("Vide");

    navigator.clipboard.writeText(text)
    .then(()=> alert("✅ Copié"))
    .catch(()=> alert(text));
};

// 🗑️ Supprimer message utilisateur
window.deleteUserMsg = async(id)=>{
    if(confirm("Supprimer ce message ?")){
        await remove(ref(db,"support_messages/"+id));
    }
};

// ✅ COMMANDES
window.valCmd = async(user,id)=>{

const snapRef = ref(db,"orders/pending/"+user+"/"+id);
const snap = await get(snapRef);

if(!snap.exists()) return;

const data = snap.val();

// ✅ CAS SPÉCIAL : HÉBERGEMENT
if(data.service === "Hébergement"){

    // 🔥 créer site actif
    await set(ref(db,"hebergements/"+user+"/"+id),{
        siteUrl: data.siteUrl || "Non défini",
        status: "online",
        duree: data.duree || "N/A",
        dateStart: Date.now()
    });

    // 📩 notifier utilisateur
    await push(ref(db,"messages/"+user),{
        text: "🌐 Votre site est maintenant EN LIGNE",
        date: Date.now()
    });
}

// ✅ déplacer commande validée
await set(ref(db,"orders/validated/"+user+"/"+id), data);

// ❌ supprimer pending
await remove(snapRef);

alert("✅ Commande validée");
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
// ================= 📩 MESSAGE =================
window.sendMsg = async()=>{

const user = document.getElementById("target").value.trim();
const msg = document.getElementById("msg").value.trim();
const fileInput = document.getElementById("uploadFile");

if(!user) return alert("Numéro requis");

// 📤 SI FICHIER
if(fileInput.files[0]){

const file = fileInput.files[0];
const reader = new FileReader();

reader.onload = async function(e){

await push(ref(db,"messages/"+user),{
text: msg || null,
image: e.target.result,
date: Date.now(),
read:false
});

alert("✅ Envoyé avec fichier");
};

reader.readAsDataURL(file);

}else{

await push(ref(db,"messages/"+user),{
text: msg || null,
date: Date.now(),
read:false
});

alert("✅ Message envoyé");
}
};
// ================= 📩 MESSAGES UTILISATEURS =================
// ================= 📩 MESSAGES UTILISATEURS =================
onValue(ref(db,"support_messages"), snap=>{

const box = document.getElementById("userMessages");

box.innerHTML = "";

if(!snap.exists()){
    box.innerHTML = "<p>Aucun message utilisateur</p>";
    return;
}

Object.entries(snap.val()).reverse().forEach(([id,msg])=>{

box.innerHTML += `
<div class="card">

${msg.photo ? `<img src="${msg.photo}" style="width:50px;height:50px;border-radius:50%;">` : ""}

👤 ${msg.name || "Utilisateur"}<br>
📱 ${msg.phone}<br>

📝 ${msg.text}

<br><small>${new Date(msg.date).toLocaleString()}</small>

<div style="margin-top:10px;display:flex;gap:5px;">

<button onclick="copyUserMsg('${msg.text || ""}')">
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
