// --- Variables globales ---
let properties = [];
let month = 0;
let cash = 20000000;
let targetESG = 70;
let targetYield = 6;

const propertyTypes = [
  {type:"Résidentiel", icon:"🏠"},
  {type:"Bureaux", icon:"🏢"},
  {type:"Commerce", icon:"🏬"},
  {type:"Hôtel", icon:"🏨"}
];

const events = [
  {name:"COVID", cashImpact:-0.15, esgImpact:-5, message:"Pandémie mondiale !"},
  {name:"Hausse taux", cashImpact:-0.05, esgImpact:0, message:"Taux d'intérêt en hausse."},
  {name:"Réforme verte", cashImpact:0, esgImpact:+10, message:"Réforme verte imposée."},
  {name:"Boom immobilier", cashImpact:+0.1, esgImpact:0, message:"Marché immobilier en hausse !"}
];

// --- Initialisation Leaflet ---
const map = L.map('map').setView([33.5731, -7.5898], 13); // Casablanca
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// --- Génération des immeubles ---
function generateProperties(n=30){
  for(let i=0;i<n;i++){
    let pType = propertyTypes[Math.floor(Math.random()*propertyTypes.length)];
    let price = Math.floor(Math.random()*(8000000-1000000)+1000000);
    let rent = Math.floor(price*0.004 + Math.random()*5000);
    let esg = Math.floor(Math.random()*80 + 10);
    let lat = 33.55 + Math.random()*0.05;
    let lng = -7.65 + Math.random()*0.05;

    let prop = {
      id:i,
      type:pType.type,
      icon:pType.icon,
      price,
      rent,
      esg,
      lat,
      lng,
      owner:false,
      marker:null
    };

    prop.marker = L.marker([lat,lng], {
      title: pType.type
    }).addTo(map)
      .bindPopup(`${pType.icon} ${pType.type}<br>Prix: ${price} MAD<br>Loyer: ${rent} MAD<br>ESG: ${esg}`)
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
    <strong>${prop.icon} ${prop.type}</strong><br>
    Prix: ${prop.price.toLocaleString()} MAD<br>
    Loyer: ${prop.rent.toLocaleString()} MAD/mois<br>
    ESG: ${prop.esg}<br>
    Propriétaire: ${prop.owner?'Oui':'Non'}
  `;
  modal.classList.remove('hidden');
}

document.querySelector('.close').addEventListener('click',()=>modal.classList.add('hidden'));

// --- Actions ---
document.getElementById('buyBtn').addEventListener('click',()=>{
  if(selectedProp && !selectedProp.owner){
    if(cash>=selectedProp.price){
      cash -= selectedProp.price;
      selectedProp.owner = true;
      showNotification(`✅ Vous avez acheté ${selectedProp.type} !`);
      updateDashboard();
      modal.classList.add('hidden');
    } else showNotification("❌ Pas assez de cash !");
  }
});

document.getElementById('sellBtn').addEventListener('click',()=>{
  if(selectedProp && selectedProp.owner){
    cash += selectedProp.price;
    selectedProp.owner = false;
    showNotification(`💰 Vous avez vendu ${selectedProp.type}.`);
    updateDashboard();
    modal.classList.add('hidden');
  }
});

document.getElementById('renovBtn').addEventListener('click',()=>{
  if(selectedProp && selectedProp.owner){
    if(selectedProp.esg<100){
      selectedProp.esg = Math.min(selectedProp.esg+10, 100);
      showNotification(`🌱 ESG augmenté de 10 pour ${selectedProp.type}.`);
      updateDashboard();
      modal.classList.add('hidden');
    } else showNotification("✅ ESG déjà maximal !");
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
  document.getElementById('cash').innerText = cash.toLocaleString();
  document.getElementById('patrimoine').innerText = patrimoine.toLocaleString();
  document.getElementById('yield').innerText = avgYield+'%';
  document.getElementById('esg').innerText = avgESG;
  document.getElementById('risk').innerText = risk;

  // Sauvegarde locale
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
    let fluctuation = Math.floor(Math.random()*5000 - 2500);
    cash += p.rent + fluctuation;
  });

  // Événement aléatoire
  if(Math.random()<0.4){
    let e = events[Math.floor(Math.random()*events.length)];
    cash += cash*e.cashImpact;
    properties.filter(p=>p.owner).forEach(p=>p.esg+=e.esgImpact);
    showNotification(`⚡ ${e.message}`);
  } else showNotification('Aucun événement ce mois-ci.');

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
      p.marker = L.marker([p.lat,p.lng])
        .addTo(map)
        .bindPopup(`${p.type}<br>Prix: ${p.price.toLocaleString()} MAD<br>Loyer: ${p.rent.toLocaleString()} MAD<br>ESG: ${p.esg}`)
        .on('click',()=>openModal(p));
    });
  } else generateProperties();
  updateDashboard();
}

loadGame();
