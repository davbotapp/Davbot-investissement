import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, get, update, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyA24pBo8mBWiZssPtep--MMBdB7c8_Lu4U",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// USER
const userPhone = localStorage.getItem("userPhone");
if(!userPhone) window.location.href = "index.html";

// ELEMENTS
const codeEl = document.getElementById("code");
const lvl1El = document.getElementById("lvl1");
const lvl2El = document.getElementById("lvl2");
const lvl3El = document.getElementById("lvl3");
const totalEl = document.getElementById("total");
const gainsEl = document.getElementById("gains");
const pointsEl = document.getElementById("points");
const tokensList = document.getElementById("tokensList");

// 🔄 USER DATA
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
    pointsEl.innerText = (data.points || 0);
});

// 🔄 JETONS
onValue(ref(db, "tokens/" + userPhone), snap=>{
    tokensList.innerHTML = "";

    if(!snap.exists()){
        tokensList.innerHTML = "Aucun jeton actif";
        return;
    }

    const data = snap.val();

    Object.values(data).forEach(token=>{
        const reste = token.expire - Date.now();

        if(reste <= 0) return;

        const jours = Math.floor(reste / (1000*60*60*24));

        tokensList.innerHTML += `
            <div class="box">
                🎟️ ${token.type}<br>
                ⏳ ${jours} jour(s)
            </div>
        `;
    });
});

// 🔗 LIEN
function getLink(code){
    return location.origin + "/index.html?inviteCode=" + code;
}

// 📋 COPY
document.getElementById("copyBtn").onclick = ()=>{
    const link = getLink(codeEl.innerText);

    navigator.clipboard.writeText(link)
    .then(()=> alert("Lien copié"))
    .catch(()=> alert(link));
};

// 📤 WHATSAPP
document.getElementById("whatsappBtn").onclick = ()=>{
    const link = getLink(codeEl.innerText);
    const msg = "Rejoins-moi sur DAVBOT 🚀\n" + link;

    window.open("https://wa.me/?text=" + encodeURIComponent(msg));
};

// 💼 ACHAT JETON
window.buyToken = async function(type, price, days){

    try{
        const snap = await get(ref(db, "users/" + userPhone));
        if(!snap.exists()) return;

        const data = snap.val();
        const balance = data.balance || 0;

        if(balance < price){
            alert("❌ Solde insuffisant");
            return;
        }

        // 💸 Déduction
        await update(ref(db, "users/" + userPhone), {
            balance: balance - price
        });

        // 🎟️ Création
        const expire = Date.now() + (days * 24 * 60 * 60 * 1000);

        await push(ref(db, "tokens/" + userPhone), {
            type,
            price,
            start: Date.now(),
            expire,
            actif: true
        });

        alert("✅ Jeton activé");

    }catch(e){
        alert("Erreur");
        console.error(e);
    }
};
