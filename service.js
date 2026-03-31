// 🔥 LISTE SERVICES (ULTRA PRO)
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

// 🔥 AFFICHAGE
services.forEach((s, index) => {

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
        <div class="icon">${s.icon}</div>

        <div class="content">
            <div class="title">${s.nom}</div>
            <div class="desc">${s.desc}</div>

            <button id="btn-${index}">
                Commander
            </button>
        </div>
    `;

    container.appendChild(div);

    // 🔐 Anti double clic
    const btn = div.querySelector("button");

    btn.onclick = () => {
        btn.disabled = true;
        btn.innerText = "⏳ Chargement...";

        localStorage.setItem("serviceCommande", s.nom);

        setTimeout(()=>{
            window.location.href = "commande.html";
        }, 500);
    };
});
