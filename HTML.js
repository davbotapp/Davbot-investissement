// ================= CONFIG =================
const API_URL = "https://arychauhann.onrender.com/api/gemini-proxy2";

// ================= VARIABLES =================
let currentDay = parseInt(localStorage.getItem("html_day")) || 1;
const maxDay = 70;

// ================= ELEMENTS =================
const lessonBox = document.getElementById("lessonBox");
const dayText = document.getElementById("dayText");
const progressBar = document.getElementById("progressBar");

// ================= LEÇONS =================
const lessons = {};

// 🔥 GENERATEUR AUTOMATIQUE
for(let i=1;i<=70;i++){

let content = "";

// ================= FORMATION HTML COMPLETE =================

if(i >= 1 && i <= 20){

// ================= JOUR 1 =================
if(i === 1){
content = `
<h3>📘 Jour 1 : Introduction à HTML</h3>

<p>🔵 Balise principale :</p>
<code>&lt;h1&gt;</code>

<p>🟡 Explication :</p>
<p>HTML sert à créer la structure des sites web.</p>

<p>🟢 Exemple :</p>
<pre>&lt;h1&gt;Bienvenue&lt;/h1&gt;</pre>

<p>Résultat :</p>
<h1>Bienvenue</h1>
`;
}

// ================= JOUR 2 =================
else if(i === 2){
content = `
<h3>📘 Jour 2 : Structure HTML</h3>

<p>🔵 Balises :</p>
<code>&lt;html&gt;</code>
<code>&lt;body&gt;</code>

<p>🟡 Explication :</p>
<p>HTML est la structure principale, BODY contient le contenu visible.</p>

<p>🟢 Exemple :</p>
<pre>
&lt;html&gt;
  &lt;body&gt;
    Bonjour
  &lt;/body&gt;
&lt;/html&gt;
</pre>
`;
}

// ================= JOUR 3 =================
else if(i === 3){
content = `
<h3>📘 Jour 3 : Paragraphes</h3>

<p>🔵 Balise :</p>
<code>&lt;p&gt;</code>

<p>🟡 Explication :</p>
<p>Elle sert à écrire du texte normal.</p>

<p>🟢 Exemple :</p>
<pre>&lt;p&gt;Je suis développeur&lt;/p&gt;</pre>

<p>Résultat :</p>
<p>Je suis développeur</p>
`;
}

// ================= JOUR 4 =================
else if(i === 4){
content = `
<h3>📘 Jour 4 : Titres</h3>

<p>🔵 Balises :</p>
<code>&lt;h1&gt;</code> <code>&lt;h2&gt;</code> <code>&lt;h3&gt;</code>

<p>🟡 Explication :</p>
<p>Les titres servent à organiser la page.</p>

<p>🟢 Exemple :</p>
<pre>
&lt;h1&gt;Titre principal&lt;/h1&gt;
&lt;h2&gt;Sous-titre&lt;/h2&gt;
</pre>
`;
}

// ================= JOUR 5 =================
else if(i === 5){
content = `
<h3>📘 Jour 5 : Liens</h3>

<p>🔵 Balise :</p>
<code>&lt;a&gt;</code>

<p>🟡 Explication :</p>
<p>Elle permet de naviguer vers une autre page.</p>

<p>🟢 Exemple :</p>
<pre>&lt;a href="https://google.com"&gt;Google&lt;/a&gt;</pre>
`;
}

// ================= JOUR 6 =================
else if(i === 6){
content = `
<h3>📘 Jour 6 : Images</h3>

<p>🔵 Balise :</p>
<code>&lt;img&gt;</code>

<p>🟡 Explication :</p>
<p>Elle permet d’afficher une image.</p>

<p>🟢 Exemple :</p>
<pre>&lt;img src="image.jpg" alt="image"&gt;</pre>
`;
}

// ================= JOUR 7 =================
else if(i === 7){
content = `
<h3>📘 Jour 7 : Listes</h3>

<p>🔵 Balises :</p>
<code>&lt;ul&gt;</code> <code>&lt;li&gt;</code>

<p>🟡 Explication :</p>
<p>Les listes servent à organiser les éléments.</p>

<p>🟢 Exemple :</p>
<pre>
&lt;ul&gt;
  &lt;li&gt;Pain&lt;/li&gt;
  &lt;li&gt;Lait&lt;/li&gt;
&lt;/ul&gt;
</pre>
`;
}

// ================= JOUR 8 =================
else if(i === 8){
content = `
<h3>📘 Jour 8 : Tableaux</h3>

<p>🔵 Balises :</p>
<code>&lt;table&gt;</code> <code>&lt;tr&gt;</code> <code>&lt;td&gt;</code>

<p>🟡 Explication :</p>
<p>Les tableaux servent à organiser les données.</p>

<p>🟢 Exemple :</p>
<pre>
&lt;table&gt;
  &lt;tr&gt;
    &lt;td&gt;Nom&lt;/td&gt;
  &lt;/tr&gt;
&lt;/table&gt;
</pre>
`;
}

// ================= JOUR 9 =================
else if(i === 9){
content = `
<h3>📘 Jour 9 : Div</h3>

<p>🔵 Balise :</p>
<code>&lt;div&gt;</code>

<p>🟡 Explication :</p>
<p>Div sert à regrouper des éléments.</p>

<p>🟢 Exemple :</p>
<pre>&lt;div&gt;Bloc de contenu&lt;/div&gt;</pre>
`;
}

// ================= JOUR 10 =================
else if(i === 10){
content = `
<h3>📘 Jour 10 : Formulaires</h3>

<p>🔵 Balise :</p>
<code>&lt;input&gt;</code>

<p>🟡 Explication :</p>
<p>Permet de saisir des informations.</p>

<p>🟢 Exemple :</p>
<pre>&lt;input type="text" placeholder="Nom"&gt;</pre>
`;
}

// ================= JOUR 11 =================
else if(i === 11){
content = `
<h3>📘 Jour 11 : Boutons</h3>

<p>🔵 Balise :</p>
<code>&lt;button&gt;</code>

<p>🟡 Explication :</p>
<p>Permet de cliquer pour une action.</p>

<p>🟢 Exemple :</p>
<pre>&lt;button&gt;Envoyer&lt;/button&gt;</pre>
`;
}

// ================= JOUR 12 =================
else if(i === 12){
content = `
<h3>📘 Jour 12 : Class & ID</h3>

<p>🔵 Attributs :</p>
<code>class</code> <code>id</code>

<p>🟡 Explication :</p>
<p>class = groupe / id = unique</p>

<p>🟢 Exemple :</p>
<pre>&lt;div class="box"&gt;&lt;/div&gt;</pre>
`;
}

// ================= JOUR 13 =================
else if(i === 13){
content = `
<h3>📘 Jour 13 : Header</h3>

<p>🔵 Balise :</p>
<code>&lt;header&gt;</code>

<p>🟡 Explication :</p>
<p>Partie haute du site (menu, logo).</p>

<p>🟢 Exemple :</p>
<pre>&lt;header&gt;Mon site&lt;/header&gt;</pre>
`;
}

// ================= JOUR 14 =================
else if(i === 14){
content = `
<h3>📘 Jour 14 : Footer</h3>

<p>🔵 Balise :</p>
<code>&lt;footer&gt;</code>

<p>🟡 Explication :</p>
<p>Partie basse du site.</p>

<p>🟢 Exemple :</p>
<pre>&lt;footer&gt;Copyright&lt;/footer&gt;</pre>
`;
}

// ================= JOUR 15 =================
else if(i === 15){
content = `
<h3>📘 Jour 15 : SEO</h3>

<p>🔵 Balises importantes :</p>
<code>&lt;h1&gt;</code> <code>&lt;title&gt;</code>

<p>🟡 Explication :</p>
<p>SEO aide ton site à apparaître sur Google.</p>
`;
}

// ================= JOUR 16 =================
else if(i === 16){
content = `
<h3>📘 Jour 16 : Structure complète</h3>

<p>🔵 Balises :</p>
<code>&lt;header&gt;</code>
<code>&lt;body&gt;</code>
<code>&lt;footer&gt;</code>

<p>🟡 Explication :</p>
<p>Une page web est toujours organisée en structure.</p>
`;
}

// ================= JOUR 17 =================
else if(i === 17){
content = `
<h3>📘 Jour 17 : Bonnes pratiques</h3>

<p>✔ Code propre</p>
<p>✔ Balises bien fermées</p>
<p>✔ Structure claire</p>
`;
}

// ================= JOUR 18 =================
else if(i === 18){
content = `
<h3>📘 Jour 18 : Mini projet</h3>

<p>Créer une page avec :</p>
<ul>
<li>Titre</li>
<li>Texte</li>
<li>Image</li>
</ul>
`;
}

// ================= JOUR 19 =================
else if(i === 19){
content = `
<h3>📘 Jour 19 : Projet intermédiaire</h3>

<p>Créer un petit site avec menu + contenu + image.</p>
`;
}

// ================= JOUR 20 =================
else if(i === 20){
content = `
<h3>📘 Jour 20 : Projet final</h3>

<p>🎯 Tu dois créer un site complet :</p>

<ul>
<li>Header</li>
<li>Pages</li>
<li>Images</li>
<li>Formulaire</li>
</ul>

<p>🔥 Félicitations, tu es débutant HTML confirmé !</p>
`;
}

}

lessons[i] = content;
}

