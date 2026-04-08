// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
getDatabase, ref, push, onValue, get
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

if(!user){
alert("❌ Numéro requis");
return;
}

if(!text && !file){
alert("❌ Message vide");
return;
}

let image = "";

// 📸 convertir image en base64
if(file){
const reader = new FileReader();
reader.onload = async ()=>{
image = reader.result;

await push(ref(db,"messages/"+user),{
text,
image,
from:"admin",
date:Date.now(),
read:false
});

alert("✅ Message envoyé avec image");

document.getElementById("msg").value="";
document.getElementById("uploadFile").value="";
};

reader.readAsDataURL(file);

}else{

await push(ref(db,"messages/"+user),{
text,
from:"admin",
date:Date.now(),
read:false
});

alert("✅ Message envoyé");

document.getElementById("msg").value="";
}
};

// ================= AFFICHER MESSAGES =================
onValue(ref(db,"messages"), async snap=>{

const box = document.getElementById("userMessages");
if(!box) return;

box.innerHTML = "⏳ Chargement...";

if(!snap.exists()){
box.innerHTML = "<small>Aucun message</small>";
return;
}

let html = "";

// 🔥 parcourir tous les users
for(const [user, msgs] of Object.entries(snap.val())){

// 🔥 récupérer nom utilisateur
let name = user;

try{
const userSnap = await get(ref(db,"users/"+user));
if(userSnap.exists()){
name = userSnap.val().name || user;
}
}catch(e){}

// 🔥 parcourir messages
for(const [id, m] of Object.entries(msgs)){

const date = m.date
? new Date(m.date).toLocaleString()
: "";

html += `
<div class="card" style="margin-bottom:8px;">

<b>${name}</b> 📱 ${user}<br>

<div style="margin-top:5px;">
${m.text || ""}
</div>

${m.image ? `
<img src="${m.image}" style="width:100%;margin-top:5px;border-radius:10px;">
` : ""}

<small style="opacity:0.6;">${date}</small>

</div>
`;
}

}

box.innerHTML = html;

});
