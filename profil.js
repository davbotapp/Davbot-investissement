import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

if(!userPhone){
    window.location.href = "index.html";
}

// ELEMENTS
const phoneEl = document.getElementById("phone");
const codeEl = document.getElementById("code");
const avatarEl = document.getElementById("avatar");
const soldeEl = document.getElementById("solde");
const pointsEl = document.getElementById("points");
const inboxEl = document.getElementById("inbox");

// =====================
// USER DATA
// =====================
onValue(ref(db, "users/" + userPhone), snap=>{
    if(!snap.exists()) return;

    const data = snap.val();

    phoneEl.innerText = userPhone;
    codeEl.innerText = "ID: " + (data.inviteCode || "DAV-000");

    avatarEl.innerText = userPhone.substring(0,2);

    soldeEl.innerText = (data.balance || 0).toLocaleString();
    pointsEl.innerText = (data.points || 0);
});

// =====================
// 📩 INBOX ADMIN
// =====================
onValue(ref(db, "messages/" + userPhone), snap=>{

    inboxEl.innerHTML = "";

    if(!snap.exists()){
        inboxEl.innerHTML = "<p>Aucun message</p>";
        return;
    }

    const data = snap.val();

    Object.values(data).reverse().forEach(msg=>{

        let html = "";

        if(msg.text){
            html += `<p>📝 ${msg.text}</p>`;
        }

        if(msg.image){
            html += `<img src="${msg.image}" style="width:100%;border-radius:10px;">`;
        }

        if(msg.file){
            html += `<a href="${msg.file}" target="_blank">📎 Télécharger fichier</a>`;
        }

        if(msg.commande){
            html += `
                <div>
                    📦 ${msg.commande.service}<br>
                    💰 ${msg.commande.price} FC
                </div>
            `;
        }

        inboxEl.innerHTML += `
            <div class="message">
                ${html}
                <small>${new Date(msg.date).toLocaleString()}</small>
            </div>
        `;
    });

});

// =====================
// LOGOUT
// =====================
document.getElementById("logout").onclick = ()=>{
    if(confirm("Se déconnecter ?")){
        localStorage.clear();
        window.location.href = "index.html";
    }
};
