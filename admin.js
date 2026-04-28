// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
getDatabase, ref, onValue, update, remove, push, set, get
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
apiKey:"AIza...",
authDomain:"starlink-investit.firebaseapp.com",
databaseURL:"https://starlink-investit-default-rtdb.firebaseio.com",
projectId:"starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================= ERROR LOGGER =================
window.addEventListener("unhandledrejection", e=>{
console.error("🔥 Firebase Error:", e.reason);
});

// ================= LOCK SYSTEM =================
let loading = {};

function lock(id){
if(loading[id]) return true;
loading[id] = true;
return false;
}

function unlock(id){
delete loading[id];
}

// ================= SAFE FUNCTIONS =================
async function safeGet(path){
const snap = await get(ref(db, path));
return snap.exists() ? snap.val() : null;
}

async function safeDelete(path){
const r = ref(db, path);
const snap = await get(r);
if(!snap.exists()) return false;
await remove(r);
return true;
}

// ================= LOGGER =================
async function logAction(type,data){
await push(ref(db,"admin_logs"),{
type,
...data,
date:Date.now()
});
}

// =================================================
// 💰 VALID RECHARGE
// =================================================
window.valRecharge = async(id,user,amount)=>{

const key = "rech-"+id;
if(lock(key)) return alert("⏳ Traitement...");

try{

const recharge = await safeGet("demandes_recharges/"+id);
if(!recharge) throw "Déjà traité";

const userRef = ref(db,"users/"+user);
const snap = await get(userRef);

if(!snap.exists()) throw "Utilisateur introuvable";

const u = snap.val();

const amt = Number(amount || recharge.amount || 0);
if(amt <= 0) throw "Montant invalide";

const newBal = Number(u.balance || 0) + amt;

// update solde
await update(userRef,{balance:newBal});

// archive
await set(ref(db,"recharges_validées/"+id),{
user, amount:amt, newBalance:newBal,
status:"approved",
date:Date.now()
});

// delete
await remove(ref(db,"demandes_recharges/"+id));

// message
await push(ref(db,"messages/"+user),{
text:`✅ Recharge validée\n💰 +${amt} FC`,
date:Date.now()
});

await logAction("recharge_validée",{user,amount:amt});

alert("✅ Recharge OK");

}catch(e){
console.error(e);
alert(e);
}

unlock(key);
};

// =================================================
// ❌ REFUSE RECHARGE
// =================================================
window.refRecharge = async(id,user,amount)=>{

const key = "rech-"+id;
if(lock(key)) return alert("⏳ Traitement...");

try{

const recharge = await safeGet("demandes_recharges/"+id);
if(!recharge) throw "Déjà traité";

await set(ref(db,"recharges_refusées/"+id),{
user,
amount:Number(amount || recharge.amount || 0),
status:"refused",
date:Date.now()
});

await remove(ref(db,"demandes_recharges/"+id));

await push(ref(db,"messages/"+user),{
text:`❌ Recharge refusée`,
date:Date.now()
});

await logAction("recharge_refusée",{user});

alert("❌ Refusé");

}catch(e){
console.error(e);
alert(e);
}

unlock(key);
};

// =================================================
// 📦 VALID COMMAND
// =================================================
window.valCmd = async(user,id)=>{

const key = "cmd-"+user+"-"+id;
if(lock(key)) return alert("⏳ Traitement...");

try{

const cmdRef = ref(db,`orders/pending/${user}/${id}`);
const snap = await get(cmdRef);

if(!snap.exists()) throw "Déjà traité";

const cmd = snap.val();

// archive
await set(ref(db,`orders/validated/${user}/${id}`),{
...cmd,
status:"approved",
dateValidated:Date.now()
});

// delete
await remove(cmdRef);

// message
await push(ref(db,"messages/"+user),{
text:`✅ Commande validée\n📦 ${cmd.service}`,
date:Date.now()
});

await logAction("commande_validée",{user});

alert("✅ Commande OK");

}catch(e){
console.error(e);
alert(e);
}

unlock(key);
};

// =================================================
// ❌ REFUSE COMMAND
// =================================================
window.refCmd = async(user,id,price)=>{

const key = "cmd-"+user+"-"+id;
if(lock(key)) return alert("⏳ Traitement...");

try{

const cmdRef = ref(db,`orders/pending/${user}/${id}`);
const snap = await get(cmdRef);

if(!snap.exists()) throw "Déjà traité";

const cmd = snap.val();

const amt = Number(price || cmd.price || 0);

const userRef = ref(db,"users/"+user);
const userSnap = await get(userRef);

if(!userSnap.exists()) throw "User introuvable";

const u = userSnap.val();

// remboursement
const newBal = Number(u.balance || 0) + amt;

await update(userRef,{balance:newBal});

// archive
await set(ref(db,`orders/cancelled/${user}/${id}`),{
...cmd,
status:"refused",
price:amt,
newBalance:newBal,
dateCancelled:Date.now()
});

// delete
await remove(cmdRef);

// message
await push(ref(db,"messages/"+user),{
text:`❌ Commande refusée\n💰 ${amt} FC remboursé`,
date:Date.now()
});

await logAction("commande_refusée",{user});

alert("❌ Commande refusée");

}catch(e){
console.error(e);
alert(e);
}

unlock(key);
};
