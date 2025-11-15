// ==== INIT ====
let month = 0;
let cash = 20000000;
let properties = [];
let eventsLog = [];
let targetESG = 70;
let targetYield = 6;

// Charger sauvegarde si elle existe
if (localStorage.getItem("gameData")) {
  const data = JSON.parse(localStorage.getItem("gameData"));
  month = data.month;
  cash = data.cash;
  properties = data.properties;
  eventsLog = data.eventsLog;
  targetESG = data.targetESG;
  targetYield = data.targetYield;
}

// ==== MAP ====
const map = L.map('map').setView([33.5731, -7.5898], 13); // Casablanca
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// ==== GENERATION DES IMMEUBLES ====
function generateProperties() {
  if (properties.length > 0) return; // Déjà généré

  const types = ["Résidentiel", "Bureaux"];
  for (let i = 0; i < 20; i++) {
    let type = types[Math.floor(Math.random() * types.length)];
    let price = Math.floor(Math.random() * 10000000) + 5000000;
    let rent = Math.floor(price * (0.04 + Math.random() * 0.04)); // 4-8%
    let esg = Math.floor(Math.random() * 100);
    let lat = 33.55 + Math.random() * 0.05;
    let lng = -7.63 + Math.random() * 0.08;

    let prop = {
      id: i,
      type,
      price,
      rent,
      esg,
      owner: false,
      lat,
      lng
    };
    properties.push(prop);
  }
}
generateProperties();

// ==== AFFICHAGE DES IMMEUBLES SUR LA CARTE ====
function renderProperties() {
  map.eachLayer((layer) => {
    if (layer.options && layer.options.pane === 'markerPane') map.removeLayer(layer);
  });

  properties.forEach(prop => {
    let color = prop.owner ? "green" : "blue";
    const marker = L.circleMarker([prop.lat, prop.lng], { color }).addTo(map);
    marker.on('click', () => openPropertyModal(prop));
  });
}

// ==== TABLEAU DE BORD ====
function updateDashboard() {
  let patrimoine = properties.filter(p => p.owner).reduce((acc, p) => acc + p.price, 0);
  let totalRent = properties.filter(p => p.owner).reduce((acc, p) => acc + p.rent, 0);
  let avgYield = patrimoine ? (totalRent / patrimoine * 100).toFixed(2) : 0;
  let avgESG = properties.filter(p => p.owner).length ?
    Math.floor(properties.filter(p => p.owner).reduce((acc, p) => acc + p.esg, 0) / properties.filter(p => p.owner).length)
    : 0;
  let risk = avgESG >= targetESG && avgYield >= targetYield ? "Faible" : "Élevé";

  document.getElementById("month").innerText = month;
  document.getElementById("cash").innerText = cash.toLocaleString();
  document.getElementById("patrimoine").innerText = patrimoine.toLocaleString();
  document.getElementById("yield").innerText = avgYield + "%";
  document.getElementById("esg").innerText = avgESG;
  document.getElementById("risk").innerText = risk;
}

// ==== MODAL IMMEUBLE ====
let currentProp = null;
function openPropertyModal(prop) {
  currentProp = prop;
  const modal = document.getElementById("propModal");
  const details = document.getElementById("propDetails");
  details.innerHTML = `
    <p>Type : ${prop.type}</p>
    <p>Prix : ${prop.price.toLocaleString()} MAD</p>
    <p>Loyer : ${prop.rent.toLocaleString()} MAD</p>
    <p>ESG : ${prop.esg}</p>
    <p>Propriétaire : ${prop.owner ? "Vous" : "Libre"}</p>
  `;
  modal.classList.remove("hidden");
}

document.querySelector(".close").addEventListener("click", () => {
  document.getElementById("propModal").classList.add("hidden");
});

// ==== ACTIONS ====
document.getElementById("buyBtn").addEventListener("click", () => {
  if (!currentProp.owner && cash >= currentProp.price) {
    cash -= currentProp.price;
    currentProp.owner = true;
    renderProperties();
    updateDashboard();
    saveGame();
  } else {
    alert("Pas assez de cash ou déjà possédé !");
  }
});

document.getElementById("sellBtn").addEventListener("click", () => {
  if (currentProp.owner) {
    cash += currentProp.price;
    currentProp.owner = false;
    renderProperties();
    updateDashboard();
    saveGame();
  } else {
    alert("Vous ne possédez pas cet immeuble !");
  }
});

document.getElementById("renovBtn").addEventListener("click", () => {
  if (currentProp.owner) {
    currentProp.esg = Math.min(100, currentProp.esg + 10);
    updateDashboard();
    saveGame();
  } else {
    alert("Vous devez posséder cet immeuble pour le rénover !");
  }
});

// ==== MOIS SUIVANT ET EVENEMENTS ====
document.getElementById("nextMonthBtn").addEventListener("click", () => {
  month++;
  triggerRandomEvent();
  updateDashboard();
  saveGame();
});

function triggerRandomEvent() {
  const events = [
    { name: "COVID", effect: () => properties.forEach(p => p.rent *= 0.9) },
    { name: "Hausse des taux", effect: () => properties.forEach(p => p.price *= 0.95) },
    { name: "Réforme verte", effect: () => properties.forEach(p => p.esg = Math.min(100, p.esg + 5)) },
    { name: "Boom immobilier", effect: () => properties.forEach(p => p.price *= 1.05) }
  ];
  if (Math.random() < 0.5) { // 50% chance d'événement
    const ev = events[Math.floor(Math.random() * events.length)];
    ev.effect();
    eventsLog.push(`Mois ${month}: ${ev.name}`);
    document.getElementById("eventList").innerHTML = eventsLog.join("<br>");
  }
}

// ==== FILTRE PROPRIETES ====
document.getElementById("filterType").addEventListener("change", (e) => {
  const type = e.target.value;
  const list = document.getElementById("propList");
  list.innerHTML = "";
  properties
    .filter(p => type === "all" || p.type === type)
    .forEach(p => {
      const div = document.createElement("div");
      div.innerHTML = `${p.type} - ${p.price.toLocaleString()} MAD <button onclick="openPropertyModal(properties[${p.id}])">✖</button>`;
      list.appendChild(div);
    });
});

// ==== PARAMETRES RAPIDES ====
document.getElementById("applySettings").addEventListener("click", () => {
  cash = parseInt(document.getElementById("startCash").value);
  targetESG = parseInt(document.getElementById("targetESG").value);
  targetYield = parseInt(document.getElementById("targetYield").value);
  updateDashboard();
  saveGame();
});

// ==== SAUVEGARDE ====
function saveGame() {
  localStorage.setItem("gameData", JSON.stringify({ month, cash, properties, eventsLog, targetESG, targetYield }));
}

// ==== INITIALISATION ====
renderProperties();
updateDashboard();
