// -------- Global Variables --------
let map; // This will hold the map object
const markers = []; // This will store all alert markers

// -------- Login function --------
function login() {
  const user = document.getElementById('userid').value;
  const pass = document.getElementById('password').value;

  if (user === 'police' && pass === '1234') {
    // Hide login and show dashboard
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    
    // Initialize the map *after* the dashboard is visible
    initMap();
    
    // Connect to the backend
    connectToSocket();
  } else {
    // Use a non-blocking custom alert box if possible, but 'alert' is simple
    alert('Wrong ID or password!');
  }
}

// -------- Initialize Map function --------
function initMap() {
  // Start map centered on India, zoomed out
  map = L.map('map').setView([20.5937, 78.9629], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
}

// -------- Real-time alert handling --------
function connectToSocket() {
  // Connect to your NEW, REAL, live backend server
  const socket = io('https://womensafety-2ige.onrender.com');

  const alertsDiv = document.getElementById('alerts');
  alertsDiv.innerHTML = ''; // Clear "Waiting for alerts..."

  // THIS IS THE FIX: Listen for the specific events from your Python server
  socket.on('new_sos_alert', (alert) => {
    displayAlert(alert, true); // This is an SOS alert
  });

  socket.on('new_camera_alert', (alert) => {
    displayAlert(alert, true); // This is a Camera alert
  });
  
  // You can also add login logic from your main.py
  // socket.emit('officer_login', { name: "Police User" });
}

// -------- Display Alert function --------
function displayAlert(alert, isNewAlert = false) {
  const alertsDiv = document.getElementById('alerts');
  const alertBox = document.createElement('div');
  let htmlContent = '';
  let alertSeverity = 'normal';

  // 1. Check for media snippet
  let mediaLink = '';
  if (alert.snippetUrl) {
    mediaLink = `<a href="${alert.snippetUrl}" target="_blank">View Snippet (Video/Photo)</a><br>`;
  }

  // 2. Check Alert Type (based on your Python code)
  if (alert.type === 'sos') {
    // It's an SOS Alert
    alertSeverity = 'high';
    htmlContent = `
      <strong>Type:</strong> 🚨 SOS APP ALERT 🚨<br>
      <strong>Location:</strong> ${alert.location || 'Unknown'}<br>
      <strong>Battery:</strong> ${alert.battery || 'N/A'}<br>
      ${mediaLink}
    `;
  } else if (alert.type === 'camera') {
    // It's a Camera Alert
    alertSeverity = alert.severity ? alert.severity.toLowerCase() : 'normal';
    htmlContent = `
      <strong>Type:</strong> ${alert.type || 'Camera Alert'}<br>
      <strong>Place:</strong> ${alert.place || 'Unknown'}<br>
      <strong>Monitor:</strong> ${alert.location_monitor || 'N/A'}<br>
      <strong>Severity:</strong> ${alert.severity || 'Normal'}<br>
      ${mediaLink}
    `;
  }

  // Set class for styling
  alertBox.className = `alert-box ${alertSeverity}`;
  alertBox.innerHTML = htmlContent;
  alertsDiv.prepend(alertBox);

  // 3. Add Map Marker
  if (alert.latitude && alert.longitude) {
    let popupText = alert.location || alert.place;
    const marker = L.marker([alert.latitude, alert.longitude]).addTo(map)
      .bindPopup(`<b>${popupText}</b>`);
    
    markers.push(marker);
    
    // If it's a brand new alert, fly to its location
    if (isNewAlert) {
      map.flyTo([alert.latitude, alert.longitude], 16); // Zoom in close
      marker.openPopup();
    }
  }
}
