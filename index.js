import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔥 CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyA24pBo8mBWiZssPtep--MMBdB7c8_Lu4U",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================= MODE =================
let mode = "login";

// ================= ELEMENTS =================
const btn = document.getElementById("btn");
const switchBtn = document.getElementById("switch");

const phoneInput = document.getElementById("phone");
const passInput = document.getElementById("pass");
const inviteInput = document.getElementById("invite");

const nameInput = document.getElementById("name");
const photoInput = document.getElementById("photo");

const status = document.getElementById("statusMsg");

// ================= SWITCH =================
switchBtn.onclick = () => {

    if(mode === "login"){
        mode = "register";

        btn.innerText = "CRÉER COMPTE";
        switchBtn.innerText = "Déjà un compte ?";

        inviteInput.style.display = "block";
        nameInput.style.display = "block";
        photoInput.style.display = "block";

    } else {
        mode = "login";

        btn.innerText = "SE CONNECTER";
        switchBtn.innerText = "Créer un compte";

        inviteInput.style.display = "none";
        nameInput.style.display = "none";
        photoInput.style.display = "none";
    }
};

// ================= ACTION =================
btn.onclick = async () => {

    const phone = phoneInput.value.trim();
    const pass = passInput.value.trim();
    const invite = inviteInput.value.trim();

    if(!phone || !pass){
        status.innerText = "❌ Champs requis";
        return;
    }

    if(phone.length < 6){
        status.innerText = "❌ Numéro invalide";
        return;
    }

    status.innerHTML = `<span class="loader"></span> Traitement...`;

    try{

        const userRef = ref(db, "users/" + phone);
        const snap = await get(userRef);

        // ================= LOGIN =================
        if(mode === "login"){

            if(!snap.exists()){
                status.innerText = "❌ Compte introuvable";
                return;
            }

            const data = snap.val();

            if(data.password !== pass){
                status.innerText = "❌ Mot de passe incorrect";
                return;
            }

            localStorage.setItem("userPhone", phone);

            status.innerHTML = `<span class="loader"></span> Connexion...`;

            setTimeout(()=>{
                window.location.href = "dashboard.html";
            },1200);
        }

        // ================= REGISTER =================
        else{

            if(snap.exists()){
                status.innerText = "❌ Compte déjà existant";
                return;
            }

            const name = nameInput.value.trim();
            if(!name){
                status.innerText = "❌ Nom requis";
                return;
            }

            // 📸 IMAGE
            let photo = "";

            const file = photoInput.files[0];

            if(file){
                photo = await toBase64(file);
            }

            const inviteCode = "DAV-" + Math.floor(1000 + Math.random()*9000);

            let parrain = null;

            // 🎁 PARRAINAGE
            if(invite){

                const usersSnap = await get(ref(db,"users"));

                if(usersSnap.exists()){
                    const users = usersSnap.val();

                    Object.entries(users).forEach(([p,u])=>{
                        if(u.inviteCode === invite){
                            parrain = p;

                            // 🎯 BONUS NIVEAU 1
                            update(ref(db,"users/"+p),{
                                count_lvl1: (u.count_lvl1 || 0) + 1,
                                points: (u.points || 0) + 8
                            });
                        }
                    });
                }
            }

            // 💾 SAVE USER
            await set(userRef,{
                phone,
                password: pass,
                name,
                photo,
                inviteCode,
                parrain,
                balance: 0,
                revenus: 0,
                points: 0,
                count_lvl1: 0,
                count_lvl2: 0,
                count_lvl3: 0,
                createdAt: Date.now()
            });

            localStorage.setItem("userPhone", phone);

            status.innerHTML = `<span class="loader"></span> Création...`;

            setTimeout(()=>{
                window.location.href = "dashboard.html";
            },1200);
        }

    }catch(e){
        console.error(e);
        status.innerText = "❌ Erreur réseau";
    }
};

// ================= 📸 CONVERT IMAGE =================
function toBase64(file){
    return new Promise((resolve, reject)=>{
        const reader = new FileReader();
        reader.onload = ()=> resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}
