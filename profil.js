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

}); // ✅ 🔥 TRÈS IMPORTANT (FERMETURE)

// ================= 💰 DEMANDE MONÉTISATION ==============
// ================= BADGE MONÉTISATION =================
function updateBadge(data){

    if(!badgeBox) return; // sécurité

    // 🔥 reset toujours
    badgeBox.innerHTML = "";

    if(data.monetized === true){

        badgeBox.innerHTML = `
        <div style="
            background:#00d2ff;
            color:#000;
            padding:6px 12px;
            border-radius:20px;
            font-size:12px;
            font-weight:bold;
            display:inline-block;
        ">
        💰 Compte monétisé
        </div>
        `;
    }
}
// ================= MONÉTISATION AUTO =================

onValue(ref(db,"users/"+userPhone), snap=>{

    if(!snap.exists()) return;

    const data = snap.val();

    // 🔥 appel badge
    updateBadge(data);

});

// 🔒 créer date si pas existante
if(!data.createdAt){
    await update(ref(db,"users/"+userPhone),{
        createdAt: Date.now()
    });
    return;
}

const now = Date.now();
const created = data.createdAt;

// ================= 📦 COMPTER COMMANDES =================
let totalCmd = 0;

const cmdSnap = await get(ref(db,"orders/validated/"+userPhone));

if(cmdSnap.exists()){
    totalCmd = Object.keys(cmdSnap.val()).length;
}

// ================= CONDITIONS =================

// ⏳ 28 jours
if(now - created < 28 * 24 * 60 * 60 * 1000){
    monetBtn.innerText = "🔒 Disponible après 28 jours";
    monetBtn.disabled = true;
    return;
}

// 📦 minimum 4 commandes
if(totalCmd < 4){
    monetBtn.innerText = `🔒 ${totalCmd}/4 commandes requises`;
    monetBtn.disabled = true;
    return;
}

// ✅ déjà actif
if(data.monetized){
    monetBtn.innerText = "✅ Monétisation active";
    monetBtn.disabled = true;
    return;
}

// 🔓 prêt
monetBtn.innerText = "💰 Activer monétisation (1500 FC)";
monetBtn.disabled = false;

});

// ================= ACTIVER MONÉTISATION =================
monetBtn.onclick = async ()=>{

const userRef = ref(db,"users/"+userPhone);
const snap = await get(userRef);

if(!snap.exists()) return;

const data = snap.val();
const balance = data.balance || 0;

// 💰 vérifier solde
if(balance < 1500){
    return alert("❌ Solde insuffisant (1500 FC requis)");
}

// 🔥 activer DIRECT (pas admin)
await update(userRef,{
    balance: balance - 1500,
    monetized: true,
    revenus: 0,
    lastRevenueTime: Date.now()
});

// 📩 message
await push(ref(db,"messages/"+userPhone),{
    text: "🎉 Monétisation activée ! Vous gagnez maintenant 4.3% sur chaque commande.",
    date: Date.now(),
    read:false
});

alert("✅ Monétisation activée");

};

// ================= CALCUL REVENUS =================
onValue(ref(db,"orders/validated/"+userPhone), async snap=>{

if(!snap.exists()) return;

const userSnap = await get(ref(db,"users/"+userPhone));
if(!userSnap.exists()) return;

const userData = userSnap.val();

// ❌ si pas monétisé
if(!userData.monetized){
    await update(ref(db,"users/"+userPhone),{ revenus: 0 });
    return;
}

let total = 0;

Object.values(snap.val()).forEach(cmd=>{
    const price = cmd.price || 0;

    // 💰 4.3%
    total += price * 0.043;
});

await update(ref(db,"users/"+userPhone),{
    revenus: Math.floor(total)
});

});

// ================= PAIEMENT MENSUEL =================
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

