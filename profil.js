import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
getDatabase, ref, onValue, remove, update, push, get
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ================= CONFIG =================
const firebaseConfig = {
    apiKey: "AIzaSyA24pBo8mBWiZssPtep--MMBdB7c8_Lu4U",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================= USER =================
const userPhone = localStorage.getItem("userPhone");

if(!userPhone){
    window.location.href = "index.html";
}

// ================= ELEMENTS =================
const phoneEl = document.getElementById("phone");
const nameEl = document.getElementById("name");
const avatarEl = document.getElementById("avatar");

const soldeEl = document.getElementById("solde");
const pointsEl = document.getElementById("points");
const inboxEl = document.getElementById("inbox");

// ================= USER DATA =================
let currentUser = {};

onValue(ref(db, "users/" + userPhone), async snap=>{
    if(!snap.exists()) return;

    const data = snap.val();
    currentUser = data;

    phoneEl.innerText = userPhone;
    nameEl.innerText = data.name || "Utilisateur";

    // ✅ PHOTO OU LETTRE
    if(data.photo){
        avatarEl.innerHTML = `<img src="${data.photo}" style="width:100%;height:100%;border-radius:50%;">`;
    } else {
        avatarEl.innerText = userPhone.substring(0,2);
    }

    soldeEl.innerText = (data.balance || 0).toLocaleString();
    pointsEl.innerText = (data.points || 0);

    // ================= 💰 MONÉTISATION =================

    if(!data.lastRevenueTime){
        await update(ref(db,"users/"+userPhone),{
            lastRevenueTime: Date.now()
        });
        return;
    }

    const now = Date.now();
    const last = data.lastRevenueTime;

    // ⏳ 30 jours
    if(now - last > 30 * 24 * 60 * 60 * 1000){

        const revenus = data.revenus || 0;

        if(revenus > 0){

            await update(ref(db,"users/"+userPhone),{
                balance: (data.balance || 0) + revenus,
                revenus: 0,
                lastRevenueTime: now
            });

            await push(ref(db,"messages/"+userPhone),{
                text: "💰 Revenus mensuels ajoutés avec succès",
                date: Date.now(),
                read:false
            });

        } else {

            await update(ref(db,"users/"+userPhone),{
                lastRevenueTime: now
            });
        }
    }
});

// ================= 💸 CALCUL REVENUS =================
onValue(ref(db,"orders/validated/" + userPhone), async snap=>{

    if(!snap.exists()) return;

    const userSnap = await get(ref(db,"users/"+userPhone));
    if(!userSnap.exists()) return;

    const userData = userSnap.val();

    // ❌ PAS MONÉTISÉ
    if(!userData.monetized){
        await update(ref(db,"users/"+userPhone),{ revenus: 0 });
        return;
    }

    let total = 0;

    Object.values(snap.val()).forEach(cmd=>{
        const price = cmd.price || 0;

        // ✅ MIN 1500 FC
        if(price >= 1500){
            total += price * 0.05;
        }
    });

    await update(ref(db,"users/"+userPhone),{
        revenus: Math.floor(total)
    });
});

// ================= 📩 INBOX ADMIN =================
onValue(ref(db, "messages/" + userPhone), snap=>{

    inboxEl.innerHTML = "";

    if(!snap.exists()){
        inboxEl.innerHTML = "<p style='text-align:center'>Aucun message</p>";
        return;
    }

    Object.entries(snap.val()).reverse().forEach(([id, msg])=>{

        inboxEl.innerHTML += `
        <div style="
            background:#111;
            padding:12px;
            border-radius:10px;
            margin-top:10px;
            border-left:3px solid ${msg.read ? "#444" : "#00d2ff"};
        ">
            <b>${msg.text || ""}</b>

            <small style="display:block;margin-top:5px;opacity:0.7;">
                ${new Date(msg.date).toLocaleString()}
            </small>

            <div style="margin-top:8px;display:flex;gap:5px;">
                <button onclick="copyMsg('${msg.text || ""}')">📋 Copier</button>
                <button onclick="deleteMsg('${id}')">🗑️ Supprimer</button>
            </div>
        </div>
        `;
    });

});

// ================= ACTIONS =================

// 📋 Copier
window.copyMsg = (text)=>{
    if(!text) return alert("Message vide");

    navigator.clipboard.writeText(text)
    .then(()=> alert("✅ Copié"))
    .catch(()=> alert(text));
};

// 🗑️ Supprimer
window.deleteMsg = async(id)=>{
    if(confirm("Supprimer ce message ?")){
        await remove(ref(db,"messages/"+userPhone+"/"+id));
    }
};

// ================= ✉️ ENVOYER AU SUPPORT =================
document.getElementById("sendBtn").onclick = async ()=>{

    const text = document.getElementById("msgInput").value.trim();

    if(!text) return alert("Message vide");

    await push(ref(db,"support_messages"),{
        name: currentUser.name || "Utilisateur",
        phone: userPhone,
        photo: currentUser.photo || "",
        text: text,
        date: Date.now()
    });

    document.getElementById("msgInput").value = "";

    alert("✅ Message envoyé à l'admin");
};

// ================= LOGOUT =================
document.getElementById("logout").onclick = ()=>{
    if(confirm("Se déconnecter ?")){
        localStorage.clear();
        window.location.href = "index.html";
    }
};
