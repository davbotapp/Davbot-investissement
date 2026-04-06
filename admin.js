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
            details += `
            🎮 Jeu : ${c.name || "-"}<br>
            ⚡ Mode : ${c.mode || "-"}<br>
            `;
        }

        if(c.service === "IA Bot"){
            details += `
            🤖 Type : ${c.botType || "-"}<br>
            📌 Infos :<br>
            ${Object.entries(c)
                .filter(([k]) => !["service","price","date","user","status"].includes(k))
                .map(([k,v])=>`${k} : ${v}<br>`).join("")}
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
            details += `
            🔐 VPN : ${c.vpnType || "-"}<br>
            📡 Réseau : ${c.reseau || "-"}<br>
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
