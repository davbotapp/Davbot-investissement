import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
getDatabase, ref, onValue, update, remove, push, set, get
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// CONFIG
const firebaseConfig = {
apiKey:"AIza...",
authDomain:"starlink-investit.firebaseapp.com",
databaseURL:"https://starlink-investit-default-rtdb.firebaseio.com",
projectId:"starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================= USERS =================
onValue(ref(db,"users"), snap=>{
    const box = document.getElementById("users");
    box.innerHTML="";

    const data = snap.val();
    if(!data) return;

    Object.entries(data).forEach(([phone,u])=>{
        box.innerHTML += `
        <div class="card">
        📱 ${phone}<br>
        💰 ${u.balance || 0} FC<br>

        <button class="no" onclick="delUser('${phone}')">Supprimer</button>
        </div>`;
    });
});

// ================= RECHARGES =================
onValue(ref(db,"demandes_recharges"), snap=>{
    const box = document.getElementById("recharges");
    box.innerHTML="";

    const data = snap.val();
    if(!data) return;

    Object.entries(data).forEach(([id,r])=>{
        box.innerHTML += `
        <div class="card">
        📱 ${r.user}<br>
        💰 ${r.amount} FC<br>

        <button class="ok" onclick="valRecharge('${id}','${r.user}',${r.amount})">Valider</button>
        <button class="no" onclick="refRecharge('${id}')">Refuser</button>
        </div>`;
    });
});

// ================= RETRAITS =================
onValue(ref(db,"demandes_retraits"), snap=>{
    const box = document.getElementById("retraits");
    box.innerHTML="";

    const data = snap.val();
    if(!data) return;

    Object.entries(data).forEach(([id,r])=>{
        box.innerHTML += `
        <div class="card">
        📱 ${r.telephone}<br>
        💰 ${r.montant} FC<br>

        <button class="ok" onclick="valRetrait('${id}')">Valider</button>
        <button class="no" onclick="refRetrait('${id}','${r.telephone}',${r.montant})">Refuser</button>
        </div>`;
    });
});

// ================= COMMANDES =================
onValue(ref(db,"orders/pending"), snap=>{
    const box = document.getElementById("commandes");
    box.innerHTML="";

    const data = snap.val();
    if(!data) return;

    Object.entries(data).forEach(([user,cmds])=>{
        Object.entries(cmds).forEach(([id,c])=>{

            box.innerHTML += `
            <div class="card">
            📱 ${c.user}<br>
            📦 ${c.service}<br>
            💰 ${c.price} FC<br>

            <button class="ok" onclick="valCmd('${user}','${id}')">Valider</button>
            <button class="no" onclick="refCmd('${user}','${id}')">Refuser</button>
            </div>`;
        });
    });
});

// ================= TRANSFERTS =================
onValue(ref(db,"transferts"), snap=>{
    const box = document.getElementById("transferts");
    box.innerHTML="";

    const data = snap.val();
    if(!data) return;

    Object.entries(data).forEach(([id,t])=>{
        if(t.status !== "pending") return;

        box.innerHTML += `
        <div class="card">
        ${t.from} → ${t.to}<br>
        💰 ${t.amount} FC<br>

        <button class="ok" onclick="valTrans('${id}',${t.amount},'${t.to}')">Valider</button>
        <button class="no" onclick="refTrans('${id}','${t.from}',${t.amount})">Refuser</button>
        </div>`;
    });
});

// ================= ACTIONS =================

// 💰 VALIDER RECHARGE
window.valRecharge = async (id, user, amount)=>{
    const userRef = ref(db,"users/"+user);
    const snap = await get(userRef);

    if(snap.exists()){
        const bal = snap.val().balance || 0;

        await update(userRef,{
            balance: bal + amount
        });
    }

    await remove(ref(db,"demandes_recharges/"+id));
};

// ❌ REFUSER RECHARGE
window.refRecharge = async (id)=>{
    await remove(ref(db,"demandes_recharges/"+id));
};

// 💸 VALIDER RETRAIT
window.valRetrait = async (id)=>{
    await remove(ref(db,"demandes_retraits/"+id));
};

// ❌ REFUSER RETRAIT + REMBOURSEMENT
window.refRetrait = async (id,user,amount)=>{
    const userRef = ref(db,"users/"+user);
    const snap = await get(userRef);

    if(snap.exists()){
        const bal = snap.val().balance || 0;

        await update(userRef,{
            balance: bal + amount
        });
    }

    await remove(ref(db,"demandes_retraits/"+id));
};

// 📦 VALIDER COMMANDE
window.valCmd = async (user,id)=>{
    const cmdRef = ref(db,"orders/pending/"+user+"/"+id);
    const snap = await get(cmdRef);

    if(!snap.exists()) return;

    const data = snap.val();

    await set(ref(db,"orders/validated/"+user+"/"+id), data);
    await remove(cmdRef);
};

// ❌ REFUSER COMMANDE + REMBOURSEMENT
window.refCmd = async (user, id) => {

    const cmdRef = ref(db, "orders/pending/" + user + "/" + id);
    const snap = await get(cmdRef);

    if(!snap.exists()) return;

    const data = snap.val();

    // 🔥 1. REMBOURSEMENT
    const userRef = ref(db, "users/" + user);
    const userSnap = await get(userRef);

    if(userSnap.exists()){
        const currentBalance = userSnap.val().balance || 0;

        await update(userRef, {
            balance: currentBalance + data.price
        });
    }

    // 🔥 2. SAUVEGARDE DANS ANNULÉ
    await set(ref(db, "orders/cancelled/" + user + "/" + id), {
        ...data,
        statut: "cancelled"
    });

    // 🔥 3. SUPPRESSION DE pending
    await remove(cmdRef);

    alert("❌ Commande refusée + remboursée");
};
   
// 🔁 VALIDER TRANSFERT
window.valTrans = async (id,amount,to)=>{
    const userRef = ref(db,"users/"+to);
    const snap = await get(userRef);

    if(snap.exists()){
        const bal = snap.val().balance || 0;

        await update(userRef,{
            balance: bal + amount
        });
    }

    await remove(ref(db,"transferts/"+id));
};

// ❌ REFUSER TRANSFERT + REMBOURSEMENT
window.refTrans = async (id,from,amount)=>{
    const userRef = ref(db,"users/"+from);
    const snap = await get(userRef);

    if(snap.exists()){
        const bal = snap.val().balance || 0;

        await update(userRef,{
            balance: bal + amount
        });
    }

    await remove(ref(db,"transferts/"+id));
};

// 🗑️ SUPPRIMER USER
window.delUser = async (phone)=>{
    if(confirm("Supprimer ce compte ?")){
        await remove(ref(db,"users/"+phone));
    }
};

// 💬 ENVOYER MESSAGE
window.sendMsg = async ()=>{
    const user = document.getElementById("target").value;
    const msg = document.getElementById("msg").value;
    const file = document.getElementById("file").value;

    if(!user || !msg){
        alert("Remplir les champs");
        return;
    }

    await push(ref(db,"messages/"+user),{
        text: msg,
        file: file || null,
        date: Date.now()
    });

    alert("✅ Message envoyé");
};
