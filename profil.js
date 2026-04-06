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

// 🔥 NOUVEAUX
const monetBtn = document.getElementById("monetBtn");
const monetInfo = document.getElementById("monetInfo");
const badgeBox = document.getElementById("badgeBox");

// ================= USER =================
let currentUser = {};

// ================= USER DATA =================
onValue(ref(db, "users/" + userPhone), async snap=>{

    if(!snap.exists()) return;

    const data = snap.val();
    currentUser = data;

    phoneEl.innerText = userPhone;
    nameEl.innerText = data.name || "Utilisateur";

    const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    avatarEl.src = data.photo && data.photo.trim()
        ? data.photo
        : defaultAvatar;

    soldeEl.innerText = (data.balance || 0).toLocaleString();
    pointsEl.innerText = data.points || 0;

    // ================= BADGE =================
    if(data.monetized === true){
        badgeBox.innerHTML = `<div class="badge">💰 Compte monétisé</div>`;
    }

    // ================= MONÉTISATION =================

    // 🔒 si pas encore activé
    if(!data.createdAt){
        await update(ref(db,"users/"+userPhone),{
            createdAt: Date.now()
        });
    }

    const now = Date.now();
    const created = data.createdAt || now;

    // ⏳ 30 jours
    if(now - created < 30 * 24 * 60 * 60 * 1000){
        monetBtn.innerText = "🔒 Disponible après 30 jours";
        monetBtn.className = "locked";
        monetBtn.disabled = true;
        return;
    }

    // ⏳ déjà demandé
    if(data.monetRequest === true){
        monetBtn.innerText = "⏳ En attente admin";
        monetBtn.className = "wait";
        monetBtn.disabled = true;
        return;
    }

    // ✅ déjà activé
    if(data.monetized === true){
        monetBtn.innerText = "✅ Monétisation active";
        monetBtn.className = "active";
        monetBtn.disabled = true;
        return;
    }

    // 🔓 prêt
    monetBtn.innerText = "💰 Activer la monétisation (2500 FC)";
    monetBtn.className = "active";
    monetBtn.disabled = false;

});

// ================= 💰 DEMANDE MONÉTISATION =================
monetBtn.onclick = async ()=>{

    const userRef = ref(db,"users/"+userPhone);
    const snap = await get(userRef);

    if(!snap.exists()) return;

    const data = snap.val();
    const balance = data.balance || 0;

    if(balance < 2500){
        return alert("❌ Solde insuffisant (2500 FC requis)");
    }

    // 🔻 retirer argent
    await update(userRef,{
        balance: balance - 2500,
        monetRequest: true
    });

    // 📤 envoyer à admin
    await push(ref(db,"monetisation_requests"),{
        user: userPhone,
        name: data.name || "Utilisateur",
        photo: data.photo || "",
        date: Date.now()
    });

    // 📩 message user
    await push(ref(db,"messages/"+userPhone),{
        text: "🔂 Demande de monétisation envoyée. En attente de validation admin.",
        date: Date.now()
    });

    alert("✅ Demande envoyée");
};

// ================= 💸 CALCUL REVENUS =================
onValue(ref(db,"orders/validated/" + userPhone), async snap=>{

    if(!snap.exists()) return;

    const userSnap = await get(ref(db,"users/"+userPhone));
    if(!userSnap.exists()) return;

    const userData = userSnap.val();

    if(!userData.monetized){
        await update(ref(db,"users/"+userPhone),{ revenus: 0 });
        return;
    }

    let total = 0;

    Object.values(snap.val()).forEach(cmd=>{
        const price = cmd.price || 0;

        // 🔥 3% à partir de 2000 FC
        if(price >= 2000){
            total += price * 0.03;
        }
    });

    await update(ref(db,"users/"+userPhone),{
        revenus: Math.floor(total)
    });

});

// ================= 💰 PAIEMENT MENSUEL =================
onValue(ref(db,"users/"+userPhone), async snap=>{

    if(!snap.exists()) return;

    const data = snap.val();

    if(!data.lastRevenueTime){
        await update(ref(db,"users/"+userPhone),{
            lastRevenueTime: Date.now()
        });
        return;
    }

    const now = Date.now();
    const last = data.lastRevenueTime;

    if(now - last > 30 * 24 * 60 * 60 * 1000){

        const revenus = data.revenus || 0;

        if(revenus > 0){

            await update(ref(db,"users/"+userPhone),{
                balance: (data.balance || 0) + revenus,
                revenus: 0,
                lastRevenueTime: now
            });

            // 📩 MESSAGE PRO
            await push(ref(db,"messages/"+userPhone),{
                text: "🎉 Félicitations ! Votre solde a augmenté grâce à vos revenus mensuels. Continuez à générer des commandes pour gagner encore plus 🚀",
                date: Date.now(),
                read:false
            });

        }else{
            await update(ref(db,"users/"+userPhone),{
                lastRevenueTime: now
            });
        }
    }

});

// ================= 📩 INBOX =================
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

            ${msg.text ? `<b>${msg.text}</b>` : ""}

            ${msg.image ? `<img src="${msg.image}" style="width:100%;margin-top:5px;border-radius:8px;">` : ""}

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
    if(!text) return alert("Vide");

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
        text,
        date: Date.now()
    });

    document.getElementById("msgInput").value = "";

    alert("✅ Message envoyé à l'admin");
};
// ================= 🤖 DAVBOT AI =================
const API_URL = "https://arychauhann.onrender.com/api/gemini-proxy2";

const botBox = document.getElementById("botBox");
const botInput = document.getElementById("botInput");

// 📤 envoyer message
document.getElementById("botSend").onclick = async ()=>{

    const question = botInput.value.trim();
    if(!question) return;

    addMsg("👤", question);
    botInput.value = "";

    try{

        const res = await fetch(API_URL,{
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({
                message: `
Tu es Davbot Assistant.

Tu réponds uniquement sur la plateforme Davbot.

Infos importantes:
- Créé par Ir David Mpongo
- Recharge: 243982697753

Fonction:
- Expliquer comment gagner de l'argent
- Expliquer parrainage
- Expliquer outils (APK, site, VPN, boost)
- Expliquer monétisation

Interdit:
- Ne parle pas d'autres sujets
- Ne donne pas d'infos hors plateforme

Question:
${question}
                `
            })
        });

        const data = await res.json();

        const reply = data.reply || "⚠️ Erreur réponse";

        addMsg("🤖", reply);

    }catch(e){
        addMsg("🤖", "❌ Erreur connexion");
    }
};

// 📥 afficher message
function addMsg(sender, text){
    botBox.innerHTML += `
        <div style="
        background:#111;
        padding:10px;
        border-radius:10px;
        margin-top:8px;">
        <b>${sender}</b><br>${text}
        </div>
    `;

    botBox.scrollTop = botBox.scrollHeight;
        }

// ================= LOGOUT =================

document.getElementById("logout").onclick = ()=>{
    if(confirm("Se déconnecter ?")){
        localStorage.clear();
        window.location.href = "index.html";
    }
};
