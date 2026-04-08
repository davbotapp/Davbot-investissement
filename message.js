// ================= 📩 MESSAGE SYSTEM =================

// ================= 📤 ADMIN → USER =================
export async function sendAdminMsg(db){

const user = document.getElementById("target").value.trim();
const msgInput = document.getElementById("msg");
const msg = msgInput.value.trim();
const fileInput = document.getElementById("uploadFile");
const btn = document.querySelector(".mainBtn");

if(!user){
    alert("❌ Numéro utilisateur requis");
    return;
}

// check user
const userSnap = await get(ref(db,"users/"+user));

if(!userSnap.exists()){
    alert("❌ Utilisateur introuvable");
    return;
}

// UI loading
btn.disabled = true;
btn.innerText = "⏳ Envoi...";

try{

let imageBase64 = null;

// 📷 IMAGE
if(fileInput.files.length > 0){

    const file = fileInput.files[0];

    if(!file.type.startsWith("image/")){
        alert("❌ Image uniquement");
        resetBtn(btn);
        return;
    }

    imageBase64 = await new Promise((resolve)=>{
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.readAsDataURL(file);
    });

}

// 📤 SEND
if(!msg && !imageBase64){
    alert("❌ Message vide");
    resetBtn(btn);
    return;
}

await push(ref(db,"messages/"+user),{
    text: msg || "📷 Image envoyée",
    image: imageBase64,
    from:"admin",
    date: Date.now(),
    read:false,
    type:"chat"
});

// UI
alert("✅ Message envoyé");

// reset
msgInput.value="";
fileInput.value="";

resetBtn(btn);

}catch(err){

console.error(err);
alert("❌ Erreur");

resetBtn(btn);
}

}

// ================= 🔁 RESET BTN =================
function resetBtn(btn){
btn.disabled = false;
btn.innerText = "Envoyer";
}


// ================= 📥 SUPPORT USER =================
export function listenSupportMessages(db){

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
const date = msg.date ? new Date(msg.date).toLocaleString() : "";

// avatar
const avatar = photo
? `<img src="${photo}" style="width:50px;height:50px;border-radius:50%;">`
: `<div style="
width:50px;height:50px;border-radius:50%;
background:#00d2ff;display:flex;
align-items:center;justify-content:center;
color:black;font-weight:bold;">
${name.substring(0,2)}
</div>`;

// image
const imageBox = image
? `<img src="${image}" style="width:100%;margin-top:10px;border-radius:10px;">`
: "";

// UI
box.innerHTML += `
<div class="card">

<div style="display:flex;gap:10px;align-items:center;">
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

<div style="margin-top:10px;display:flex;gap:5px;">

<button onclick="copyUserMsg(\`${text}\`)">📋</button>
<button onclick="deleteUserMsg('${id}')" style="background:red;">🗑️</button>

</div>

</div>
`;

});

});

}