// ================= AFFICHAGE =================
function loadLesson(){

dayText.innerText = "Jour " + currentDay;

// progression
let percent = Math.floor((currentDay / maxDay) * 100);
progressBar.style.width = percent + "%";

// contenu
lessonBox.innerHTML = lessons[currentDay];

}

// ================= NAVIGATION =================
window.nextLesson = ()=>{
if(currentDay < maxDay){
currentDay++;
localStorage.setItem("html_day", currentDay);
loadLesson();
}
};

window.prevLesson = ()=>{
if(currentDay > 1){
currentDay--;
loadLesson();
}
};

// ================= IA =================
window.askAI = async ()=>{

const input = document.getElementById("questionInput");
const responseBox = document.getElementById("aiResponse");

const text = input.value.trim();
if(!text) return;

responseBox.innerHTML = "⏳ Réponse...";

try{

const prompt = encodeURIComponent(`
Tu es un professeur HTML.

Tu dois répondre uniquement sur la leçon du jour (${currentDay}).

Explique clairement avec exemples simples.

Question :
${text}
`);

const res = await fetch(API_URL + "?prompt=" + prompt);
const data = await res.json();

const reply = data.result || data.response || "Erreur";

responseBox.innerHTML = reply;

}catch(e){
responseBox.innerHTML = "❌ Erreur serveur";
}

};

// ================= INIT =================
loadLesson();
