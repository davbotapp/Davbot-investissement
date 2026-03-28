import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getDatabase, ref, onValue, update, remove, get
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyA24pBo8mBWiZssPtep--MMBdB7c8_Lu4U",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit",
    storageBucket: "starlink-investit.appspot.com",
    messagingSenderId: "807081599583",
    appId: "1:807081599583:web:e00ec3959bc4acdae031ea"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const container = document.getElementById("adminData");


// =========================
// 🔄 RECHARGES
// =========================
onValue(ref(db, "demandes_recharges"), snap => {
    snap.forEach(child => {
        const d = child.val();
        const id = child.key;

        const div = document.createElement("div");
        div.innerHTML = `
            <p>📥 ${d.telephone} - ${d.montant} FC</p>
            <button onclick="validerRecharge('${id}','${d.telephone}',${d.montant})">✅ Valider</button>
            <button onclick="supprimer('${id}','demandes_recharges')">❌ Supprimer</button>
            <hr>
        `;
        container.appendChild(div);
    });
});

window.validerRecharge = async (id, phone, montant) => {
    const userRef = ref(db, "users/" + phone);

    const snap = await get(userRef);
    if(!snap.exists()) return;

    const data = snap.val();
    const newBalance = (data.balance || 0) + montant;

    await update(userRef, { balance: newBalance });

    await remove(ref(db, "demandes_recharges/" + id));

    alert("✅ Recharge validée");
};


// =========================
// 💸 RETRAITS
// =========================
onValue(ref(db, "demandes_retraits"), snap => {
    snap.forEach(child => {
        const d = child.val();
        const id = child.key;

        const div = document.createElement("div");
        div.innerHTML = `
            <p>📤 ${d.telephone} - ${d.montant} FC</p>
            <button onclick="validerRetrait('${id}','${d.telephone}',${d.montant})">✅ Valider</button>
            <button onclick="refuserRetrait('${id}')">❌ Refuser</button>
            <hr>
        `;
        container.appendChild(div);
    });
});

window.validerRetrait = async (id, phone, montant) => {

    const frais = Math.floor(montant * 0.1); // 10%
    const total = montant + frais;

    const userRef = ref(db, "users/" + phone);
    const snap = await get(userRef);

    if(!snap.exists()) return;

    const data = snap.val();
    let balance = data.balance || 0;

    if(balance < total){
        alert("Solde insuffisant");
        return;
    }

    balance -= total;

    await update(userRef, { balance });

    await remove(ref(db, "demandes_retraits/" + id));

    alert("✅ Retrait validé (- frais)");
};

window.refuserRetrait = async (id) => {
    await remove(ref(db, "demandes_retraits/" + id));
    alert("❌ Retrait refusé");
};


// =========================
// 🛒 COMMANDES
// =========================
onValue(ref(db, "commandes"), snap => {
    snap.forEach(child => {
        const d = child.val();
        const id = child.key;

        const div = document.createElement("div");
        div.innerHTML = `
            <p>🛒 ${d.telephone} - ${d.service} (${d.prix} FC)</p>
            <button onclick="validerCommande('${id}')">✅ Valider</button>
            <button onclick="refuserCommande('${id}','${d.telephone}',${d.prix})">❌ Refuser</button>
            <hr>
        `;
        container.appendChild(div);
    });
});

window.validerCommande = async (id) => {
    await update(ref(db, "commandes/" + id), { statut: "Validé" });
    alert("Commande validée");
};

window.refuserCommande = async (id, phone, prix) => {

    const userRef = ref(db, "users/" + phone);
    const snap = await get(userRef);

    if(snap.exists()){
        const data = snap.val();
        const balance = (data.balance || 0) + prix;

        await update(userRef, { balance });
    }

    await remove(ref(db, "commandes/" + id));

    alert("Commande annulée + remboursée");
};


// =========================
// 🔁 TRANSFERT UTILISATEUR
// =========================
onValue(ref(db, "transferts"), snap => {
    snap.forEach(child => {
        const d = child.val();
        const id = child.key;

        const div = document.createElement("div");
        div.innerHTML = `
            <p>🔁 ${d.from} ➜ ${d.to} (${d.amount} FC)</p>
            <button onclick="validerTransfert('${id}')">✅ Valider</button>
            <button onclick="refuserTransfert('${id}')">❌ Refuser</button>
            <hr>
        `;
        container.appendChild(div);
    });
});

window.validerTransfert = async (id) => {

    const snap = await get(ref(db, "transferts/" + id));
    if(!snap.exists()) return;

    const d = snap.val();

    const fromRef = ref(db, "users/" + d.from);
    const toRef = ref(db, "users/" + d.to);

    const fromSnap = await get(fromRef);
    const toSnap = await get(toRef);

    if(!fromSnap.exists() || !toSnap.exists()) return;

    const fromData = fromSnap.val();
    const toData = toSnap.val();

    if((fromData.balance || 0) < d.amount){
        alert("Solde insuffisant");
        return;
    }

    await update(fromRef, {
        balance: (fromData.balance || 0) - d.amount
    });

    await update(toRef, {
        balance: (toData.balance || 0) + d.amount
    });

    await update(ref(db, "transferts/" + id), { statut: "Validé" });

    alert("✅ Transfert validé");
};

window.refuserTransfert = async (id) => {
    await remove(ref(db, "transferts/" + id));
    alert("❌ Transfert refusé");
};


// =========================
// 🧹 SUPPRESSION SIMPLE
// =========================
window.supprimer = async (id, path) => {
    await remove(ref(db, path + "/" + id));
};
