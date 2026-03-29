import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
getDatabase, ref, get, update, onValue
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

// USER
const user = localStorage.getItem("userPhone");
if(!user) location.href="index.html";

const g3info = document.getElementById("g3info");
const p7info = document.getElementById("p7info");

// =====================
// 🔄 AFFICHAGE STATUT
// =====================
onValue(ref(db,"users/"+user), snap=>{

    if(!snap.exists()) return;

    const data = snap.val();

    // G3
    if(data.tokenG3){
        const remain = data.tokenG3.expire - Date.now();

        if(remain > 0){
            const days = Math.ceil(remain / (1000*60*60*24));
            g3info.innerText = "Actif (" + days + " jours restants)";
        }else{
            g3info.innerText = "Expiré";
        }
    }else{
        g3info.innerText = "Aucun jeton";
    }

    // P7
    if(data.token){
        const used = Math.floor((Date.now() - data.token.start)/(1000*60*60*24));

        if(used < 7){
            p7info.innerText = "Actif (" + (7-used) + " jours restants)";
        }else{
            p7info.innerText = "Expiré";
        }
    }else{
        p7info.innerText = "Aucun jeton";
    }

});

// =====================
// 💰 ACHAT + START
// =====================
window.startTask = async(type)=>{

    const userRef = ref(db,"users/"+user);
    const snap = await get(userRef);

    if(!snap.exists()) return;

    const data = snap.val();
    const balance = data.balance || 0;

    // ================= G3 =================
    if(type === "G3"){

        if(data.tokenG3 && Date.now() < data.tokenG3.expire){
            return alert("❌ Jeton G3 déjà actif");
        }

        if(balance < 3500){
            return alert("❌ Solde insuffisant");
        }

        await update(userRef,{
            balance: balance - 3500,
            tokenG3:{
                expire: Date.now() + (3 * 86400000)
            },
            task1Date:"",
            task2Date:""
        });

        alert("✅ Jeton G3 activé");
        location.href="1.html";
    }

    // ================= P7 =================
    if(type === "P7"){

        if(data.token && (Date.now() - data.token.start) < (7*86400000)){
            return alert("❌ Jeton P7 déjà actif");
        }

        if(balance < 5000){
            return alert("❌ Solde insuffisant");
        }

        await update(userRef,{
            balance: balance - 5000,
            token:{
                type:"P7",
                start: Date.now()
            },
            p7TodayGain:0,
            task3Date:"",
            task4Date:""
        });

        alert("✅ Jeton P7 activé");
        location.href="3.html";
    }

};
