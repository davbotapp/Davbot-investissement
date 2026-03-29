import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, get, update, remove, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyA24pBo8mBWiZssPtep--MMBdB7c8_Lu4U",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

////////////////////////////
// 🔥 RECHARGES
////////////////////////////
onValue(ref(db,"demandes_recharges"), snap=>{
    const box = document.getElementById("recharges");
    box.innerHTML="";

    const data = snap.val();
    if(!data) return;

    Object.entries(data).forEach(([id,d])=>{
        box.innerHTML+=`
        <div class="card">
        👤 ${d.user}<br>
        💰 ${d.amount}<br>
        🧾 ${d.tid}<br>

        <button class="ok" onclick="validerRecharge('${id}','${d.user}',${d.amount})">OK</button>
        <button class="no" onclick="refuserRecharge('${id}')">NON</button>
        </div>`;
    });
});

window.validerRecharge = async(id,user,amount)=>{
    const snap = await get(ref(db,"users/"+user));
    const data = snap.val();

    await update(ref(db,"users/"+user),{
        balance:(data.balance||0)+amount
    });

    await remove(ref(db,"demandes_recharges/"+id));
};

window.refuserRecharge = id=>{
    remove(ref(db,"demandes_recharges/"+id));
};

////////////////////////////
// 🔥 RETRAITS
////////////////////////////
onValue(ref(db,"demandes_retraits"), snap=>{
    const box = document.getElementById("retraits");
    box.innerHTML="";

    const data = snap.val();
    if(!data) return;

    Object.entries(data).forEach(([id,d])=>{
        box.innerHTML+=`
        <div class="card">
        👤 ${d.telephone}<br>
        💰 ${d.montant}<br>

        <button class="ok" onclick="validerRetrait('${id}','${d.telephone}',${d.montant})">Payer</button>
        <button class="no" onclick="refuserRetrait('${id}')">Refuser</button>
        </div>`;
    });
});

window.validerRetrait = async(id,user,amount)=>{
    const snap = await get(ref(db,"users/"+user));
    const data = snap.val();

    await update(ref(db,"users/"+user),{
        balance:(data.balance||0)-amount
    });

    await remove(ref(db,"demandes_retraits/"+id));
};

window.refuserRetrait = id=>{
    remove(ref(db,"demandes_retraits/"+id));
};

////////////////////////////
// 🔥 TRANSFERTS
////////////////////////////
onValue(ref(db,"demandes_transferts"), snap=>{
    const box = document.getElementById("transferts");
    box.innerHTML="";

    const data = snap.val();
    if(!data) return;

    Object.entries(data).forEach(([id,d])=>{
        box.innerHTML+=`
        <div class="card">
        👤 ${d.from} → ${d.to}<br>
        💰 ${d.amount}<br>

        <button class="ok" onclick="validerTransfert('${id}','${d.from}','${d.to}',${d.amount})">OK</button>
        <button class="no" onclick="refuserTransfert('${id}')">NON</button>
        </div>`;
    });
});

window.validerTransfert = async(id,from,to,amount)=>{
    const s1 = await get(ref(db,"users/"+from));
    const s2 = await get(ref(db,"users/"+to));

    const u1 = s1.val();
    const u2 = s2.val();

    await update(ref(db,"users/"+from),{
        balance:(u1.balance||0)-amount
    });

    await update(ref(db,"users/"+to),{
        balance:(u2.balance||0)+amount
    });

    await remove(ref(db,"demandes_transferts/"+id));
};

window.refuserTransfert = id=>{
    remove(ref(db,"demandes_transferts/"+id));
};

////////////////////////////
// 🔥 USERS
////////////////////////////
onValue(ref(db,"users"), snap=>{
    const box = document.getElementById("users");
    box.innerHTML="";

    const data = snap.val();
    if(!data) return;

    Object.entries(data).forEach(([id,u])=>{
        box.innerHTML+=`
        <div class="card">
        📱 ${id}<br>
        💰 ${u.balance||0}<br>

        <button class="no" onclick="delUser('${id}')">Supprimer</button>
        </div>`;
    });
});

window.delUser = id=>{
    if(confirm("Supprimer ?")){
        remove(ref(db,"users/"+id));
    }
};

////////////////////////////
// 🔥 COMMANDES
////////////////////////////
onValue(ref(db,"orders"), snap=>{
    const box = document.getElementById("orders");
    box.innerHTML="";

    const data = snap.val();
    if(!data) return;

    Object.values(data).forEach(cmd=>{
        box.innerHTML+=`
        <div class="card">
        👤 ${cmd.user}<br>
        📦 ${cmd.service}<br>
        💰 ${cmd.price}
        </div>`;
    });
});

////////////////////////////
// 🔥 MESSAGE
////////////////////////////
window.sendMsg = async ()=>{
    const phone = document.getElementById("phone").value.trim();
    const text = document.getElementById("msgText").value.trim();

    if(!phone || !text) return alert("Remplir");

    await push(ref(db,"messages/"+phone),{
        text:text,
        date:Date.now()
    });

    alert("Envoyé");
};
