import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
getDatabase, ref, onValue, update, remove, push, set
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
        ${r.user} - ${r.amount} FC<br>

        <button class="ok" onclick="valRecharge('${id}','${r.user}',${r.amount})">Valider</button>
        <button class="no" onclick="refuse('demandes_recharges','${id}')">Refuser</button>
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
        ${r.telephone} - ${r.montant} FC<br>

        <button class="ok" onclick="valRetrait('${id}')">Valider</button>
        <button class="no" onclick="refuse('demandes_retraits','${id}')">Refuser</button>
        </div>`;
    });
});

// ================= COMMANDES =================
onValue(ref(db,"orders/pending"), snap=>{
    const box = document.getElementById("commandes");
    box.innerHTML="";

    const data = snap.val();
    if(!data) return;

    Object.entries(data).forEach(([id,c])=>{
        box.innerHTML += `
        <div class="card">
        ${c.user} - ${c.service}<br>
        💰 ${c.price} FC<br>

        <button class="ok" onclick="valCmd('${id}')">Valider</button>
        <button class="no" onclick="refCmd('${id}')">Refuser</button>
        </div>`;
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
        <button class="no" onclick="refuse('transferts','${id}')">Refuser</button>
        </div>`;
    });
});

// ================= ACTIONS =================

// RECHARGE
window.valRecharge = async(id,user,amount)=>{
    const refUser = ref(db,"users/"+user);

    onValue(refUser, snap=>{
        const bal = snap.val().balance || 0;

        update(refUser,{
            balance: bal + amount
        });
    },{onlyOnce:true});

    update(ref(db,"demandes_recharges/"+id),{
        status:"validated"
    });
};

// RETRAIT
window.valRetrait = async(id)=>{
    update(ref(db,"demandes_retraits/"+id),{
        statut:"validé"
    });
};

// CMD
window.valCmd = async(id)=>{
    const snapRef = ref(db,"orders/pending/"+id);

    onValue(snapRef, snap=>{
        const data = snap.val();

        set(ref(db,"orders/validated/"+id), data);
        remove(snapRef);

    },{onlyOnce:true});
};

window.refCmd = async(id)=>{
    const snapRef = ref(db,"orders/pending/"+id);

    onValue(snapRef, snap=>{
        const data = snap.val();

        set(ref(db,"orders/cancelled/"+id), data);
        remove(snapRef);

    },{onlyOnce:true});
};

// TRANSFERT
window.valTrans = async(id,amount,to)=>{
    const userRef = ref(db,"users/"+to);

    onValue(userRef, snap=>{
        const bal = snap.val().balance || 0;

        update(userRef,{
            balance: bal + amount
        });
    },{onlyOnce:true});

    update(ref(db,"transferts/"+id),{
        status:"validated"
    });
};

// REFUSER
window.refuse = async(path,id)=>{
    update(ref(db,path+"/"+id),{
        status:"رفض"
    });
};

// DELETE USER
window.delUser = async(phone)=>{
    if(confirm("Supprimer ?")){
        remove(ref(db,"users/"+phone));
    }
};

// MESSAGE
window.sendMsg = async()=>{
    const user = document.getElementById("target").value;
    const msg = document.getElementById("msg").value;
    const file = document.getElementById("file").value;

    if(!user || !msg) return alert("Remplir");

    await push(ref(db,"messages/"+user),{
        text: msg,
        file: file || null,
        date: Date.now()
    });

    alert("Envoyé");
};
