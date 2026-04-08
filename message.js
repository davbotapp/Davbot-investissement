// ================= FIREBASE =================
import { 
getDatabase, ref, push, onValue, remove 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const db = getDatabase();

// ================= USER =================
const userPhone = localStorage.getItem("userPhone");
const currentUser = JSON.parse(localStorage.getItem("user")) || {};

// ================= UI =================
const sendBtn = document.getElementById("sendBtn");
const input = document.getElementById("msgInput");
const box = document.getElementById("chatBox");

// ================= ✉️ ENVOYER MESSAGE =================
sendBtn.onclick = async ()=>{

const text = input.value.trim();

if(!text) return alert("Message vide");

try{

await push(ref(db,"messages/"+userPhone),{
text,
from:"user",
name: currentUser.name || "Utilisateur",
phone: userPhone,
photo: currentUser.photo || "",
date: Date.now(),
read:false
});

input.value = "";

}catch(e){
console.error(e);
alert("❌ Erreur envoi");
}

};

// ================= 📥 LIRE MESSAGES =================
onValue(ref(db,"messages/"+userPhone), snap=>{

if(!box) return;

box.innerHTML = "";

if(!snap.exists()){
box.innerHTML = "<small>Aucun message</small>";
return;
}

const data = snap.val();

// 🔥 trier par date
const messages = Object.entries(data).sort((a,b)=>a[1].date - b[1].date);

messages.forEach(([id,m])=>{

const isMe = m.from === "user";

// 🎨 style
const style = isMe 
? "background:#00d2ff;color:black;align-self:flex-end;"
: "background:#222;align-self:flex-start;";

// 🧱 message
box.innerHTML += `
<div style="
margin:5px;
padding:10px;
border-radius:10px;
max-width:75%;
${style}
">

<div>${m.text}</div>

<small style="opacity:0.6;">
${new Date(m.date).toLocaleTimeString()}
</small>

<div style="margin-top:5px;display:flex;gap:5px;">

<button onclick="copyMsg('${m.text}')">📋</button>

${isMe ? `<button onclick="deleteMsg('${id}')">🗑️</button>` : ""}

</div>

</div>
`;

});

// 🔽 scroll auto
box.scrollTop = box.scrollHeight;

});

// ================= 🗑️ SUPPRIMER =================
window.deleteMsg = async(id)=>{

if(!confirm("Supprimer ce message ?")) return;

try{
await remove(ref(db,"messages/"+userPhone+"/"+id));
}catch(e){
console.error(e);
alert("Erreur suppression");
}

};

// ================= 📋 COPIER =================
window.copyMsg = (text)=>{
navigator.clipboard.writeText(text);
alert("📋 Copié !");
};
