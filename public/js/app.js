const startBtn = document.getElementById('startBtn');
const showMoreBtn = document.getElementById('showMore');

const speedEl = document.getElementById('speed');
const statusEl = document.getElementById('status');

const latencyEl = document.getElementById('latency');
const loadedLatencyEl = document.getElementById('loadedLatency');
const uploadEl = document.getElementById('upload');

const ipEl = document.getElementById('ip');
const serverEl = document.getElementById('server');

const detailsEl = document.getElementById('details');
const gauge = document.getElementById('gauge');

/* SPEEDOMETER */

const canvas = document.getElementById("speedometer");
const ctx = canvas.getContext("2d");

const centerX = canvas.width / 2;
const centerY = canvas.height;
const radius = 110;

function drawGauge(speed){

ctx.clearRect(0,0,canvas.width,canvas.height);

/* background arc */

ctx.beginPath();
ctx.arc(centerX,centerY,radius,Math.PI,0);
ctx.lineWidth = 12;
ctx.strokeStyle = "#1e293b";
ctx.stroke();

/* speed arc */

let percent = Math.min(speed/100,1);

ctx.beginPath();
ctx.arc(
centerX,
centerY,
radius,
Math.PI,
Math.PI + (Math.PI*percent)
);

ctx.lineWidth = 14;

ctx.shadowBlur = 20;
ctx.shadowColor = "#00f2ff";

ctx.strokeStyle = "#00f2ff";
ctx.stroke();

ctx.shadowBlur = 0;

}

/* API */

const BASE_URL = 'https://speedtest-worker.gerboo676.workers.dev';

let displayedSpeed = 0;

/* Smooth animation */

function animateSpeed(target){

displayedSpeed += (target - displayedSpeed) * 0.15;

if(displayedSpeed < 0) displayedSpeed = 0;

speedEl.textContent = displayedSpeed.toFixed(1) + " Mbps";

updateGauge(displayedSpeed);

drawGauge(displayedSpeed);

if(Math.abs(displayedSpeed - target) > 0.05){
requestAnimationFrame(()=>animateSpeed(target));
}else{
displayedSpeed = target;
}

}

/* Progress bar */

function updateGauge(speed){

let percent = Math.min(speed,100);

gauge.style.background =
`linear-gradient(90deg,
#00f2ff ${percent}%,
#1e293b ${percent}%)`;

}

/* Ping */

async function measurePing(){

const attempts = 6;
let total = 0;

for(let i=0;i<attempts;i++){

const start = performance.now();

await fetch(`${BASE_URL}/server/ping`,
{cache:'no-store',mode:'cors'});

const end = performance.now();

total += (end-start);

}

return total/attempts;

}

/* Download */

async function downloadTest(){

statusEl.textContent = "Testing download...";

const res = await fetch(`${BASE_URL}/download`,
{cache:'no-store',mode:'cors'});

const reader = res.body.getReader();

let received = 0;

const start = performance.now();

while(true){

const {done,value} = await reader.read();

if(done) break;

received += value.byteLength;

const seconds =
(performance.now()-start)/1000;

const mbps =
((received*8)/1e6)/seconds;

animateSpeed(mbps);

}

return ((received*8)/1e6) /
((performance.now()-start)/1000);

}

/* Upload */

async function uploadTest(){

statusEl.textContent = "Testing upload...";

const size = 1024*1024*5;

const data = new Uint8Array(size);

const start = performance.now();

await fetch(`${BASE_URL}/server/upload`,{
method:'POST',
body:data,
cache:'no-store',
mode:'cors'
});

const end = performance.now();

const mbps =
(size*8)/1e6/((end-start)/1000);

uploadEl.textContent =
mbps.toFixed(1)+" Mbps";

}

/* IP + ISP */

async function getServerInfo(){

try{

const res = await fetch("https://ipapi.co/json/");

const data = await res.json();

ipEl.textContent = data.ip || "Unknown";

serverEl.textContent =
`${data.city || "Unknown"} • ${data.org || "Unknown ISP"}`;

}catch(err){

console.error(err);

ipEl.textContent = "Unknown";
serverEl.textContent = "Unknown";

}

}

/* Start test */

startBtn.addEventListener("click",async()=>{

startBtn.disabled = true;

detailsEl.classList.add("hidden");

displayedSpeed = 0;

speedEl.textContent="0 Mbps";

statusEl.textContent="Preparing test...";

uploadEl.textContent="-- Mbps";
latencyEl.textContent="-- ms";
loadedLatencyEl.textContent="-- ms";

ipEl.textContent="Detecting...";
serverEl.textContent="Detecting...";

updateGauge(0);
drawGauge(0);

try{

const ping = await measurePing();

latencyEl.textContent =
ping.toFixed(1)+" ms";

await downloadTest();

loadedLatencyEl.textContent =
ping.toFixed(1)+" ms";

await uploadTest();

await getServerInfo();

detailsEl.classList.remove("hidden");

statusEl.textContent="Test complete";

}catch(err){

console.error(err);

statusEl.textContent=
"Connection failed. Please check your internet.";

}finally{

startBtn.disabled=false;

}

});

/* Show more */

showMoreBtn.addEventListener("click",()=>{

detailsEl.classList.toggle("hidden");

});

/* Draw empty gauge on load */

drawGauge(0);