// ⏳ 30 jours
if(now - last > 30 * 24 * 60 * 60 * 1000){

    const revenus = data.revenus || 0;

    if(revenus > 0){

        await update(ref(db,"users/"+userPhone),{
            balance: (data.balance || 0) + revenus,
            revenus: 0,
            lastRevenueTime: now
        });

        // 📩 message
        await push(ref(db,"messages/"+userPhone),{
            text: "💰 Revenus mensuels ajoutés à votre solde. Continuez à générer des commandes 🚀",
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
// ================= 📩 INBOX PRO =================

const notifCount = document.getElementById("notifCount"); // 🔔 compteur
const notifBox = document.getElementById("notifBox"); // popup cloche (si existe)

onValue(ref(db, "messages/" + userPhone), snap => {

    // reset
    inboxEl.innerHTML = "";
    let unread = 0;

    // ❌ aucun message
    if (!snap.exists()) {
        inboxEl.innerHTML = "<p style='text-align:center'>Aucun message</p>";
        if (notifCount) notifCount.innerText = "0";
        return;
    }

    const messages = Object.entries(snap.val()).reverse();

    // 🔥 build HTML
    let html = "";

    messages.forEach(([id, msg]) => {

        const type = msg.from || "system";

        // 🎨 couleurs
        let color = "#111";
        if (type === "admin") color = "#003b4d";
        if (type === "system") color = "#1a1a1a";

        // 🔔 unread count
        if (!msg.read) unread++;

        html += `
        <div style="
            background:${color};
            padding:12px;
            border-radius:10px;
            margin-top:10px;
            border-left:3px solid ${msg.read ? "#444" : "#00d2ff"};
        ">

        <b>
        ${type === "admin" ? "🛡️ ADMIN" : type === "user" ? "👤 VOUS" : "⚙️ SYSTEM"}
        </b><br>

        ${msg.text ? `<b>${msg.text}</b>` : ""}

        ${msg.image ? `
        <img src="${msg.image}" style="width:100%;margin-top:5px;border-radius:8px;">
        ` : ""}

        <small style="display:block;margin-top:5px;opacity:0.7;">
        ${msg.date ? new Date(msg.date).toLocaleString() : ""}
        </small>

        <div style="margin-top:8px;display:flex;gap:5px;">
            <button onclick="copyMsg(\`${msg.text || ""}\`)">📋</button>
            <button onclick="deleteMsg('${id}')">🗑️</button>
            <button onclick="markRead('${id}')">✔</button>
        </div>

        </div>
        `;
    });

    inboxEl.innerHTML = html;

    // 🔔 UPDATE COUNTER
    if (notifCount) {
        notifCount.innerText = unread > 0 ? unread : "";
    }

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
function toggleNotif(){

    const box = document.getElementById("inbox");

    if(!box) return;

    box.scrollIntoView({ behavior: "smooth" });

}
// ================= ✉️ ENVOYER MESSAGE (USER → ADMIN) =================
document.getElementById("sendBtn").onclick = async ()=>{

const text = document.getElementById("msgInput").value.trim();

if(!text) return alert("Message vide");

try{

await push(ref(db,"messages/"+userPhone),{
text,
from:"user", // 🔥 IMPORTANT
name: currentUser.name || "Utilisateur",
phone: userPhone,
photo: currentUser.photo || "",
date: Date.now(),
read:false
});

document.getElementById("msgInput").value="";

alert("✅ Message envoyé");

}catch(e){
console.error(e);
alert("❌ Erreur");
}

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
Tu es Davbot, assistant officiel du site Davbot investissement créé par Ir David Mpongo.

🎯 OBJECTIF :
Répondre précisément à la question de l'utilisateur, l'aider à comprendre le site et l'accompagner vers la réussite.

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
🧠 COMPORTEMENT
========================

Tu dois :

✔ Répondre uniquement à la question posée  
✔ Être clair et précis  
✔ Donner des explications utiles  
✔ Ne pas parler inutilement  

❗ IMPORTANT :
Tu ne dois PAS donner des informations hors sujet.

========================
⚠️ INFORMATIONS IMPORTANTES (À UTILISER SI NÉCESSAIRE)
========================

• L'heure de début peut varier :
Même si un service est "instantané", il peut y avoir du retard si le serveur est occupé.

• Les services bon marché sont lents :
Ils ne peuvent pas être accélérés ni annulés.
Ils sont toujours plus lents.

• Conseil :
Utiliser service lent = nécessite patience ⏳  
Utiliser service rapide = résultats rapides 🚀  

• Sois patient :
Certains services démarrent immédiatement,
d'autres peuvent prendre des heures ou des jours.

👉 Tu dois utiliser ces informations uniquement si la question concerne :
(délai, lenteur, problème, commande)

========================
🛠️ SERVICES
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

5. 🧑‍🏫 Apprendre 
→ approfondir vos connaissances 


🤡 mini jeux 
→ créé de jeux pour divertissement 

👉 Tu dois expliquer chaque service clairement si demandé.

========================
💰 TYPES DE SERVICES
========================

🔥 Rapide :
20 min à 24h (plus cher)

💸 Lent :
4h à 120h (moins cher, nécessite patience)

👉 Important :

Si service lent il faut demander pour confirmer quel service il utiliser lent ou rapide, moins cher ou meilleures prix ensuite répond :
"Vous devez patienter ⏳ car le traitement est plus lent"

========================
📲 RECHARGE
========================

Numéro : 243 982697752

Étapes :

1. Envoyer argent  
2. Aller dans "Recharger"  
3. Confirmer  

========================
🧭 GUIDE
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
========================
💰 COMMENT GAGNER ARGENT
========================

• Acheter services à bas prix  
• Revendre plus cher  
• Gagner la différence 💸  

• Proposer services à des clients  
• Gérer leurs comptes  
• Gagner sur chaque commande  

• Être actif régulièrement  
• Plus tu travailles, plus tu gagnes 📈  

========================
👥 PARRAINAGE
========================

Étapes :

1. Aller dans Profil  
2. Cliquer sur Équipe  
3. Copier ton lien de parrainage  

Exemple de lien :

https://davbot-investissement.vercel.app/?ref=David123  

👉 Dans cet exemple :
Le code parrain = David123  

4. Partager ton lien  

Important :

Chaque personne doit :  
• S'inscrire avec ton lien  
• Utiliser ton code parrain  

🎯 Résultat :

Tu gagnes de l'argent sur leurs activités 💸  

💡 Plus tu invites de personnes actives, plus tes gains augmentent 🚀  
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
🚀 FIN DE RÉPONSE
========================

Tu peux proposer une action seulement si c'est logique.

Exemple :

• "Tu peux essayer avec un petit montant 👍"
• "Recharge ton compte pour commencer 💰"


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
