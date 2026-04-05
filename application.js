import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ================= FIREBASE =================
const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================= USER =================
const user = localStorage.getItem("userPhone");

if(!user){
    window.location.href = "index.html";
}

// ================= ELEMENTS =================
const nameInput = document.getElementById("name");
const colorInput = document.getElementById("color");
const themeInput = document.getElementById("theme");
const descInput = document.getElementById("desc");
const useInput = document.getElementById("use");

const iconInput = document.getElementById("icon");
const pubInput = document.getElementById("pubImage");

const iconPreview = document.getElementById("iconPreview");
const pubPreview = document.getElementById("pubPreview");

const btn = document.getElementById("sendBtn");

// ================= IMAGE PREVIEW =================
function previewImage(input, previewZone){
    input.addEventListener("change", ()=>{
        const file = input.files[0];
        if(!file) return;

        const reader = new FileReader();

        reader.onload = (e)=>{
            previewZone.innerHTML = `<img src="${e.target.result}">`;
        };

        reader.readAsDataURL(file);
    });
}

previewImage(iconInput, iconPreview);
previewImage(pubInput, pubPreview);

// ================= ENVOI =================
btn.onclick = async ()=>{

    const name = nameInput.value.trim();
    const color = colorInput.value.trim();
    const theme = themeInput.value;
    const desc = descInput.value.trim();
    const use = useInput.value.trim();

    // 🔒 VALIDATION
    if(!name || !color || !desc){
        alert("❌ Remplis tous les champs obligatoires");
        return;
    }

    try{
        // animation bouton
        btn.disabled = true;
        btn.innerText = "⏳ Envoi en cours...";

        // 📦 DATA
        const data = {
            user: user,
            service: "Application",
            name: name,
            color: color,
            theme: theme,
            description: desc,
            utilisation: use,
            icon: iconInput.files[0] ? iconInput.files[0].name : null,
            pubImage: pubInput.files[0] ? pubInput.files[0].name : null,
            statut: "pending",
            date: Date.now()
        };

        const id = Date.now();

        // 🔥 SAVE
        await set(ref(db, "orders/applications/" + user + "/" + id), data);

        // 🔔 MESSAGE USER
        await set(ref(db, "messages/" + user + "/" + id), {
            text: "📱 Demande application envoyée avec succès",
            type: "app",
            date: Date.now()
        });

        alert("✅ Application envoyée !");

        // 🔁 redirect
        window.location.href = "dashboard.html";

    }catch(e){
        console.error(e);
        alert("❌ Erreur réseau");
    }

    btn.disabled = false;
    btn.innerText = "🚀 Créer l'application";
};
