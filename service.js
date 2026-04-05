// 🔥 LISTE SERVICES
const services = [
    {
        nom: "Application",
        desc: "Création application mobile Android / iOS",
        icon: "📱"
    },
    {
        nom: "Site Web Pro",
        desc: "Site professionnel moderne",
        icon: "🌐"
    },
    {
        nom: "Intelligence Artificielle",
        desc: "Chatbot, automatisation IA",
        icon: "🤖"
    },
    {
        nom: "Mini Jeux",
        desc: "Création jeux (slot, quiz, memory...)",
        icon: "🎮"
    },
    {
        nom: "Réseaux Sociaux",
        desc: "Boost followers, likes, vues",
        icon: "📲"
    },
    {
        nom: "Hébergement",
        desc: "Serveur rapide sécurisé",
        icon: "💾"
    },
    {
        nom: "VPN",
        desc: "Connexion sécurisée & anonyme",
        icon: "🛡️"
    }
];

// 🔥 CONTAINER
const container = document.getElementById("services");

// 🔥 CREATE CARD FUNCTION
function createCard(service, index){

    const div = document.createElement("div");
    div.className = "card";

    // animation delay
    div.style.opacity = "0";
    div.style.transform = "translateY(20px)";

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

    // 🔥 ANIMATION APPARITION
    setTimeout(()=>{
        div.style.transition = "0.5s ease";
        div.style.opacity = "1";
        div.style.transform = "translateY(0)";
    }, index * 100);

    // 🔥 BOUTON
    const btn = div.querySelector(".btn");

    btn.onclick = () => {

        // 🔐 bloque multi clic
        if(btn.classList.contains("loading")) return;

        btn.classList.add("loading");
        btn.innerHTML = "⏳ Chargement...";

        // 🔥 effet clic
        div.style.transform = "scale(0.97)";

        setTimeout(()=>{
            localStorage.setItem("serviceCommande", service.nom);
            window.location.href = "commande.html";
        }, 600);
    };
}

// 🔥 LOOP
services.forEach((s, i) => createCard(s, i));
