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

// Smooth animation only for UI
function animateSpeed(el, mbps) {
    el.textContent = mbps.toFixed(1) + ' Mbps';
}

// Gauge color
function updateGaugeColor(speed) {
    if (speed < 5) gauge.style.backgroundColor = "#ff3b30";
    else if (speed < 15) gauge.style.backgroundColor = "#ff9500";
    else if (speed < 30) gauge.style.backgroundColor = "#ffcc00";
    else if (speed < 60) gauge.style.backgroundColor = "#4cd964";
    else gauge.style.backgroundColor = "#34c759";
}

// More accurate latency
async function measurePing() {
    let samples = [];

    for (let i = 0; i < 8; i++) {
        let start = performance.now();
        await fetch(`${BASE_URL}/server/ping`, { cache: 'no-store' });
        samples.push(performance.now() - start);
    }

    samples.sort();
    samples = samples.slice(2, 6); // remove highest & lowest outliers

    return samples.reduce((a, b) => a + b) / samples.length;
}

// Parallel download like Fast.com
async function downloadTest() {
    const connections = 4;
    const testDuration = 6000; // 6 seconds
    const fileURL = `${BASE_URL}/download`;

    let totalBytes = 0;
    let stop = false;

    setTimeout(() => stop = true, testDuration);

    async function downloadStream() {
        while (!stop) {
            let res = await fetch(fileURL, { cache: 'no-store' });
            let reader = res.body.getReader();

            while (true) {
                const { done, value } = await reader.read();
                if (done || stop) break;

                totalBytes += value.length;
            }
        }
    }

    const start = performance.now();
    await Promise.all(new Array(connections).fill(0).map(downloadStream));
    const end = performance.now();

    const seconds = (end - start) / 1000;
    const mbps = (totalBytes * 8) / 1e6 / seconds;

    return mbps;
}

// Larger upload for accuracy
async function uploadTest() {
    const size = 25 * 1024 * 1024; // 25MB
    const data = new Uint8Array(size);

    let start = performance.now();
    await fetch(`${BASE_URL}/server/upload`, {
        method: "POST",
        body: data,
        cache: "no-store"
    });
    let end = performance.now();

    return (size * 8) / 1e6 / ((end - start) / 1000);
}

// IP info
async function getServerInfo() {
    const res = await fetch("https://ip-api.com/json/");
    const data = await res.json();
    ipEl.textContent = data.query || "Unknown";
    serverEl.textContent = `${data.city || '-'} • ${data.isp || '-'}`;
}

// START TEST
startBtn.addEventListener("click", async () => {
    startBtn.disabled = true;
    statusEl.textContent = "Running...";
    speedEl.textContent = "0 Mbps";
    updateGaugeColor(0);

    try {
        const ping = await measurePing();
        latencyEl.textContent = ping.toFixed(1) + " ms";

        const downloadMbps = await downloadTest();
        animateSpeed(speedEl, downloadMbps);
        updateGaugeColor(downloadMbps);

        loadedLatencyEl.textContent = ping.toFixed(1) + " ms";

        const uploadMbps = await uploadTest();
        uploadEl.textContent = uploadMbps.toFixed(1) + " Mbps";

        await getServerInfo();

        detailsEl.classList.remove("hidden");
        statusEl.textContent = "Done";
    } catch (err) {
        statusEl.textContent = "Error: Could not connect,connect to the internet and try again.";
        console.error(err);
    }

    startBtn.disabled = false;
});

// toggle more info
showMoreBtn.addEventListener('click', () => {
    detailsEl.classList.toggle('hidden');
});
