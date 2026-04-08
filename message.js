// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
getDatabase, ref, push, onValue, get, remove
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
apiKey:"AIza...",
authDomain:"starlink-investit.firebaseapp.com",
databaseURL:"https://starlink-investit-default-rtdb.firebaseio.com",
projectId:"starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================= ENVOYER MESSAGE =================
window.sendMsg = async ()=>{

const user = document.getElementById("target").value.trim();
const text = document.getElementById("msg").value.trim();
const file = document.getElementById("uploadFile").files[0];

if(!user) return alert("❌ Numéro requis");
if(!text && !file) return alert("❌ Message vide");

try{

// 📸 IMAGE
if(file){
const reader = new FileReader();

reader.onload = async ()=>{
await push(ref(db,"messages/"+user),{
text: text || "📷 Image",
image: reader.result,
from:"admin",
date:Date.now(),
read:false
});

alert("✅ Envoyé");
};

reader.readAsDataURL(file);

}else{

// 📩 TEXTE
await push(ref(db,"messages/"+user),{
text,
from:"admin",
date:Date.now(),
read:false
});

alert("✅ Message envoyé");
}

document.getElementById("msg").value="";
document.getElementById("uploadFile").value="";

}catch(e){
console.error(e);
alert("❌ Erreur");
}
};

// ================= SUPPRIMER MESSAGE =================
window.deleteMsg = async(user,id)=>{
if(!confirm("Supprimer ce message ?")) return;

await remove(ref(db,`messages/${user}/${id}`));
};

// ================= COPIER MESSAGE =================
window.copyMsg = (text)=>{
navigator.clipboard.writeText(text);
alert("📋 Copié");
};

// ================= AFFICHAGE CHAT =================
onValue(ref(db,"messages"), async snap=>{

const box = document.getElementById("userMessages");
if(!box) return;

box.innerHTML = "⏳ Chargement...";

if(!snap.exists()){
box.innerHTML = "<small>Aucun message</small>";
return;
}

let html = "";

for(const [user, msgs] of Object.entries(snap.val())){

// 🔥 récupérer nom user
let name = user;

try{
const userSnap = await get(ref(db,"users/"+user));
if(userSnap.exists()){
name = userSnap.val().name || user;
}
}catch(e){}

// 🔥 messages
Object.entries(msgs).reverse().forEach(([id,m])=>{

const date = m.date
? new Date(m.date).toLocaleString()
: "";

// 🧠 style message
const isAdmin = m.from === "admin";

html += `
<div class="card" style="margin-bottom:10px;">

<div style="display:flex;justify-content:space-between;">
<b>${name}</b> 📱 ${user}
</div>

<div style="
margin-top:8px;
padding:10px;
border-radius:10px;
background:${isAdmin ? '#003b4d' : '#111'};
">

${isAdmin ? "🛡️ ADMIN" : "👤 USER"} : ${m.text || ""}

${m.image ? `<img src="${m.image}" style="width:100%;margin-top:5px;border-radius:10px;">` : ""}

</div>

<div style="display:flex;gap:5px;margin-top:5px;">

<button onclick="copyMsg(\`${m.text || ''}\`)" style="background:#4caf50;">📋</button>

<button onclick="deleteMsg('${user}','${id}')" style="background:#f44336;">🗑️</button>

</div>

<small style="opacity:0.6;">${date}</small>

</div>
`;

});

}

box.innerHTML = html;

});
