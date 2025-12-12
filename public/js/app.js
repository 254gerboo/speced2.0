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

const BASE_URL = 'https://speedtest-worker.gerboo676.workers.dev';

// Animate Mbps smoothly
function animateSpeed(el, target) {
    let current = parseFloat(el.textContent) || 0;
    const step = target / 50;

    const interval = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(interval);
        }
        el.textContent = current.toFixed(1) + ' Mbps';
        updateGaugeColor(current);
    }, 20);
}

// Set gauge color based on speed
function updateGaugeColor(speed) {
    if (speed < 5) gauge.style.backgroundColor = "#ff3b30";   // red
    else if (speed < 15) gauge.style.backgroundColor = "#ff9500";   // orange
    else if (speed < 30) gauge.style.backgroundColor = "#ffcc00";   // yellow
    else if (speed < 60) gauge.style.backgroundColor = "#4cd964";   // light green
    else gauge.style.backgroundColor = "#34c759";   // green
}

// Measure latency
async function measurePing() {
    const attempts = 6;
    let total = 0;

    for (let i = 0; i < attempts; i++) {
        const start = performance.now();
        await fetch(`${BASE_URL}/server/ping`, { cache: 'no-store', mode: 'cors' });
        const end = performance.now();
        total += (end - start);
    }

    return total / attempts;
}

// Download test
async function downloadTest() {
    const res = await fetch(`${BASE_URL}/download`, { cache: 'no-store', mode: 'cors' });
    const reader = res.body.getReader();
    let received = 0;
    const start = performance.now();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        received += value.length;
        const seconds = (performance.now() - start) / 1000;
        const mbps = ((received * 8) / 1e6) / seconds;

        animateSpeed(speedEl, mbps);
    }

    return ((received * 8) / 1e6) / ((performance.now() - start) / 1000);
}

// Upload test
async function uploadTest() {
    const size = 1024 * 1024 * 5; // 5 MB
    const data = new Uint8Array(size);

    const start = performance.now();
    await fetch(`${BASE_URL}/server/upload`, {
        method: 'POST',
        body: data,
        cache: 'no-store',
        mode: 'cors'
    });
    const end = performance.now();

    const mbps = (size * 8) / 1e6 / ((end - start) / 1000);
    uploadEl.textContent = mbps.toFixed(1) + ' Mbps';
}

// Get IP & nearest server info
async function getServerInfo() {
    try {
        const res = await fetch('https://ip-api.com/json/');
        const data = await res.json();
        ipEl.textContent = data.query || 'Unknown IP';
        serverEl.textContent = `${data.city || 'Unknown City'} • ${data.isp || 'Unknown ISP'}`;
    } catch (err) {
        console.error('Failed to get server info', err);
        ipEl.textContent = 'Unknown';
        serverEl.textContent = 'Unknown';
    }
}

// Start button click
startBtn.addEventListener('click', async () => {
    startBtn.disabled = true;
    statusEl.textContent = 'Running...';
    speedEl.textContent = '0 Mbps';
    loadedLatencyEl.textContent = '-- ms';
    uploadEl.textContent = '-- Mbps';
    updateGaugeColor(0);

    try {
        const ping = await measurePing();
        latencyEl.textContent = ping.toFixed(1) + ' ms';

        await downloadTest();
        loadedLatencyEl.textContent = ping.toFixed(1) + ' ms';

        await uploadTest();

        await getServerInfo(); // fetch IP and server info

        detailsEl.classList.remove('hidden');
        statusEl.textContent = 'Done';
    } catch (err) {
        console.error(err);
        statusEl.textContent = 'could not connect to the server. plese connect to the internet and try again';
    } finally {
        startBtn.disabled = false;
    }
});

// Show More button
showMoreBtn.addEventListener('click', () => {
    detailsEl.classList.toggle('hidden');
});
// Snow generator
function createSnowflake() {
    const snow = document.createElement('div');
    snow.className = 'snowflake';
    snow.textContent = '❄'; // Unicode snowflake
    snow.style.left = Math.random() * window.innerWidth + 'px';
    snow.style.fontSize = (10 + Math.random() * 20) + 'px';
    snow.style.animationDuration = (5 + Math.random() * 5) + 's';
    snow.style.opacity = Math.random();
    document.getElementById('snow').appendChild(snow);

    // Remove snowflake after animation
    setTimeout(() => snow.remove(), 10000);
}

// Generate snow every 200ms
setInterval(createSnowflake, 200);
