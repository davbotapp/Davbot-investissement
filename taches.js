import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔥 CONFIG
const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "starlink-investit.firebaseapp.com",
    databaseURL: "https://starlink-investit-default-rtdb.firebaseio.com",
    projectId: "starlink-investit"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 👤 USER
const user = localStorage.getItem("userPhone");
if(!user){
    alert("Connexion requise");
    location.href = "index.html";
}

// ===== CONFIG G3 (POINTS) =====
const G3 = {
  probabilities: { lose: 0.55, small: 0.25, big: 0.16, jackpot: 0.04 },
  rewards: { lose: 0, small: 2000, big: 8000, jackpot: 125000 }, // points
  maxDailyPoints: 25000 // limite intelligente
};

// ===== MEMORY GAME =====
const VALUES='AABBCCDDEEFFGGHHIIJJKKLL'.split('');
let flipped=[],matched=[],locked=false,time=25,interval,score=0;

const board=document.getElementById("board"),
statusEl=document.getElementById("status"),
timerEl=document.getElementById("timer"),
scoreEl=document.getElementById("score");

function shuffle(a){
for(let i=a.length-1;i>0;i--){
const j=Math.floor(Math.random()*(i+1));
[a[i],a[j]]=[a[j],a[i]];
}
return a;
}

function createBoard(){
shuffle([...VALUES]).forEach(v=>{
const c=document.createElement("div");
c.className="card";
c.dataset.value=v;
c.onclick=()=>flip(c);
board.appendChild(c);
});
startTimer();
}

function flip(card){
if(locked||card.classList.contains("flipped")||card.classList.contains("matched")) return;

locked=true;
card.classList.add("flipped");
card.textContent=card.dataset.value;
flipped.push(card);

if(flipped.length===2){
setTimeout(checkMatch,600);
}else{
locked=false;
}
}

function checkMatch(){
const[a,b]=flipped;

if(a.dataset.value===b.dataset.value){
a.classList.add("matched");
b.classList.add("matched");
matched.push(a,b);
score+=100;
}else{
[a,b].forEach(c=>{
c.classList.remove("flipped");
c.textContent="";
});
}

flipped=[];
locked=false;
scoreEl.textContent="Score : "+score;

if(matched.length===VALUES.length){
endGame();
}
}

function startTimer(){
timerEl.textContent="Temps : 0:"+time;

interval=setInterval(()=>{
time--;
timerEl.textContent="Temps : 0:"+(time<10?"0"+time:time);

if(time<=0) endGame();

},1000);
}

// 🎯 PROBABILITÉ INTELLIGENTE
function smartGain(data){

let r=Math.random()*100;
let gain=0;

if(r<55) gain=0;
else if(r<80) gain=G3.rewards.small;
else if(r<96) gain=G3.rewards.big;
else gain=G3.rewards.jackpot;

// 🔒 limite utilisateur
if((data.todayGain||0)>=G3.maxDailyPoints){
gain=0;
}

// 🧠 réduction si trop riche
if((data.points||0)>200000){
gain=Math.floor(gain*0.3);
}

// 💀 anti abus
if((data.totalPlayed||0)>50){
gain=0;
}

// 🎮 bonus performance (score)
gain += Math.floor(score * 5);

return gain;
}

// 🚀 FIN JEU
async function endGame(){

clearInterval(interval);

// 🔥 récupérer user Firebase
const snap = await get(ref(db,"users/"+user));
if(!snap.exists()) return;

const data = snap.val();

// 🔐 vérifier jeton
if(!data.tokenG3 || Date.now()>data.tokenG3.expire){
alert("Jeton expiré");
location.href="taches.html";
return;
}

// ⛔ 1 fois / jour
const today = new Date().toDateString();
if(data.memoryDate===today){
alert("Déjà joué aujourd'hui");
location.href="taches.html";
return;
}

// 🎯 calcul gain
let gain = smartGain(data);

// 💾 update Firebase
await update(ref(db,"users/"+user),{
points:(data.points||0)+gain,
todayGain:(data.todayGain||0)+gain,
memoryDate:today,
totalPlayed:(data.totalPlayed||0)+1
});

// 🎉 affichage
statusEl.textContent =
gain>0 ? "🎉 +" + gain + " points" : "❌ Aucun gain";

// 🔙 retour
setTimeout(()=>{
location.href="taches.html";
},3000);
}

// START
createBoard();
    
