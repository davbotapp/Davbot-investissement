// ================= CONFIG =================
let currentDay = parseInt(localStorage.getItem("courseDay")) || 1;
const totalDays = 70;

const API_URL = "https://arychauhann.onrender.com/api/gemini-proxy2";

// ================= LEÇONS HTML PRO =================
const lessons = {

1:{
title:"📘 Définition HTML",
content:`
HTML (HyperText Markup Language) est le langage utilisé pour créer la structure d'une page web.

👉 Il permet de :
- afficher du texte
- ajouter des images
- créer des boutons
- organiser le contenu

⚠️ HTML n’est PAS un langage de programmation, c’est un langage de STRUCTURE.
`
},

2:{
title:"🌍 Introduction Web",
content:`
Un site web fonctionne avec 3 technologies :

🧱 HTML → Structure (squelette)
🎨 CSS → Design (style)
⚡ JS → Interaction (logique)

👉 Exemple :
HTML crée un bouton
CSS le rend beau
JS le rend cliquable
`
},

3:{
title:"📦 Structure HTML complète",
content:`
Structure de base :

<!DOCTYPE html>
<html>
<head>
<title>Mon site</title>
</head>
<body>
Contenu ici
</body>
</html>

🔹 html → racine
🔹 head → configuration
🔹 body → contenu visible
`
},

4:{
title:"🏷️ Balises HTML",
content:`
Une balise sert à structurer le contenu.

Exemple :
<p>Bonjour</p>

👉 Ouverture : <p>
👉 Fermeture : </p>

Certaines balises n'ont pas de fermeture :
<img>
`
},

5:{
title:"📝 Titres",
content:`
<h1>Grand titre</h1>
<h2>Sous titre</h2>
...
<h6>Petit titre</h6>

👉 h1 = important
👉 h6 = moins important
`
},

6:{
title:"📄 Paragraphes",
content:`
<p>Ceci est un texte</p>

👉 Sert à écrire du contenu
👉 Important pour SEO
`
},

7:{
title:"🔗 Liens",
content:`
<a href="https://google.com">Clique ici</a>

👉 href = destination
👉 ouvre un site
`
},

8:{
title:"🖼️ Images",
content:`
<img src="image.jpg">

👉 src = chemin image
👉 pas de fermeture
`
},

9:{
title:"📋 Listes",
content:`
<ul>
<li>Item 1</li>
<li>Item 2</li>
</ul>

👉 ul = liste non ordonnée
👉 ol = liste numérotée
`
},

10:{
title:"📦 DIV (très important)",
content:`
<div>contenu</div>

👉 sert à organiser
👉 utilisé partout
👉 base du design CSS
`
},

11:{
title:"🔤 SPAN",
content:`
<span>texte</span>

👉 inline (petit élément)
👉 styliser une partie du texte
`
},

12:{
title:"🔥 HTML5 (balises modernes)",
content:`
<header> → haut page
<section> → section
<footer> → bas page
<nav> → menu

👉 code propre et moderne
`
},

13:{
title:"📑 Formulaire",
content:`
<input type="text">
<button>Envoyer</button>

👉 récupérer données utilisateur
`
},

14:{
title:"📊 Tableau",
content:`
<table>
<tr><td>1</td></tr>
</table>

👉 afficher données
`
},

15:{
title:"🎥 Média",
content:`
<video></video>
<audio></audio>

👉 ajouter contenu multimédia
`
},

16:{
title:"⚡ Inline vs Block",
content:`
Block = prend toute la ligne (div)
Inline = reste sur ligne (span)
`
},

17:{
title:"🎯 Attributs HTML",
content:`
href, src, class, id

👉 donnent infos à balises
`
},

18:{
title:"🧠 Bonnes pratiques",
content:`
✔ code propre
✔ indentation
✔ noms clairs
`
},

19:{
title:"📐 Organisation",
content:`
👉 séparer HTML / CSS / JS
👉 structure logique
`
},

20:{
title:"🔥 Balises essentielles (TOP 10)",
content:`
<h1> <p> <a> <img>
<div> <span> <input>
<button> <section> <footer>

👉 maîtrise ces 10 = niveau pro
`
},

21:{
title:"🚀 Structure PRO complète",
content:`
<!DOCTYPE html>
<html>
<head>
<title>Site</title>
</head>
<body>

<header>Menu</header>

<section>
<h1>Titre</h1>
<p>Texte</p>
</section>

<footer>Bas</footer>

</body>
</html>
`
},

22:{
title:"🎓 Projet pratique",
content:`
Créer une page :
✔ titre
✔ image
✔ bouton
✔ lien

👉 tu es maintenant développeur 💪
`
}

};

// ================= AFFICHAGE =================
function showLesson(){

const box = document.getElementById("lessonBox");

if(currentDay > totalDays){
box.innerHTML = "🎉 Formation terminée";
return;
}

const lesson = lessons[currentDay];

if(!lesson){
box.innerHTML = `
<h3>📅 Jour ${currentDay}</h3>
<p>Leçon bientôt disponible...</p>
`;
return;
}

box.innerHTML = `
<h3>📅 Jour ${currentDay}</h3>
<h2>${lesson.title}</h2>

<div style="background:#0b1c2c;padding:12px;border-radius:10px;">
${lesson.content}
</div>

<textarea id="question" placeholder="Pose ta question..." style="width:100%;margin-top:10px;padding:10px;border-radius:8px;"></textarea>

<button onclick="askAI()">🤖 Demander à l'IA</button>

<div id="aiResponse" style="margin-top:10px;"></div>

<button onclick="nextDay()">➡️ Jour suivant</button>
`;
}

// ================= NEXT =================
window.nextDay = function(){
currentDay++;
localStorage.setItem("courseDay", currentDay);
showLesson();
};

// ================= IA =================
window.askAI = async function(){

const q = document.getElementById("question").value;
const box = document.getElementById("aiResponse");

if(!q) return alert("❌ Question vide");

const prompt = `
Tu es un professeur expert HTML.

Règles :
- Répond seulement sur la leçon du jour (${currentDay})
- Explique simple
- Donne exemples code
- Pas hors sujet

Leçon :
${lessons[currentDay]?.content}

Question :
${q}
`;

box.innerHTML = "⏳ IA réfléchit...";

try{
const res = await fetch(API_URL,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({prompt})
});

const data = await res.json();

box.innerHTML = `
<div style="background:#111;padding:10px;border-radius:10px;">
${data.response || "Erreur"}
</div>
`;

}catch(e){
box.innerHTML = "❌ Erreur API";
}
};

// ================= INIT =================
window.addEventListener("DOMContentLoaded", showLesson);
