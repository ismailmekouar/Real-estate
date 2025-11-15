// --- Variables globales ---
let properties = [];
let month = 0;
let cash = 20000000;
let targetESG = 70;
let targetYield = 6;

const propertyTypes = ["Résidentiel", "Bureaux"];
const events = [
  {name:"COVID", cashImpact:-0.1, esgImpact:-5},
  {name:"Hausse taux", cashImpact:-0.05, esgImpact:0},
  {name:"Réforme verte", cashImpact:0, esgImpact:+10}
];

// --- Initialisation Leaflet ---
const map = L.map('map').setView([33.5731, -7.5898], 13); // Casablanca
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// --- Génération des immeubles ---
function generateProperties(n=20) {
  for(let i=0;i<n;i++){
    let type = propertyTypes[Math.floor(Math.random()*propertyTypes.length)];
    let price = Math.floor(Math.random()*(5000000-1000000)+1000000);
    let rent = Math.floor(price*0.005);
    let esg = Math.floor(Math.random()*100);
    let lat = 33.55 + Math.random()*0.05;
    let lng = -7.65 + Math.random()*0.05;

    let prop = {id:i,type,price,rent,esg,lat,lng,owner:false,marker:null};
    prop.marker = L.marker([lat,lng]).addTo(map)
      .bindPopup(`${type}<br>Prix: ${price} MAD<br>Loyer: ${rent} MAD<br>ESG: ${esg}`)
      .on('click',()=>openModal(prop));
    properties.push(prop);
  }
}

// --- Modal ---
const modal = document.getElementById('propModal');
const propDetails = document.getElementById('propDetails');
let selectedProp = null;

function openModal(prop){
  selectedProp = prop;
  propDetails.innerHTML = `
    <strong>${prop.type}</strong><br>
    Prix: ${prop.price} MAD<br>
    Loyer: ${prop.rent} MAD/mois<br>
    ESG: ${prop.esg}<br>
    Propriétaire: ${prop.owner?'Oui':'Non'}
  `;
  modal.classList.remove('hidden');
}

document.querySelector('.close').addEventListener('click',()=>{modal.classList.add('hidden');});

// --- Actions ---
document.getElementById('buyBtn').addEventListener('click',()=>{
  if(selectedProp && !selectedProp.owner && cash>=selectedProp.price){
    cash -= selectedProp.price;
    selectedProp.owner = true;
    updateDashboard();
    modal.classList.add('hidden');
  } else alert("Pas assez de cash ou déjà acheté !");
});

document.getElementById('sellBtn').addEventListener('click',()=>{
  if(selectedProp && selectedProp.owner){
    cash += selectedProp.price;
    selectedProp.owner = false;
    updateDashboard();
    modal.classList.add('hidden');
  }
});

document.getElementById('renovBtn').addEventListener('click',()=>{
  if(selectedProp && selectedProp.owner){
    selectedProp.esg += 5;
    updateDashboard();
    modal.classList.add('hidden');
  }
});

// --- Tableau de bord ---
function updateDashboard(){
  const owned = properties.filter(p=>p.owner);
  const patrimoine = owned.reduce((acc,p)=>acc+p.price,0);
  const totalRent = owned.reduce((acc,p)=>acc+p.rent,0);
  const avgYield = owned.length>0?Math.round(totalRent/patrimoine*100):0;
  const avgESG = owned.length>0?Math.round(owned.reduce((acc,p)=>acc+p.esg,0)/owned.length):0;
  const risk = avgYield<targetYield?'⚠️':'✔️';

  document.getElementById('month').innerText = month;
  document.getElementById('cash').innerText = cash;
  document.getElementById('patrimoine').innerText = patrimoine;
  document.getElementById('yield').innerText = avgYield+'%';
  document.getElementById('esg').innerText = avgESG;
  document.getElementById('risk').innerText = risk;

  // Sauvegarde locale
  localStorage.setItem('gameState',JSON.stringify({month,cash,properties}));
}

// --- Mois suivant ---
document.getElementById('nextMonthBtn').addEventListener('click',()=>{
  month++;
  // Collecte des loyers
  properties.filter(p=>p.owner).forEach(p=>cash+=p.rent);
  // Événement aléatoire
  if(Math.random()<0.3){
    let e = events[Math.floor(Math.random()*events.length)];
    cash += cash*e.cashImpact;
    properties.filter(p=>p.owner).forEach(p=>p.esg+=e.esgImpact);
    document.getElementById('eventList').innerHTML = `Événement: ${e.name}`;
  } else document.getElementById('eventList').innerHTML = 'Aucun événement';
  updateDashboard();
});

// --- Paramètres ---
document.getElementById('applySettings').addEventListener('click',()=>{
  cash = parseInt(document.getElementById('startCash').value);
  targetESG = parseInt(document.getElementById('targetESG').value);
  targetYield = parseInt(document.getElementById('targetYield').value);
  updateDashboard();
});

// --- Filtre immeubles ---
document.getElementById('filterType').addEventListener('change',(e)=>{
  const val = e.target.value;
  properties.forEach(p=>{
    if(val==='all' || p.type===val) p.marker.addTo(map);
    else map.removeLayer(p.marker);
  });
});

// --- Chargement ---
function loadGame(){
  const state = JSON.parse(localStorage.getItem('gameState'));
  if(state){
    month = state.month; cash = state.cash;
    properties = state.properties;
    properties.forEach(p=>{
      p.marker = L.marker([p.lat,p.lng]).addTo(map)
        .bindPopup(`${p.type}<br>Prix: ${p.price} MAD<br>Loyer: ${p.rent} MAD<br>ESG: ${p.esg}`)
        .on('click',()=>openModal(p));
    });
  } else generateProperties();
  updateDashboard();
}

loadGame();

