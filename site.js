// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ================= CONFIG =================
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
    alert("❌ Connecte-toi");
    location.href = "index.html";
}

// ================= VARIABLES =================
let selectedType = "";
let price = 35000;
let speed = "lent";
let loading = false;

// ================= CONVERT IMAGE =================
const toBase64 = file => new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

// ================= TYPE SITE =================
document.querySelectorAll("#types .type-item").forEach(el=>{
    el.onclick = ()=>{
        document.querySelectorAll("#types .type-item")
        .forEach(i=>i.classList.remove("active"));

        el.classList.add("active");
        selectedType = el.innerText.trim();
    }
});

// ================= VITESSE =================
document.querySelectorAll("#speed .type-item").forEach(el=>{
    el.onclick = ()=>{
        document.querySelectorAll("#speed .type-item").forEach(i=>{
            i.classList.remove("active");
            i.style.transform = "scale(1)";
        });

        el.classList.add("active");
        el.style.transform = "scale(1.05)";

        price = parseInt(el.dataset.price);
        speed = price >= 40000 ? "rapide" : "lent";

        const priceEl = document.getElementById("price");
        priceEl.innerText = "💰 " + price + " FC";

        priceEl.style.transform = "scale(1.2)";
        setTimeout(()=>{
            priceEl.style.transform = "scale(1)";
        },200);
    }
});

// ================= VALIDATION =================
window.valider = async ()=>{

if(loading) return;

const name = document.getElementById("name").value.trim();
const desc = document.getElementById("desc").value.trim();
const color = document.getElementById("color").value.trim();
const importance = document.getElementById("importance").value.trim();
const features = document.getElementById("features").value.trim();
const imageFile = document.getElementById("image").files[0];

// 🔒 VALIDATION
if(!name || !desc){
    alert("❌ Remplis nom + description");
    return;
}

if(!selectedType){
    alert("❌ Choisis un type de site");
    return;
}

loading = true;

try{

    const userRef = ref(db,"users/"+user);
    const snap = await get(userRef);

    if(!snap.exists()){
        alert("❌ Utilisateur introuvable");
        loading = false;
        return;
    }

    const balance = snap.val().balance || 0;

    if(balance < price){
        alert("❌ Solde insuffisant");
        loading = false;
        return;
    }

    // 💰 RETRAIT
    await update(userRef,{
        balance: balance - price,
        lastOrder: Date.now()
    });

    // 📸 IMAGE BASE64
    let imageBase64 = null;
    if(imageFile){
        imageBase64 = await toBase64(imageFile);
    }

    // 📦 DATA PROPRE
    const data = {
        service: "Site Web Pro",
        user: user,
        name: name,
        type: selectedType,
        color: color || "",
        importance: importance || "",
        desc: desc,
        features: features || "",
        image: imageBase64,
        price: price,
        speed: speed,
        status: "pending",
        date: Date.now()
    };

    const id = Date.now();

    // 🔥 IMPORTANT (FIX ADMIN)
    await set(ref(db,"orders/pending/"+id), data);

    console.log("✅ COMMANDE SITE :", data);

    alert("✅ Commande envoyée !");
    location.href = "dashboard.html";

}catch(e){
    console.error(e);
    alert("❌ Erreur réseau");
}

loading = false;
};
