import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
getDatabase, ref, onValue, get, update, remove, push
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey:"AIza...",
    databaseURL:"https://starlink-investit-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🔐 ADMIN
const ADMIN = "0982697752";
const me = localStorage.getItem("userPhone");

if(me !== ADMIN){
    alert("Accès refusé");
    location.href="index.html";
}

// =======================
// 👤 USERS
// =======================
onValue(ref(db,"users"), snap=>{
    const box = document.getElementById("users");
    box.innerHTML="";

    const data = snap.val();

    Object.keys(data).forEach(phone=>{
        const u = data[phone];

        box.innerHTML += `
        <div class="user">
        📱 ${phone}<br>
        💰 ${u.balance || 0} FC<br>

        <button class="green" onclick="addMoney('${phone}')">+1000</button>
        <button class="red" onclick="removeMoney('${phone}')">-1000</button>
        <button class="red" onclick="delUser('${phone}')">Supprimer</button>
        </div>
        `;
    });
});

window.addMoney = async (phone)=>{
    const snap = await get(ref(db,"users/"+phone));
    const bal = snap.val().balance || 0;

    await update(ref(db,"users/"+phone),{
        balance: bal + 1000
    });
};

window.removeMoney = async (phone)=>{
    const snap = await get(ref(db,"users/"+phone));
    const bal = snap.val().balance || 0;

    await update(ref(db,"users/"+phone),{
        balance: Math.max(0, bal - 1000)
    });
};

window.delUser = async (phone)=>{
    if(confirm("Supprimer ?")){
        await remove(ref(db,"users/"+phone));
    }
};

// =======================
// 🔄 TRANSFERT
// =======================
window.transfer = async ()=>{

    const from = document.getElementById("from").value;
    const to = document.getElementById("to").value;
    const amount = parseInt(document.getElementById("amount").value);

    const s1 = await get(ref(db,"users/"+from));
    const s2 = await get(ref(db,"users/"+to));

    if(!s1.exists() || !s2.exists()) return alert("Erreur");

    const b1 = s1.val().balance || 0;
    const b2 = s2.val().balance || 0;

    if(b1 < amount) return alert("Solde insuffisant");

    await update(ref(db,"users/"+from),{ balance: b1 - amount });
    await update(ref(db,"users/"+to),{ balance: b2 + amount });

    alert("Transfert OK");
};

// =======================
// 💸 RETRAITS
// =======================
onValue(ref(db,"demandes_retraits"), snap=>{
    const box = document.getElementById("retraits");
    box.innerHTML="";

    const data = snap.val();

    if(!data) return;

    Object.entries(data).forEach(([id,d])=>{
        box.innerHTML += `
        <div class="user">
        ${d.telephone} - ${d.montant}

        <button onclick="validerRetrait('${id}')">✔</button>
        <button class="red" onclick="refuserRetrait('${id}')">✖</button>
        </div>
        `;
    });
});

window.validerRetrait = async (id)=>{
    await update(ref(db,"demandes_retraits/"+id),{statut:"validé"});
};

window.refuserRetrait = async (id)=>{
    await remove(ref(db,"demandes_retraits/"+id));
};

// =======================
// 💰 RECHARGES
// =======================
onValue(ref(db,"demandes_recharges"), snap=>{
    const box = document.getElementById("recharges");
    box.innerHTML="";

    const data = snap.val();

    if(!data) return;

    Object.entries(data).forEach(([id,d])=>{
        box.innerHTML += `
        <div class="user">
        ${d.user} - ${d.amount}

        <button onclick="validerRecharge('${id}','${d.user}',${d.amount})">✔</button>
        </div>
        `;
    });
});

window.validerRecharge = async (id,user,amount)=>{

    const snap = await get(ref(db,"users/"+user));
    const bal = snap.val().balance || 0;

    await update(ref(db,"users/"+user),{
        balance: bal + amount
    });

    await update(ref(db,"demandes_recharges/"+id),{
        status:"validé"
    });
};

// =======================
// 📦 COMMANDES
// =======================
onValue(ref(db,"orders"), snap=>{
    const box = document.getElementById("orders");
    box.innerHTML="";

    const data = snap.val();
    if(!data) return;

    Object.entries(data).forEach(([id,d])=>{
        box.innerHTML += `
        <div class="user">
        ${d.user} - ${d.service}

        <button onclick="validerCmd('${id}')">✔</button>
        <button class="red" onclick="delCmd('${id}')">✖</button>
        </div>
        `;
    });
});

window.validerCmd = async (id)=>{
    await update(ref(db,"orders/"+id),{statut:"validé"});
};

window.delCmd = async (id)=>{
    await remove(ref(db,"orders/"+id));
};

// =======================
// 📩 MESSAGE
// =======================
window.sendMsg = async ()=>{

    const tel = document.getElementById("target").value;
    const msg = document.getElementById("msg").value;
    const img = document.getElementById("img").value;
    const file = document.getElementById("file").value;

    await push(ref(db,"messages_admin/"+tel),{
        text: msg,
        image: img || "",
        file: file || "",
        date: Date.now()
    });

    alert("Envoyé");
};
