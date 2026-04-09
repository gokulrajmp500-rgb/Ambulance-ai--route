let map = L.map('map').setView([11.6643,78.1460],13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
maxZoom:19
}).addTo(map);

let ambulanceMarker;
let routeLine;

let hospitals = [
{name:"GH Salem",lat:11.6643,lng:78.1460},
{name:"SKS Hospital",lat:11.6780,lng:78.1500},
{name:"VIMS Hospital",lat:11.6500,lng:78.1200}
];

let sortedHospitals=[];
let selectedIndex = 0;
let currentLat,currentLng;
let hospitalReached=false;

navigator.geolocation.watchPosition(pos=>{
currentLat = pos.coords.latitude;
currentLng = pos.coords.longitude;

if(!ambulanceMarker){
ambulanceMarker = L.marker([currentLat,currentLng])
.addTo(map).bindPopup("Ambulance").openPopup();
}else{
ambulanceMarker.setLatLng([currentLat,currentLng]);
}

map.setView([currentLat,currentLng],13);

checkHospitalReached();
});

function startEmergency(){
sortHospitalsByDistance();
selectedIndex = 0;
sendHospitalRequest();
}

function sortHospitalsByDistance(){
sortedHospitals = hospitals.sort((a,b)=>{
let d1 = getDistance(currentLat,currentLng,a.lat,a.lng);
let d2 = getDistance(currentLat,currentLng,b.lat,b.lng);
return d1-d2;
});
}

function sendHospitalRequest(){

if(selectedIndex >= sortedHospitals.length){
document.getElementById("status").innerText =
"No hospital available — expanding search radius";
return;
}

let h = sortedHospitals[selectedIndex];

document.getElementById("status").innerText =
"Request sent to "+h.name+" waiting until ambulance reaches hospital";

drawRoute(h.lat,h.lng);
}

function drawRoute(lat,lng){

fetch(`https://router.project-osrm.org/route/v1/driving/${currentLng},${currentLat};${lng},${lat}?overview=full&geometries=geojson`)
.then(res=>res.json())
.then(data=>{

let route = data.routes[0].geometry;

if(routeLine){
map.removeLayer(routeLine);
}

routeLine = L.geoJSON(route).addTo(map);

let eta = data.routes[0].duration/60;

document.getElementById("eta").innerText =
"ETA: "+eta.toFixed(2)+" minutes";

});
}

function checkHospitalReached(){

if(!sortedHospitals.length) return;

let h = sortedHospitals[selectedIndex];

let distance = getDistance(currentLat,currentLng,h.lat,h.lng);

if(distance < 0.2 && !hospitalReached){ // 200 meters
hospitalReached = true;
hospitalAccept();
}
}

function hospitalAccept(){
let h = sortedHospitals[selectedIndex];

document.getElementById("status").innerText =
h.name+" ACCEPTED — Bed allocated & emergency team ready";
}

function rejectHospital(){
selectedIndex++;
hospitalReached=false;

document.getElementById("status").innerText =
"Trying next nearest hospital...";

sendHospitalRequest();
}

function getDistance(lat1,lon1,lat2,lon2){
let R = 6371;
let dLat = (lat2-lat1)*Math.PI/180;
let dLon = (lon2-lon1)*Math.PI/180;

let a =
Math.sin(dLat/2)*Math.sin(dLat/2)+
Math.cos(lat1*Math.PI/180)*
Math.cos(lat2*Math.PI/180)*
Math.sin(dLon/2)*Math.sin(dLon/2);

let c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));

return R*c;
}