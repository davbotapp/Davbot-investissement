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

// 🔥 LIENS FIXES
const CHANNEL_LINK = "https://whatsapp.com/channel/0029VbBrUCl6buMF5srz5U2L";
const GROUP_LINK = "https://chat.whatsapp.com/KyzoGEXunBA7g2htNDjMPm";

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
});

// ================= LIEN =================
function getLink(code){
    return location.origin + "/index.html?inviteCode=" + code;
}

// ================= COPY (ULTRA FIX) =================
document.getElementById("copyBtn").onclick = async ()=>{

    const link = getLink(codeEl.innerText);

    try{
        await navigator.clipboard.writeText(link);
        alert("✅ Lien copié !");
    }catch(e){

        // 🔥 fallback Android
        const textarea = document.createElement("textarea");
        textarea.value = link;
        document.body.appendChild(textarea);

        textarea.select();
        textarea.setSelectionRange(0, 99999);

        try{
            document.execCommand("copy");
            alert("✅ Lien copié !");
        }catch(err){
            alert("📋 Copie manuelle :\n" + link);
        }

        document.body.removeChild(textarea);
    }
};

// ================= WHATSAPP =================
document.getElementById("whatsappBtn").onclick = ()=>{

    const link = getLink(codeEl.innerText);

    const msg = `🚀 Rejoins DAVBOT

💻 Applications - Sites - IA - Jeux
📈 Boost réseaux sociaux

👉 ${link}

📢 Chaîne officielle :
${CHANNEL_LINK}

👥 Groupe communauté :
${GROUP_LINK}`;

    window.open("https://wa.me/?text=" + encodeURIComponent(msg));
};

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
    if(lvl1 < 20){
        lvl1++;
        points += 4;
    }
    else if(lvl2 < 30){
        lvl2++;
        points += 8;
    }
    else if(lvl3 < 50){
        lvl3++;
        points += 12;
    }

    await update(ref(db, "users/" + parrain.phone), {
        count_lvl1: lvl1,
        count_lvl2: lvl2,
        count_lvl3: lvl3,
        points: points
    });

    await update(ref(db, "users/" + newUserPhone), {
        parrain: parrain.phone
    });
}
