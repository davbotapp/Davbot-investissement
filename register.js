import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyA24pBo8mBWiZssPtep--MMBdB7c8_Lu4U",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let mode = "login";

const title = document.getElementById("title");
const btn = document.getElementById("btn");
const switchBtn = document.getElementById("switch");
const inviteInput = document.getElementById("invite");
const status = document.getElementById("status");

// 🔁 SWITCH MODE
switchBtn.onclick = () => {

    if(mode === "login"){
        mode = "register";
        title.innerText = "INSCRIPTION";
        btn.innerText = "CRÉER COMPTE";
        inviteInput.style.display = "block";
        switchBtn.innerText = "Déjà un compte ?";
    } else {
        mode = "login";
        title.innerText = "CONNEXION";
        btn.innerText = "SE CONNECTER";
        inviteInput.style.display = "none";
        switchBtn.innerText = "Créer un compte";
    }
};

// 🔥 ACTION
btn.onclick = async () => {

    const phone = document.getElementById("phone").value.trim();
    const pass = document.getElementById("pass").value.trim();
    const invite = inviteInput.value.trim();

    if(!phone || !pass){
        status.innerText = "❌ Remplis tous les champs";
        return;
    }

    const userRef = ref(db, "users/" + phone);
    const snap = await get(userRef);

    // ================= LOGIN =================
    if(mode === "login"){

        if(!snap.exists()){
            status.innerText = "❌ Compte introuvable";
            return;
        }

        if(snap.val().password !== pass){
            status.innerText = "❌ Mot de passe incorrect";
            return;
        }

        localStorage.setItem("userPhone", phone);
        window.location.href = "dashboard.html";
    }

    // ================= REGISTER =================
    else{

        if(snap.exists()){
            status.innerText = "❌ Compte existe déjà";
            return;
        }

        const code = "DAV-" + Math.floor(Math.random()*99999);

        await set(userRef,{
            password: pass,
            inviteCode: code,

            solde: 0,
            points: 0,

            parrain: invite || null,
            date: Date.now()
        });

        // 🎁 BONUS PARRAIN (1 point)
        if(invite){
            const users = await get(ref(db,"users"));

            users.forEach(child=>{
                if(child.val().inviteCode === invite){

                    const newPts = (child.val().points || 0) + 1;

                    update(ref(db,"users/"+child.key),{
                        points: newPts
                    });
                }
            });
        }

        status.style.color="#4caf50";
        status.innerText="✅ Compte créé !";
    }
};
