import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, update, remove, runTransaction } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔐 CONFIG FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🔒 PROTECTION ADMIN
const adminPhone = "0982697752";
if(localStorage.getItem("userPhone") !== adminPhone){
    alert("Accès refusé");
    window.location.href = "index.html";
}

// ==========================
// 💰 RECHARGES
// ==========================
onValue(ref(db,"demandes_recharges"), snap=>{
    let html="";
    snap.forEach(s=>{
        let d=s.val();
        html+=`
        <div class="card">
        📱 ${d.telephone}<br>
        💰 ${d.montant} FC<br>
        🆔 ${d.transactionID}
        <br>
        <button class="ok" onclick="validerRecharge('${s.key}','${d.telephone}',${d.montant})">VALIDER</button>
        <button class="no" onclick="refuser('${s.key}','demandes_recharges')">REFUSER</button>
        </div>`;
    });
    document.getElementById("recharges").innerHTML = html;
});

window.validerRecharge = async(id,phone,montant)=>{
    await runTransaction(ref(db,"users/"+phone+"/balance"), val=>(val||0)+montant);
    await remove(ref(db,"demandes_recharges/"+id));
    alert("Recharge validée");
};

// ==========================
// 💸 RETRAITS
// ==========================
onValue(ref(db,"demandes_retraits"), snap=>{
    let html="";
    snap.forEach(s=>{
        let d=s.val();
        html+=`
        <div class="card">
        📱 ${d.telephone}<br>
        💰 ${d.montant} FC
        <br>
        <button class="ok" onclick="validerRetrait('${s.key}','${d.telephone}',${d.montant})">VALIDER</button>
        <button class="no" onclick="refuser('${s.key}','demandes_retraits')">REFUSER</button>
        </div>`;
    });
    document.getElementById("withdraws").innerHTML = html;
});

window.validerRetrait = async(id,phone,montant)=>{
    const frais = montant * 0.1;

    await runTransaction(ref(db,"users/"+phone+"/balance"), val=>(val||0)-(montant+frais));

    await runTransaction(ref(db,"site_gain"), val=>(val||0)+frais);

    await remove(ref(db,"demandes_retraits/"+id));

    alert("Retrait validé avec frais");
};

// ==========================
// 📦 COMMANDES
// ==========================
onValue(ref(db,"commandes"), snap=>{
    let html="";
    snap.forEach(s=>{
        let d=s.val();
        if(d.statut !== "valide"){
            html+=`
            <div class="card">
            👤 ${d.user}<br>
            📦 ${d.service}<br>
            💰 ${d.price}
            <br>
            <button class="ok" onclick="validerCommande('${s.key}')">VALIDER</button>
            <button class="no" onclick="annulerCommande('${s.key}','${d.user}',${d.price})">ANNULER</button>
            </div>`;
        }
    });
    document.getElementById("orders").innerHTML = html;
});

window.validerCommande = async(id)=>{
    await update(ref(db,"commandes/"+id), { statut:"valide" });
    alert("Commande validée ✅");
};

window.annulerCommande = async(id,user,price)=>{
    await runTransaction(ref(db,"users/"+user+"/balance"), val=>(val||0)+price);
    await remove(ref(db,"commandes/"+id));
    alert("Commande annulée + remboursée");
};

// ==========================
// 🔁 TRANSFERT
// ==========================
onValue(ref(db,"transferts"), snap=>{
    let html="";
    snap.forEach(s=>{
        let d=s.val();
        if(d.status === "pending"){
            html+=`
            <div class="card">
            🔁 ${d.from} ➜ ${d.to}<br>
            💰 ${d.amount}
            <br>
            <button class="ok" onclick="validerTransfert('${s.key}','${d.from}','${d.to}',${d.amount})">VALIDER</button>
            <button class="no" onclick="refuser('${s.key}','transferts')">REFUSER</button>
            </div>`;
        }
    });
    document.getElementById("transfers").innerHTML = html;
});

window.validerTransfert = async(id,from,to,amount)=>{
    await runTransaction(ref(db,"users/"+from+"/balance"), val=>(val||0)-amount);
    await runTransaction(ref(db,"users/"+to+"/balance"), val=>(val||0)+amount);

    await update(ref(db,"transferts/"+id), { status:"done" });

    alert("Transfert validé 🔥");
};

// ==========================
// 👤 UTILISATEURS
// ==========================
onValue(ref(db,"users"), snap=>{
    let html="";
    snap.forEach(s=>{
        let d=s.val();
        html+=`
        <div class="card">
        📱 ${s.key}<br>
        💰 ${d.balance || 0} FC
        </div>`;
    });
    document.getElementById("users").innerHTML = html;
});

// ==========================
// ❌ REFUSER GLOBAL
// ==========================
window.refuser = async(id,path)=>{
    await remove(ref(db, path+"/"+id));
    alert("Refusé ❌");
};
