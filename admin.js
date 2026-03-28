import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getDatabase, ref, onValue, get,
    update, remove
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

// ==========================
// 💰 RECHARGES
// ==========================
onValue(ref(db,"demandes_recharges"), snap=>{
    const box = document.getElementById("recharges");
    box.innerHTML = "";

    snap.forEach(child=>{
        const d = child.val();
        const id = child.key;

        box.innerHTML += `
        <div class="card">
            📱 ${d.telephone || "?"}<br>
            💰 ${d.montant || 0} FC<br>
            🆔 ${d.transactionID || "-"}
            <br>
            <button class="ok" onclick="validerRecharge('${id}','${d.telephone}',${d.montant})">Valider</button>
            <button class="no" onclick="supprimer('demandes_recharges','${id}')">Supprimer</button>
        </div>`;
    });
});

window.validerRecharge = async(id, phone, montant)=>{
    const userRef = ref(db,"users/"+phone);
    const snap = await get(userRef);

    if(!snap.exists()) return alert("Utilisateur introuvable");

    const data = snap.val();
    const balance = (data.balance || 0) + montant;

    await update(userRef,{ balance });
    await remove(ref(db,"demandes_recharges/"+id));

    alert("Recharge validée");
};

// ==========================
// 💸 RETRAITS
// ==========================
onValue(ref(db,"demandes_retraits"), snap=>{
    const box = document.getElementById("withdraws");
    box.innerHTML = "";

    snap.forEach(child=>{
        const d = child.val();
        const id = child.key;

        box.innerHTML += `
        <div class="card">
            📱 ${d.telephone}<br>
            💸 ${d.montant} FC<br>
            📲 ${d.numero}
            <br>
            <button class="ok" onclick="validerRetrait('${id}','${d.telephone}',${d.montant})">Valider</button>
            <button class="no" onclick="refuserRetrait('${id}')">Refuser</button>
        </div>`;
    });
});

window.validerRetrait = async(id, phone, montant)=>{
    const userRef = ref(db,"users/"+phone);
    const snap = await get(userRef);

    if(!snap.exists()) return;

    const data = snap.val();
    let balance = data.balance || 0;

    const frais = Math.floor(montant * 0.1); // 10%
    const total = montant + frais;

    if(balance < total) return alert("Solde insuffisant");

    balance -= total;

    await update(userRef,{ balance });
    await remove(ref(db,"demandes_retraits/"+id));

    alert("Retrait validé (frais inclus)");
};

window.refuserRetrait = async(id)=>{
    await remove(ref(db,"demandes_retraits/"+id));
    alert("Retrait refusé");
};

// ==========================
// 📦 COMMANDES
// ==========================
onValue(ref(db,"commandes"), snap=>{
    const box = document.getElementById("orders");
    box.innerHTML = "";

    snap.forEach(child=>{
        const d = child.val();
        const id = child.key;

        box.innerHTML += `
        <div class="card">
            📱 ${d.telephone}<br>
            🛒 ${d.service}<br>
            💰 ${d.prix} FC
            <br>
            <button class="ok" onclick="validerCommande('${id}')">Valider</button>
            <button class="no" onclick="refuserCommande('${id}','${d.telephone}',${d.prix})">Annuler</button>
        </div>`;
    });
});

window.validerCommande = async(id)=>{
    await update(ref(db,"commandes/"+id),{ statut:"Validé" });
    alert("Commande validée");
};

window.refuserCommande = async(id, phone, prix)=>{
    const userRef = ref(db,"users/"+phone);
    const snap = await get(userRef);

    if(snap.exists()){
        const data = snap.val();
        const balance = (data.balance || 0) + prix;
        await update(userRef,{ balance });
    }

    await remove(ref(db,"commandes/"+id));
    alert("Commande annulée + remboursée");
};

// ==========================
// 🔁 TRANSFERTS
// ==========================
onValue(ref(db,"transferts"), snap=>{
    const box = document.getElementById("transfers");
    box.innerHTML = "";

    snap.forEach(child=>{
        const d = child.val();
        const id = child.key;

        box.innerHTML += `
        <div class="card">
            🔁 ${d.from} → ${d.to}<br>
            💰 ${d.amount} FC
            <br>
            <button class="ok" onclick="validerTransfert('${id}')">Valider</button>
            <button class="no" onclick="refuserTransfert('${id}')">Refuser</button>
        </div>`;
    });
});

window.validerTransfert = async(id)=>{
    const snap = await get(ref(db,"transferts/"+id));
    if(!snap.exists()) return;

    const d = snap.val();

    const fromRef = ref(db,"users/"+d.from);
    const toRef = ref(db,"users/"+d.to);

    const fromSnap = await get(fromRef);
    const toSnap = await get(toRef);

    if(!fromSnap.exists() || !toSnap.exists()) return;

    const fromData = fromSnap.val();
    const toData = toSnap.val();

    if((fromData.balance || 0) < d.amount)
        return alert("Solde insuffisant");

    await update(fromRef,{
        balance:(fromData.balance || 0) - d.amount
    });

    await update(toRef,{
        balance:(toData.balance || 0) + d.amount
    });

    await update(ref(db,"transferts/"+id),{ statut:"Validé" });

    alert("Transfert validé");
};

window.refuserTransfert = async(id)=>{
    await remove(ref(db,"transferts/"+id));
    alert("Transfert refusé");
};

// ==========================
// 👤 UTILISATEURS
// ==========================
onValue(ref(db,"users"), snap=>{
    const box = document.getElementById("users");
    box.innerHTML = "";

    snap.forEach(child=>{
        const d = child.val();

        box.innerHTML += `
        <div class="card">
            📱 ${d.phone}<br>
            💰 ${d.balance || 0} FC<br>
            🎟️ ${d.inviteCode || "-"}
        </div>`;
    });
});

// ==========================
// 🧹 SUPPRESSION
// ==========================
window.supprimer = async(path,id)=>{
    await remove(ref(db, path+"/"+id));
};
