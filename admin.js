import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, get, update, remove, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const app = initializeApp({
    apiKey:"AIza...",
    databaseURL:"https://starlink-investit-default-rtdb.firebaseio.com"
});

const db = getDatabase(app);

// 🔐 ADMIN
const ADMIN = "0982697752";
if(localStorage.getItem("userPhone") !== ADMIN){
    alert("Accès refusé");
    location.href="index.html";
}

// ================= USERS =================
onValue(ref(db,"users"), snap=>{
    const box = document.getElementById("users");
    box.innerHTML="";

    const data = snap.val();
    if(!data) return;

    Object.keys(data).forEach(p=>{
        const u = data[p];

        box.innerHTML += `
        <div class="item">
        📱 ${p}<br>
        💰 ${u.balance || 0} FC<br>
        ⭐ ${u.points || 0}

        <button class="no" onclick="delUser('${p}')">Supprimer</button>
        </div>`;
    });
});

window.delUser = async (p)=>{
    if(confirm("Supprimer compte ?")){
        await remove(ref(db,"users/"+p));
    }
};

// ================= TRANSFERT =================
onValue(ref(db,"demandes_transferts"), snap=>{
    const box = document.getElementById("transferts");
    box.innerHTML="";

    const data = snap.val();
    if(!data) return;

    Object.entries(data).forEach(([id,d])=>{
        box.innerHTML += `
        <div class="item">
        ${d.from} ➜ ${d.to}<br>
        💰 ${d.amount}

        <button class="ok" onclick="okTrans('${id}')">✔</button>
        <button class="no" onclick="noTrans('${id}')">✖</button>
        </div>`;
    });
});

window.okTrans = async (id)=>{
    const snap = await get(ref(db,"demandes_transferts/"+id));
    const d = snap.val();

    const s1 = await get(ref(db,"users/"+d.from));
    const s2 = await get(ref(db,"users/"+d.to));

    const b1 = s1.val().balance || 0;
    const b2 = s2.val().balance || 0;

    if(b1 < d.amount) return alert("Solde insuffisant");

    await update(ref(db,"users/"+d.from),{balance:b1 - d.amount});
    await update(ref(db,"users/"+d.to),{balance:b2 + d.amount});

    await remove(ref(db,"demandes_transferts/"+id));
};

window.noTrans = async (id)=>{
    await remove(ref(db,"demandes_transferts/"+id));
};

// ================= RETRAIT =================
onValue(ref(db,"demandes_retraits"), snap=>{
    const box = document.getElementById("retraits");
    box.innerHTML="";

    const data = snap.val();
    if(!data) return;

    Object.entries(data).forEach(([id,d])=>{
        box.innerHTML += `
        <div class="item">
        ${d.telephone} - ${d.amount}

        <button class="ok" onclick="okRet('${id}')">✔</button>
        <button class="no" onclick="noRet('${id}')">✖</button>
        </div>`;
    });
});

window.okRet = async (id)=>{
    await update(ref(db,"demandes_retraits/"+id),{statut:"validé"});
};

window.noRet = async (id)=>{
    await remove(ref(db,"demandes_retraits/"+id));
};

// ================= RECHARGE =================
onValue(ref(db,"demandes_recharges"), snap=>{
    const box = document.getElementById("recharges");
    box.innerHTML="";

    const data = snap.val();
    if(!data) return;

    Object.entries(data).forEach(([id,d])=>{
        box.innerHTML += `
        <div class="item">
        ${d.user} - ${d.amount}

        <button class="ok" onclick="okRec('${id}','${d.user}',${d.amount})">✔</button>
        <button class="no" onclick="noRec('${id}')">✖</button>
        </div>`;
    });
});

window.okRec = async (id,user,amount)=>{
    const snap = await get(ref(db,"users/"+user));
    const bal = snap.val().balance || 0;

    await update(ref(db,"users/"+user),{
        balance: bal + amount
    });

    await remove(ref(db,"demandes_recharges/"+id));
};

window.noRec = async (id)=>{
    await remove(ref(db,"demandes_recharges/"+id));
};

// ================= COMMANDES =================
onValue(ref(db,"orders"), snap=>{
    const box = document.getElementById("orders");
    box.innerHTML="";

    const data = snap.val();
    if(!data) return;

    Object.entries(data).forEach(([id,d])=>{
        box.innerHTML += `
        <div class="item">
        ${d.user} - ${d.service}

        <button class="ok" onclick="okCmd('${id}')">✔</button>
        <button class="no" onclick="noCmd('${id}')">✖</button>
        </div>`;
    });
});

window.okCmd = async (id)=>{
    await update(ref(db,"orders/"+id),{statut:"validé"});
};

window.noCmd = async (id)=>{
    await remove(ref(db,"orders/"+id));
};

// ================= MESSAGE =================
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

    alert("Message envoyé");
};
