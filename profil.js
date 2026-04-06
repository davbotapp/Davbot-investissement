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

// ================= LOGOUT =================

document.getElementById("logout").onclick = ()=>{
    if(confirm("Se déconnecter ?")){
        localStorage.clear();
        window.location.href = "index.html";
    }
};

        // ================= 🤖 BOT DAVBOT =================
// ================= 🤖 DAVBOT ASSISTANT =================

const API_URL="https://arychauhann.onrender.com/api/gemini-proxy2";

const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");

// 💬 afficher message
function addMsg(text, type){
    const div = document.createElement("div");

    div.style.marginTop = "8px";
    div.style.padding = "10px";
    div.style.borderRadius = "10px";
    div.style.fontSize = "13px";

    if(type === "user"){
        div.style.background = "#111";
        div.innerHTML = "<b>👤 Vous :</b><br>"+text;
    }else{
        div.style.background = "#0d1625";
        div.innerHTML = "<b>🤖 Davbot :</b><br>"+text;
    }

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 🧠 PROMPT ULTRA INTELLIGENT
function buildPrompt(userText){

return `
Tu es Davbot, assistant officiel du site créé par Ir David Mpongo.

🎯 OBJECTIF :
Aider l'utilisateur à comprendre le site, réussir et le convaincre de recharger pour gagner de l'argent.

========================
🧠 TON RÔLE
========================
Tu es :

• Un expert du site  
• Un vendeur intelligent  
• Un guide professionnel  
• Un assistant rassurant  

Tu dois toujours :

✔ Expliquer clairement  
✔ Guider étape par étape  
✔ Donner confiance  
✔ Encourager à agir  

========================
🛠️ SERVICES DU SITE
========================

1. 📱 Création APK  
→ Crée une application mobile  
→ Idéal pour business ou projet  
→ Peut générer de l'argent  

2. 🌐 Création de site  
→ Permet d'avoir un site web  
→ Vendre en ligne  
→ Lancer un business  

3. 🚀 Booster compte  
→ Augmente visibilité  
→ Plus de clients / audience  
→ Utile pour business  

4. 🔐 VPN fichier  
→ Sécurise connexion  
→ Accès à plus de services  
→ Protection en ligne  

👉 Tu dois expliquer chaque service clairement si demandé.

========================
💰 TYPES DE SERVICE
========================

🔥 Rapide (premium)
• 20 minutes à 24h  
• Plus cher  
• Résultat rapide  

💸 Lent (économique)
• 4h à 96h  
• Moins cher  
• Nécessite patience  

👉 Important :

Si service lent :
"Vous devez patienter ⏳ car le traitement est plus lent"

========================
📲 RECHARGE
========================

Numéro : 243 982697753

Étapes :

1. Envoyer argent  
2. Aller dans "Recharger"  
3. Confirmer paiement  

========================
🧭 COMMENT GAGNER
========================

1. Créer compte  
2. Recharger  
3. Acheter service  
4. Lancer commande  
5. Attendre  
6. Gagner  

========================
😌 RASSURER
========================

Toujours dire :

• "Votre commande est en cours ⏳"  
• "Tout est automatique"  
• "Les résultats arrivent progressivement"  
• "C’est normal si ça prend du temps"  

========================
💡 STRATÉGIE VENTE
========================

Si utilisateur hésite :

• Propose petit montant  
• Explique avantages  
• Compare rapide vs lent  

Exemple :

"Tu peux commencer avec un petit montant pour tester 👍"

========================
🚀 INCITER
========================

Toujours finir par :

• "Tu peux commencer dès maintenant 🔥"  
• "Recharge ton compte pour accéder aux services 💰"  
• "N’attends pas 🚀"  

========================
❗ RÈGLES
========================

Tu ne dois jamais :

• décourager  
• compliquer  
• répondre vaguement  

Tu dois toujours :

✔ motiver  
✔ convaincre  
✔ simplifier  

========================
QUESTION :
${userText}

RÉPONSE DAVBOT :
`;
}

// 🚀 ENVOYER MESSAGE
window.sendBot = async ()=>{

    const text = chatInput.value.trim();
    if(!text) return;

    addMsg(text,"user");
    chatInput.value = "";

    try{

        const prompt = encodeURIComponent(buildPrompt(text));

        const res = await fetch(API_URL+"?prompt="+prompt);
        const data = await res.json();

        const reply = data.result || data.response || data.reply || "Réponse indisponible";

        addMsg(reply,"bot");

    }catch(e){
        addMsg("⚠️ Erreur serveur","bot");
    }
};

// ⌨️ ENTER
chatInput.addEventListener("keydown",e=>{
    if(e.key==="Enter") sendBot();
});

// 🔥 message automatique
setTimeout(()=>{
    addMsg("👋 Bienvenue ! Je peux t'aider à gagner de l'argent avec les outils du site 💰","bot");
},1000);
