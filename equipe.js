import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔥 CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyA24pBo8mBWiZssPtep--MMBdB7c8_Lu4U",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 👤 USER
const userPhone = localStorage.getItem("userPhone");
if(!userPhone) window.location.href = "index.html";

// 📦 ELEMENTS
const codeEl = document.getElementById("code");
const lvl1El = document.getElementById("lvl1");
const lvl2El = document.getElementById("lvl2");
const lvl3El = document.getElementById("lvl3");
const totalEl = document.getElementById("total");
const gainsEl = document.getElementById("gains");
const pointsEl = document.getElementById("points");

const channelInput = document.getElementById("whatsappChannel");
const groupInput = document.getElementById("whatsappGroup");

// ================= USER DATA =================
onValue(ref(db, "users/" + userPhone), snap=>{
    if(!snap.exists()) return;

    const data = snap.val();

    const code = data.inviteCode || "DAV-000";
    codeEl.innerText = code;

    const l1 = data.count_lvl1 || 0;
    const l2 = data.count_lvl2 || 0;
    const l3 = data.count_lvl3 || 0;

    lvl1El.innerText = l1;
    lvl2El.innerText = l2;
    lvl3El.innerText = l3;

    totalEl.innerText = l1 + l2 + l3;

    gainsEl.innerText = (data.balance || 0).toLocaleString();
    pointsEl.innerText = data.points || 0;

    if(data.whatsappChannel) channelInput.value = data.whatsappChannel;
    if(data.whatsappGroup) groupInput.value = data.whatsappGroup;
});

// ================= SAVE WHATSAPP =================
channelInput.addEventListener("change", saveLinks);
groupInput.addEventListener("change", saveLinks);

async function saveLinks(){
    try{
        await update(ref(db, "users/" + userPhone), {
            whatsappChannel: channelInput.value || null,
            whatsappGroup: groupInput.value || null
        });
    }catch(e){
        alert("❌ Erreur sauvegarde");
    }
}

// ================= PARRAINAGE =================
export async function handleParrainage(newUserPhone, inviteCode){

    const snap = await get(ref(db, "users"));
    if(!snap.exists()) return;

    let parrain = null;

    Object.entries(snap.val()).forEach(([phone, u])=>{
        if(u.inviteCode === inviteCode){
            parrain = { phone, data: u };
        }
    });

    if(!parrain) return;

    let lvl1 = parrain.data.count_lvl1 || 0;
    let lvl2 = parrain.data.count_lvl2 || 0;
    let lvl3 = parrain.data.count_lvl3 || 0;
    let points = parrain.data.points || 0;

    // 🎯 NIVEAUX
    if(lvl1 < 10){
        lvl1++;
        points += 8;
    }
    else if(lvl2 < 30){
        lvl2++;
        points += 10;
    }
    else if(lvl3 < 50){
        lvl3++;
        points += 15;
    }

    // 💾 UPDATE
    await update(ref(db, "users/" + parrain.phone), {
        count_lvl1: lvl1,
        count_lvl2: lvl2,
        count_lvl3: lvl3,
        points: points
    });

    // 🔗 Lier filleul
    await update(ref(db, "users/" + newUserPhone), {
        parrain: parrain.phone
    });
}

// ================= LIEN =================
function getLink(code){
    return location.origin + "/index.html?inviteCode=" + code;
}

// ================= COPY =================
document.getElementById("copyBtn").onclick = ()=>{
    const link = getLink(codeEl.innerText);

    navigator.clipboard.writeText(link)
    .then(()=> alert("✅ Lien copié"))
    .catch(()=> alert(link));
};

// ================= WHATSAPP =================
document.getElementById("whatsappBtn").onclick = ()=>{
    const link = getLink(codeEl.innerText);

    const msg = `🚀 Rejoins DAVBOT

💻 Apps - Sites - IA - Jeux
📈 Boost réseaux

👉 ${link}`;

    window.open("https://wa.me/?text=" + encodeURIComponent(msg));
};
