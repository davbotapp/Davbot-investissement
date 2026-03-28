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
const sw = document.getElementById("switch");
const inviteInput = document.getElementById("invite");
const msg = document.getElementById("msg");

// 🔁 SWITCH LOGIN / REGISTER
sw.onclick = () => {
    if(mode === "login"){
        mode = "register";
        title.innerText = "Créer un compte";
        btn.innerText = "S'inscrire";
        inviteInput.style.display = "block";
        sw.innerText = "Déjà un compte ?";
    } else {
        mode = "login";
        title.innerText = "Connexion";
        btn.innerText = "Se connecter";
        inviteInput.style.display = "none";
        sw.innerText = "Créer un compte";
    }
};

// 🔥 ACTION
btn.onclick = async () => {

    const phone = document.getElementById("phone").value.trim();
    const pass = document.getElementById("pass").value.trim();
    const invite = inviteInput.value.trim();

    if(!phone || !pass){
        msg.innerText = "Remplis tout";
        return;
    }

    const userRef = ref(db, "users/" + phone);
    const snap = await get(userRef);

    // ================= LOGIN =================
    if(mode === "login"){

        if(!snap.exists()){
            msg.innerText = "Compte introuvable";
            return;
        }

        if(snap.val().password !== pass){
            msg.innerText = "Mot de passe incorrect";
            return;
        }

        localStorage.setItem("userPhone", phone);
        window.location.href = "dashboard.html";
    }

    // ================= REGISTER =================
    else{

        if(snap.exists()){
            msg.innerText = "Compte existe déjà";
            return;
        }

        const code = "STAR-" + Math.floor(Math.random()*99999);

        // créer user
        await set(userRef,{
            password: pass,
            inviteCode: code,

            solde: 0,
            points: 0,

            parrain: invite || null,
            date: Date.now()
        });

        // 🎁 BONUS PARRAIN
        if(invite){

            const usersRef = ref(db, "users");
            const all = await get(usersRef);

            all.forEach(child => {
                const u = child.val();

                if(u.inviteCode === invite){
                    const parrainRef = ref(db, "users/" + child.key);

                    const newPoints = (u.points || 0) + 1;

                    update(parrainRef,{
                        points: newPoints
                    });
                }
            });
        }

        msg.innerText = "Compte créé !";
    }
};
