// ================= 🔔 NOTIFICATION SYSTEM =================

// ================= UI =================
export function showNotif(text){

const div = document.createElement("div");

div.innerHTML = `
<div style="
background:linear-gradient(90deg,#00d2ff,#4facfe);
padding:12px 15px;
border-radius:10px;
color:black;
font-weight:bold;
box-shadow:0 0 15px rgba(0,210,255,0.5);
animation:fadeIn 0.3s ease;
">
🔔 ${text}
</div>
`;

div.style.position = "fixed";
div.style.bottom = "20px";
div.style.right = "20px";
div.style.zIndex = "9999";

document.body.appendChild(div);

// auto remove
setTimeout(()=>div.remove(),3000);
}


// ================= 🧠 LOGGER =================
export async function logNotif(db, data){

try{
await push(ref(db,"notifications_logs"),{
...data,
date: Date.now()
});
}catch(e){
console.error("Erreur log notif", e);
}

}


// ================= 📢 GLOBAL =================
export async function sendGlobalNotif(db){

const msg = globalMsg.value.trim();
const file = globalFile.files[0];

if(!msg && !file) return alert("Message vide");

const usersSnap = await get(ref(db,"users"));
if(!usersSnap.exists()) return;

const users = Object.keys(usersSnap.val());

// 🔥 convert image UNE FOIS
let imageBase64 = null;

if(file){
imageBase64 = await new Promise((resolve)=>{
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsDataURL(file);
});
}

// 🔁 send
for(const phone of users){

await push(ref(db,"messages/"+phone),{
text: msg || "📷 Image",
image: imageBase64,
from:"admin",
date: Date.now(),
read:false,
type:"notification"
});

}

// log
await logNotif(db,{
type:"global",
message: msg || "image",
users: users.length
});

showNotif("Notification envoyée à tous");

// reset
globalMsg.value="";
globalFile.value="";
}


// ================= 👤 PRIVATE =================
export async function sendPrivateNotif(db, user){

const msg = document.getElementById("msg").value.trim();
const file = document.getElementById("uploadFile").files[0];

if(!user) return alert("Numéro requis");

// check user
const snap = await get(ref(db,"users/"+user));
if(!snap.exists()) return alert("Utilisateur introuvable");

// image
let imageBase64 = null;

if(file){
imageBase64 = await new Promise((resolve)=>{
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsDataURL(file);
});
}

// send
await push(ref(db,"messages/"+user),{
text: msg || "📷 Image",
image: imageBase64,
from:"admin",
date: Date.now(),
read:false,
type:"notification"
});

// log
await logNotif(db,{
type:"private",
to:user,
message:msg
});

showNotif("Message envoyé");

// reset
msg.value="";
uploadFile.value="";
}


// ================= 🔥 AUTO WATCHERS =================
export function startAutoNotif(db){

// ===== COMMANDES =====
let lastCmd = 0;

onValue(ref(db,"orders/pending"), snap=>{

if(!snap.exists()){
lastCmd = 0;
return;
}

let total = 0;

Object.values(snap.val()).forEach(u=>{
total += Object.keys(u).length;
});

if(total > lastCmd){

showNotif("Nouvelle commande reçue");

logNotif(db,{
type:"commande",
count: total
});

}

lastCmd = total;

});


// ===== RECHARGES =====
let lastRech = 0;

onValue(ref(db,"demandes_recharges"), snap=>{

if(!snap.exists()){
lastRech = 0;
return;
}

let total = Object.values(snap.val())
.filter(r => !r.status || r.status==="pending")
.length;

if(total > lastRech){

showNotif("Nouvelle recharge demandée");

logNotif(db,{
type:"recharge",
count: total
});

}

lastRech = total;

});

}
