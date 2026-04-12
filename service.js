// ================= CONFIG =================
const services = [
    {
        nom: "Application",
        desc: "Création application mobile Android / iOS",
        icon: "📱",
        page: "application.html"
    },
    {
        nom: "Site Web Pro",
        desc: "Site professionnel moderne et rapide",
        icon: "🌐",
        page: "site.html"
    },
    {
        nom: "Intelligence Artificielle",
        desc: "Chatbot, automatisation IA",
        icon: "🤖",
        page: "ai.html"
    },
    {
        nom: "Mini Jeux",
        desc: "Création jeux (slot, quiz, arcade...)",
        icon: "🎮",
        page: "mini.html"
    },
    {
        nom: "Réseaux Sociaux",
        desc: "Boost followers, likes, vues",
        icon: "📲",
        page: "social.html"
    },
   {
    nom: "Davbot Academy",
    desc: "Plateforme de formation IA, business et technologie",
    icon: "💎",
    page: "apprend.html"
   },
    {
        nom: "VPN",
        desc: "Connexion sécurisée et anonyme",
        icon: "🛡️",
        page: "vpn.html"
    }
];

// ================= USER CHECK =================
const user = localStorage.getItem("userPhone");

if(!user){
    window.location.href = "index.html";
}

// ================= CONTAINER =================
const container = document.getElementById("services");

// ================= CREATE CARD =================
function createCard(service, index){

    const div = document.createElement("div");
    div.className = "card";

    // animation départ
    div.style.opacity = "0";
    div.style.transform = "translateY(30px)";

    div.innerHTML = `
        <div class="icon">${service.icon}</div>

        <div class="content">
            <div class="title">${service.nom}</div>
            <div class="desc">${service.desc}</div>

            <button class="btn">
                🚀 Commander
            </button>
        </div>
    `;

    container.appendChild(div);

    // ================= ANIMATION =================
    setTimeout(()=>{
        div.style.transition = "0.5s ease";
        div.style.opacity = "1";
        div.style.transform = "translateY(0)";
    }, index * 120);

    // ================= CLICK =================
    const btn = div.querySelector(".btn");

    btn.onclick = () => {

        // 🔐 anti double clic
        if(btn.classList.contains("loading")) return;

        btn.classList.add("loading");
        btn.innerHTML = "⏳ Chargement...";

        // 🎯 effet visuel
        div.style.transform = "scale(0.97)";
        div.style.boxShadow = "0 0 20px rgba(0,210,255,0.4)";

        // 💾 sauvegarde service
        localStorage.setItem("serviceCommande", service.nom);

        // 🔀 redirection
        setTimeout(()=>{
            window.location.href = service.page;
        }, 600);
    };
}

// ================= RENDER =================
services.forEach((s, i)=>{
    createCard(s, i);
});

// ================= BONUS UX =================

// hover effet glow
document.addEventListener("mouseover", e=>{
    if(e.target.closest(".card")){
        e.target.closest(".card").style.transform = "scale(1.02)";
    }
});

document.addEventListener("mouseout", e=>{
    if(e.target.closest(".card")){
        e.target.closest(".card").style.transform = "scale(1)";
    }
});

// ================= LOADER GLOBAL =================
window.addEventListener("load", ()=>{
    document.body.style.opacity = "1";
});
