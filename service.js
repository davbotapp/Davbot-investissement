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
        nom: "Réseaux Sociaux",
        desc: "Boost followers, likes, vues",
        icon: "📲"
    },
    {
        nom: "Hébergement",
        desc: "Serveur rapide sécurisé",
        icon: "💾"
    }
];

// 🔥 AFFICHAGE
const container = document.getElementById("services");

services.forEach(s => {

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
        <div class="icon">${s.icon}</div>

        <div class="content">
            <div class="title">${s.nom}</div>
            <div class="desc">${s.desc}</div>

            <button onclick="commander('${s.nom}')">
                Commander
            </button>
        </div>
    `;

    container.appendChild(div);
});

// 🔥 COMMANDER
window.commander = function(service){
    localStorage.setItem("serviceCommande", service);
    window.location.href = "commande.html";
};
