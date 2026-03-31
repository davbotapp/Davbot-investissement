import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey:"AIza...",
    authDomain:"starlink-investit.firebaseapp.com",
    databaseURL:"https://starlink-investit-default-rtdb.firebaseio.com",
    projectId:"starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const user = localStorage.getItem("userPhone");
if(!user) location.href="index.html";

const list = document.getElementById("list");

// 🔥 convertir durée → jours
function getDays(duree){
    if(!duree) return 0;
    if(duree.includes("7")) return 7;
    if(duree.includes("15")) return 15;
    if(duree.includes("30")) return 30;
    if(duree.includes("60")) return 60;
    
    return 0;
}

// ⏳ calcul temps restant
function getRemaining(end){
    const now = Date.now();
    const diff = end - now;

    if(diff <= 0) return "Expiré";

    const days = Math.floor(diff / (1000*60*60*24));
    const hours = Math.floor((diff / (1000*60*60)) % 24);

    return `${days}j ${hours}h`;
}

// 🔥 LISTE HÉBERGEMENTS
onValue(ref(db,"hebergements/"+user), snap=>{

    list.innerHTML = "";

    if(!snap.exists()){
        list.innerHTML = "<p>Aucun hébergement</p>";
        return;
    }

    Object.entries(snap.val()).forEach(([id,site])=>{

        const days = getDays(site.duree);
        const endDate = site.date + (days * 86400000);

        let status = "online";

        if(Date.now() > endDate){
            status = "expired";

            // 🔥 mettre à jour firebase
            update(ref(db,"hebergements/"+user+"/"+id),{
                status:"expired"
            });
        }

        list.innerHTML += `
        <div class="card">
            🌐 <a href="${site.siteUrl}" target="_blank">${site.siteUrl}</a><br>
            ⏳ ${site.duree}<br>
            ⏱️ Temps restant : ${getRemaining(endDate)}<br>

            Statut :
            <b class="${status==='online'?'online':'expired'}">
                ${status==='online'?'🟢 EN LIGNE':'🔴 EXPIRÉ'}
            </b>

            ${status==='expired' ? `
                <button onclick="renew('${id}')">🔄 Renouveler</button>
            ` : ``}
        </div>
        `;
    });

});

// 🔄 RENOUVELER
window.renew = async(id)=>{

    if(!confirm("Renouveler cet hébergement ?")) return;

    await update(ref(db,"hebergements/"+user+"/"+id),{
        date: Date.now(),
        status: "online"
    });

    alert("✅ Hébergement renouvelé !");
};
