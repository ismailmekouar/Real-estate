// --- Variables globales ---
let properties = [];
let month = 0;
let cash = 0;
let selectedProp = null;
let targetYield = 8; // minimum rendement pour évaluer risque
let targetESG = 70;

// --- Types d'immeubles ---
const propertyTypes = [
  {type:"Résidentiel", icon:"🏠"},
  {type:"Bureaux", icon:"🏢"},
  {type:"Commerce", icon:"🏬"},
  {type:"Hôtel", icon:"🏨"},
  {type:"Luxe", icon:"💎"}
];

// --- Événements réalistes ---
const events = [
  {name:"COVID", cashImpact:-0.15, esgImpact:-5, message:"⚠️ Pandémie mondiale !"},
  {name:"Hausse taux", cashImpact:-0.05, esgImpact:0, message:"📈 Taux d'intérêt en hausse."},
  {name:"Réforme verte", cashImpact:0, esgImpact:+10, message:"🌱 Réforme verte imposée."},
  {name:"Boom immobilier", cashImpact:+0.1, esgImpact:0, message:"💹 Marché immobilier en plein boom !"},
  {name:"Crise locale", cashImpact:-0.08, esgImpact:-3, message:"🌪️ Crise immobilière locale."},
  {name:"Subvention publique", cashImpact:+0.05, esgImpact:+5, message:"🏛️ Subvention gouvernementale reçue !"}
];

