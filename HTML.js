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

if(i === 1){
content = `
<h3>📘 Jour 1 : Introduction HTML</h3>
<p><b>HTML</b> signifie HyperText Markup Language.</p>

<p>👉 C'est le langage utilisé pour créer la structure des sites web.</p>

<p>Exemple :</p>
<pre>
&lt;h1&gt;Bonjour&lt;/h1&gt;
</pre>

<p>👉 Résultat : un titre affiché</p>
`;
}

else if(i === 2){
content = `
<h3>📘 Jour 2 : Structure HTML</h3>

<p>Un document HTML contient :</p>

<pre>
&lt;html&gt;
&lt;head&gt;&lt;/head&gt;
&lt;body&gt;&lt;/body&gt;
&lt;/html&gt;
</pre>

<p>👉 body = contenu visible</p>
`;
}

else if(i === 3){
content = `
<h3>📘 Jour 3 : Les balises</h3>

<p>Les balises sont la base du HTML :</p>

<pre>
&lt;p&gt;Texte&lt;/p&gt;
</pre>

<p>👉 ouverture + fermeture</p>
`;
}

else if(i === 4){
content = `
<h3>📘 Jour 4 : Titres</h3>

<pre>
&lt;h1&gt;Titre&lt;/h1&gt;
&lt;h2&gt;Sous-titre&lt;/h2&gt;
</pre>

<p>👉 h1 = plus grand</p>
`;
}

else if(i === 5){
content = `
<h3>📘 Jour 5 : Paragraphes</h3>

<pre>
&lt;p&gt;Ceci est un texte&lt;/p&gt;
</pre>

<p>👉 utilisé pour écrire du contenu</p>
`;
}

else if(i === 6){
content = `
<h3>📘 Jour 6 : Images</h3>

<pre>
&lt;img src="image.jpg"&gt;
</pre>

<p>👉 afficher une image</p>
`;
}

else if(i === 7){
content = `
<h3>📘 Jour 7 : Liens</h3>

<pre>
&lt;a href="https://google.com"&gt;Aller&lt;/a&gt;
</pre>

<p>👉 permet de naviguer</p>
`;
}

else{
content = `
<h3>📘 Jour ${i}</h3>

<p>Tu continues ton apprentissage HTML.</p>

<p>👉 Aujourd’hui tu pratiques :</p>

<ul>
<li>Structure</li>
<li>Balises</li>
<li>Organisation du code</li>
</ul>

<p>💡 Conseil :</p>
<p>Code tous les jours pour progresser rapidement 🚀</p>
`;
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
Tu es un professeur HTML CSS JS.

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
