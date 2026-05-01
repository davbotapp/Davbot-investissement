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

// ================= 📊 DASHBOARD =================

// 🔥 cache global (rapide)
let usersCache = {};
let ordersCache = {};
let rechargesCache = {};

// ================= USERS + MONEY =================
onValue(ref(db,"users"), snap=>{

usersCache = snap.val() || {};

let totalUsers = 0;
let totalMoney = 0;

Object.values(usersCache).forEach(u=>{

if(!u) return;

// 🛑 ignorer données vides
if(!u.name && !u.balance && !u.points) return;

totalUsers++;
totalMoney += Number(u.balance || 0);

});

// 🔥 affichage
document.getElementById("statUsers").innerText = totalUsers;
document.getElementById("statMoney").innerText = totalMoney.toLocaleString() + " FC";

});


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

Object.entries(snap.val()).forEach(([phone,u])=>{

// 🔒 sécurité données
if(!u || !phone) return;
if(!u.name && !u.balance && !u.points) return;

const name = u.name || "Utilisateur";
const photo = u.photo || "";
const pass = u.password ? "••••••••" : "-";

const balance = Number(u.balance || 0);
const points = Number(u.points || 0);
const revenue = Number(u.revenus || 0);
const monetized = u.monetized ? "✅ Oui" : "❌ Non";

// 🔥 avatar
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
<div class="card">

<div style="display:flex;align-items:center;gap:10px;">
${avatar}
<div>
<b>${name}</b><br>
<small>📱 ${phone}</small>
</div>
</div>

<hr>

💰 <b>${balance.toLocaleString()} FC</b><br>
⭐ ${points} pts<br>
📈 ${revenue.toLocaleString()} FC<br>
💸 ${monetized}

<div style="margin-top:10px;display:flex;gap:5px;flex-wrap:wrap;">

<button onclick="safeClick('add-${phone}',()=>addMoney('${phone}'))">➕</button>

<button onclick="safeClick('remove-${phone}',()=>removeMoney('${phone}'))">➖</button>

<button onclick="openMsg('${phone}')">💬</button>

<button onclick="safeClick('del-${phone}',()=>delUser('${phone}'))">❌</button>

</div>

</div>
`;

});

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
// ================= NOTIFICATION =================
async function sendNotification(user, text){

if(!user || !text) return;

await push(ref(db,"messages/"+user),{
text: text,
from: "admin",
date: Date.now(),
status: "sent"
});

}

// ================= RECHARGES =================
onValue(ref(db,"demandes_recharges"), async snap => {

const box = document.getElementById("recharges");
if(!box) return;

box.innerHTML = "<small>⏳ Chargement...</small>";

try{

const data = snap.val() || {};

// 🔥 charger users UNE SEULE FOIS
const usersData = (await get(ref(db,"users"))).val() || {};

let html = "";
let count = 0;

// 🔥 loop rapide (pas de await dedans)
Object.entries(data).forEach(([id,r])=>{

// 🛑 sécurités
if(!r || !id || !r.user) return;

const amount = Number(r.amount || 0);
if(amount <= 0) return;

if(r.status && r.status !== "pending") return;

const u = usersData[r.user];
if(!u) return;

// 🔥 data
const name = u.name || "Utilisateur";
const phone = r.user;
const balance = Number(u.balance || 0);

// 🔥 date safe
const date = r.date
? new Date(r.date).toLocaleString()
: "Non défini";

// 🔥 avatar
const avatar = u.photo
? `<img src="${u.photo}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">`
: `<div style="
width:50px;height:50px;border-radius:50%;
background:#00d2ff;display:flex;
align-items:center;justify-content:center;
color:black;font-weight:bold;">
${name.substring(0,2).toUpperCase()}
</div>`;

// 🔥 preuve sécurisée
let proofHTML = "";
if(typeof r.proof === "string" && r.proof.startsWith("data:image")){
proofHTML = `
<br><br>📸 Preuve :
<br><img src="${r.proof}" style="width:100%;border-radius:10px;">
`;
}

// 🔥 CARD
html += `
<div class="card">

<div style="display:flex;align-items:center;gap:10px;">
${avatar}
<div>
<b>${name}</b><br>
📱 ${phone}
</div>
</div>

<hr>

💰 <b>${amount.toLocaleString()} FC</b><br>
💳 ${balance.toLocaleString()} FC<br>
📅 ${date}<br>

${proofHTML}

<div style="margin-top:12px;display:flex;gap:5px;">

<button onclick="safeClick('val-${id}',()=>valRecharge('${id}','${phone}',${amount}))">
✅
</button>

<button onclick="safeClick('ref-${id}',()=>refRecharge('${id}'))">
❌
</button>

</div>

</div>
`;

count++;

});

// 🔥 inject
box.innerHTML = html || "<small>Aucune recharge valide</small>";

// 🔥 badge
const badge = document.getElementById("rechBadge");
if(badge){
badge.style.display = count ? "inline-block" : "none";
badge.innerText = count;
}

}catch(e){
console.error("❌ Recharge error:", e);
box.innerHTML = "<small>Erreur chargement</small>";
}

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

onValue(ref(db, "orders/pending"), async (snap) => {

const box = document.getElementById("commandes");
if (!box) return;

box.innerHTML = "<small>⏳ Chargement...</small>";

try {

if (!snap.exists()) {
    box.innerHTML = "<small>Aucune commande</small>";
    return;
}

// 🔥 charger users UNE FOIS
const usersSnap = await get(ref(db, "users"));
const usersData = usersSnap.exists() ? usersSnap.val() : {};

let html = "";
let totalCmd = 0;

// ================= LOOP USERS =================
for (const [user, cmds] of Object.entries(snap.val())) {

    if (!cmds || typeof cmds !== "object") continue;

    const u = usersData[user];
    if (!u) continue;

    const name = u.name || "Utilisateur";
    const photo = u.photo || "";

    const avatar = photo
        ? `<img src="${photo}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">`
        : `<div style="width:50px;height:50px;border-radius:50%;background:#00d2ff;display:flex;align-items:center;justify-content:center;color:black;font-weight:bold;">
            ${name.substring(0,2).toUpperCase()}
          </div>`;

    // ================= LOOP COMMANDES =================
    for (const [id, c] of Object.entries(cmds)) {

        if (!c || !id || !c.service) continue;

        totalCmd++;

        const price = Number(c.price || 0);
        const date = c.date ? new Date(c.date).toLocaleString() : "Non défini";

        let details = "";

        // ================= SERVICES =================

        if (c.service === "Application" || c.service === "Site Web Pro") {
            details += `
            📱 Nom : ${c.name || "-"}<br>
            🎨 Couleur : ${c.color || "-"}<br>
            ⚡ Type : ${c.type || "-"}<br>
            `;
        }

        if (c.service === "Mini Jeux") {
            const d = c.details || {};

            details += `
            🎮 Jeu : ${d.name || c.type || "-"}<br>
            ⚡ Mode : ${c.mode || "-"}<br>
            ${
                Object.entries(d)
                .filter(([k]) => k !== "name")
                .map(([k,v])=>`🔹 ${k} : ${v}<br>`)
                .join("")
            }
            `;
        }

        if (c.service === "IA Bot") {
            const d = c.details || {};

            details += `
            🤖 Type : ${c.botType || "-"}<br>
            ${
                Object.entries(d)
                .map(([k,v])=>`🔹 ${k} : ${v}<br>`)
                .join("")
            }
            `;
        }

        // ✅ FIX IMPORTANT → LIEN CLIQUABLE
        if (c.service === "Réseaux Sociaux") {

            let linkHTML = "Non défini";

            if (c.link && c.link.startsWith("http")) {
                linkHTML = `<a href="${c.link}" target="_blank" style="color:#00d2ff;">🔗 Ouvrir</a>`;
            } else if (c.link) {
                linkHTML = c.link;
            }

            details += `
            📱 Plateforme : ${c.platform || "-"}<br>
            📊 Type : ${c.type || "-"}<br>
            🔢 Quantité : ${c.quantity || 0}<br>
            🔗 Lien : ${linkHTML}<br>
            🆔 Plan : ${c.plan || "-"}<br>
            `;
        }

        if (c.service === "VPN") {
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
        Object.values(c).forEach(v => {
            if (typeof v === "string" && v.startsWith("data:image")) {
                details += `
                <div style="margin-top:10px;">
                    <img src="${v}" style="width:100%;border-radius:10px;">
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
        💰 <b style="color:#00d2ff">${price.toLocaleString()} FC</b><br>
        📅 ${date}

        <div style="margin-top:10px;line-height:1.6;">
            ${details}
        </div>

        <div style="margin-top:12px;display:flex;gap:6px;">
            <button onclick="safeClick('cmd-ok-${id}',()=>valCmd('${user}','${id}'))" style="background:#4caf50;">✅</button>
            <button onclick="safeClick('cmd-no-${id}',()=>refCmd('${user}','${id}',${price}))" style="background:#ff4d4d;">❌</button>
        </div>

        </div>
        `;
    }
}

// 🔥 FINAL
box.innerHTML = html || "<small>Aucune commande valide</small>";

// 🔥 STAT
const statCmd = document.getElementById("statCmd");
if (statCmd) statCmd.innerText = totalCmd;

} catch (e) {
console.error("❌ Erreur commandes:", e);
box.innerHTML = "<small>❌ Erreur chargement</small>";
}

});










// ================= SAFE CLICK =================
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

setTimeout(()=>delete clickLock[id],1000);
};

// ================= VALID CMD =================

window.valCmd = async(user,id)=>{

const key="cmd-"+id;
if(lock(key)) return;

try{

const cmd = await safeGet(`orders/pending/${user}/${id}`);
if(!cmd) throw "Déjà traité";

// 🔥 déplacer vers validé
await set(ref(db,`orders/validated/${user}/${id}`),{
...cmd,
status:"approved"
});

// 🔥 supprimer pending
await remove(ref(db,`orders/pending/${user}/${id}`));

// 🔥 notification
await sendNotification(user,`🚀 Votre commande (${cmd.service}) est prête !\n\nElle a été traitée avec succès par notre équipe.\n\n🎯 Vous pouvez maintenant en profiter.\nMerci pour votre confiance ❤️`
);

alert("Validé");

}catch(e){
alert(e);
}

unlock(key);
};

// ================= REF CMD =================
window.refCmd = async(user,id,price)=>{

const key = "cmd-" + id;
if(lock(key)) return;

try{

// 🔥 récupérer commande
const cmd = await safeGet(`orders/pending/${user}/${id}`);
if(!cmd) throw "Commande déjà traitée";

// 🔥 récupérer user
const u = await safeGet("users/"+user);
if(!u) throw "Utilisateur introuvable";

// 🔥 sécuriser balance
let currentBalance = Number(u.balance);
if(isNaN(currentBalance)) currentBalance = 0;

// 🔥 sécuriser prix
let refund = Number(price);
if(isNaN(refund) || refund <= 0) refund = 0;

// 🔥 nouveau solde
const newBalance = currentBalance + refund;

// 🔥 update Firebase
await update(ref(db,"users/"+user),{
balance: newBalance
});

// 🔥 supprimer commande
await remove(ref(db,`orders/pending/${user}/${id}`));
// 🔥 notification
await sendNotification(
user,
"⚠️ Commande (${cmd.service}) annulée\n\nVotre demande n'a pas pu être réalisée pour des raisons techniques.\n\n💰 Le remboursement ${price} a été effectué automatiquement.\nMerci de votre compréhension 🙏"
);


// 🔥 LOG (optionnel PRO)
await logAction("REF_CMD",{
user,
amount: refund,
cmdId: id
});

alert("❌ Refusé + remboursé " + refund + " FC");

}catch(e){
console.error(e);
alert("Erreur: " + e);
}

unlock(key);
};


// ================= MONETISATION =================
// ================= 💰 MONÉTISATION =================
onValue(ref(db,"demandes_monetisation"), async snap=>{

const box = document.getElementById("monetisations");
if(!box) return;

box.innerHTML = "<small>⏳ Chargement...</small>";

try{

if(!snap.exists()){
box.innerHTML = "<small>Aucune demande</small>";
return;
}

// 🔥 charger tous les users UNE FOIS (optimisation)
const usersSnap = await get(ref(db,"users"));
const usersData = usersSnap.exists() ? usersSnap.val() : {};

let html = "";
let count = 0;

for(const [id,m] of Object.entries(snap.val())){

if(!m || !id || !m.user) continue;

// 🔒 seulement pending
if(m.status && m.status !== "pending") continue;

// 🔥 user
const u = usersData[m.user] || {};
const name = u.name || "Utilisateur";
const photo = u.photo || "";
const phone = m.user;

// 🔥 date
const date = m.date ? new Date(m.date).toLocaleString() : "Non défini";

// 🔥 avatar
const avatar = photo
? `<img src="${photo}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">`
: `<div style="width:50px;height:50px;border-radius:50%;background:#00d2ff;display:flex;align-items:center;justify-content:center;color:black;font-weight:bold;">
${name.substring(0,2).toUpperCase()}
</div>`;

// 🔥 détails dynamiques
let details = "";

Object.entries(m).forEach(([key,value])=>{

if(["user","status","date"].includes(key)) return;

// 🖼️ image
if(typeof value === "string" && value.startsWith("data:image")){
details += `
📸 ${key} :<br>
<img src="${value}" style="width:100%;border-radius:10px;margin-top:5px;">
<br><br>
`;
}else{
details += `<b>${key}</b> : ${value}<br>`;
}

});

// 🔥 UI CARD
html += `
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
💵 Montant : <b>${Number(m.amount || 2500).toLocaleString()} FC</b><br>
📅 ${date}<br>
🆔 <small>${id}</small>

<div style="margin-top:10px;">
${details || "Aucun détail"}
</div>

<div style="margin-top:10px;display:flex;gap:5px;">
<button onclick="safeClick('m-ok-${id}',()=>valMonet('${id}','${phone}'))" style="background:#4caf50;">✅</button>
<button onclick="safeClick('m-no-${id}',()=>refMonet('${id}','${phone}'))" style="background:#ff4d4d;">❌</button>
</div>

</div>
`;

count++;
}

// 🔥 inject
box.innerHTML = html || "<small>Aucune demande valide</small>";

}catch(e){
console.error("❌ Erreur monetisation:", e);
box.innerHTML = "<small>❌ Erreur chargement</small>";
}
});
// ================= VALID MONET =================
window.valMonet = async(id,user)=>{

try{

await update(ref(db,"users/"+user),{
monetized: true
});

await remove(ref(db,"demandes_monetisation/"+id));

// 🔔 notification
await sendNotification(user,
"🟢 Félicitations !\n\nVotre compte est maintenant monétisé 🎉\n\nVous pouvez commencer à générer des revenus 🚀"
);

alert("Monétisation activée");

}catch(e){
alert(e);
}

};

window.refMonet = async(id,user)=>{

try{

await remove(ref(db,"demandes_monetisation/"+id));

// 🔔 notification
await sendNotification(user,
"❌ Votre demande de monétisation a été refusée.\n\nVeuillez vérifier les conditions requises puis réessayer."
);

alert("Refusé");

}catch(e){
alert(e);
}

};