// --- Initialisation Leaflet ---
const map = L.map('map').setView([33.5731, -7.5898], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// --- Génération des immeubles ---
function generateProperties(n=25){
  properties = [];
  for(let i=0;i<n;i++){
    const pType = propertyTypes[Math.floor(Math.random()*propertyTypes.length)];
    const price = Math.floor(Math.random()*(50000000-10000000)+10000000);
    const rent = Math.floor(price*0.004 + Math.random()*10000);
    const esg = Math.floor(Math.random()*70 + 30);
    const lat = 33.55 + Math.random()*0.05;
    const lng = -7.65 + Math.random()*0.05;

    const prop = {id:i, type:pType.type, icon:pType.icon, price, rent, esg, lat, lng, owner:false, marker:null};

    prop.marker = L.marker([lat,lng], {title:pType.type}).addTo(map)
      .bindPopup(`${pType.icon} ${pType.type}<br>Prix: ${price.toLocaleString()} MAD<br>Loyer: ${rent.toLocaleString()} MAD<br>ESG: ${esg}`)
      .on('click',()=>openModal(prop));

    properties.push(prop);
  }
  updatePropertyList();
}

// --- Modal ---
const modal = document.getElementById('propModal');
const propDetails = document.getElementById('propDetails');

function openModal(prop){
  selectedProp = prop;
  propDetails.innerHTML = `
    <strong>${prop.icon} ${prop.type}</strong><br>
    Prix: ${prop.price.toLocaleString()} MAD<br>
    Loyer: ${prop.rent.toLocaleString()} MAD/mois<br>
    ESG: ${prop.esg}<br>
    Propriétaire: ${prop.owner?'Oui':'Non'}
  `;
  modal.classList.remove('hidden');
}

document.querySelector('.close').addEventListener('click',()=>modal.classList.add('hidden'));

// --- Actions immeuble ---
function buyProperty(p){
  if(!p.owner){
    if(cash>=p.price){
      cash -= p.price;
      p.owner = true;
      showNotification(`✅ Vous avez acheté ${p.type}`);
      updateDashboard();
    } else showNotification("❌ Pas assez de cash !");
  }
}

function sellProperty(p){
  if(p.owner){
    cash += p.price;
    p.owner = false;
    showNotification(`💰 Vous avez vendu ${p.type}`);
    updateDashboard();
  }
}

function renovateProperty(p){
  if(p.owner){
    if(p.esg<100){
      p.esg = Math.min(p.esg+10,100);
      showNotification(`🌱 ESG augmenté de 10 pour ${p.type}`);
      updateDashboard();
    } else showNotification("✅ ESG déjà maximal !");
  }
}

// --- Tableau de bord ---
function updateDashboard(){
  const owned = properties.filter(p=>p.owner);
  const patrimoine = owned.reduce((acc,p)=>acc+p.price,0);
  const totalRent = owned.reduce((acc,p)=>acc+p.rent,0);
  const avgYield = owned.length>0?Math.round(totalRent/patrimoine*100):0;
  const avgESG = owned.length>0?Math.round(owned.reduce((acc,p)=>acc+p.esg,0)/owned.length):0;
  const risk = avgYield<targetYield?'⚠️':'✔️';

  document.getElementById('month').innerText = month;
  document.getElementById('cash').innerText = cash.toLocaleString();
  document.getElementById('patrimoine').innerText = patrimoine.toLocaleString();
  document.getElementById('yield').innerText = avgYield+'%';
  document.getElementById('esg').innerText = avgESG;
  document.getElementById('risk').innerText = risk;

  updatePropertyList();
  localStorage.setItem('gameState',JSON.stringify({month,cash,properties}));
}

// --- Notifications ---
function showNotification(msg){
  const log = document.getElementById('eventList');
  log.innerHTML = msg;
  setTimeout(()=>{ log.innerHTML = '' }, 5000);
}

// --- Mois suivant ---
document.getElementById('nextMonthBtn').addEventListener('click',()=>{
  month++;
  properties.filter(p=>p.owner).forEach(p=>{
    const fluctuation = Math.floor(Math.random()*5000-2500);
    cash += p.rent + fluctuation;
  });

  if(Math.random()<0.5){
    const e = events[Math.floor(Math.random()*events.length)];
    cash += cash*e.cashImpact;
    properties.filter(p=>p.owner).forEach(p=>p.esg=Math.min(100,Math.max(0,p.esg+e.esgImpact)));
    showNotification(`⚡ ${e.message}`);
  } else showNotification('Aucun événement ce mois-ci.');

  updateDashboard();
});

// --- Modal Buttons ---
document.getElementById('buyBtn').addEventListener('click',()=>{ if(selectedProp) buyProperty(selectedProp); modal.classList.add('hidden'); });
document.getElementById('sellBtn').addEventListener('click',()=>{ if(selectedProp) sellProperty(selectedProp); modal.classList.add('hidden'); });
document.getElementById('renovBtn').addEventListener('click',()=>{ if(selectedProp) renovateProperty(selectedProp); modal.classList.add('hidden'); });

// --- Liste dynamique des immeubles ---
function updatePropertyList(){
  const panel = document.getElementById('propList');
  panel.innerHTML = '';
  const filter = document.getElementById('filterType')?.value || 'all';
  properties.forEach(p=>{
    if(filter==='all' || p.type===filter){
      const div = document.createElement('div');
      div.className = 'propItem';
      div.innerHTML = `${p.icon} ${p.type} — ${p.price.toLocaleString()} MAD — ESG: ${p.esg} — Loyer: ${p.rent.toLocaleString()} MAD`;
      div.addEventListener('click',()=>openModal(p));
      panel.appendChild(div);
    }
  });
}

// --- Nouvelle Partie ---
document.getElementById('newGameBtn')?.addEventListener('click',()=>{
  cash = Math.floor(Math.random()*(120000000-80000000)+80000000);
  month = 0;
  generateProperties(25);
  updateDashboard();
  showNotification("🆕 Nouvelle partie démarrée !");
});

// --- Chargement ---
function loadGame(){
  const state = JSON.parse(localStorage.getItem('gameState'));
  if(state){
    month = state.month;
    cash = state.cash;
    properties = state.properties;
    properties.forEach(p=>{
      p.marker = L.marker([p.lat,p.lng], {title:p.type}).addTo(map)
        .bindPopup(`${p.icon} ${p.type}<br>Prix: ${p.price.toLocaleString()} MAD<br>Loyer: ${p.rent.toLocaleString()} MAD<br>ESG: ${p.esg}`)
        .on('click',()=>openModal(p));
    });
  } else {
    cash = Math.floor(Math.random()*(120000000-80000000)+80000000);
    generateProperties(25);
  }
  updateDashboard();
}

loadGame();
