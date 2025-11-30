const startBtn = document.getElementById('startBtn');
const speedEl = document.getElementById('speed');
const statusEl = document.getElementById('status');
const latencyEl = document.getElementById('latency');
const detailsEl = document.getElementById('details');

const BASE_URL = 'https://speedtest-worker.gerboo676.workers.dev';

// Animate Mbps smoothly
function animateSpeed(el, target){
    let current = parseFloat(el.textContent) || 0;
    const step = target / 50;
    const interval = setInterval(() => {
        current += step;
        if(current >= target){
            current = target;
            clearInterval(interval);
        }
        el.textContent = current.toFixed(1) + ' Mbps';
    }, 20);
}

// Measure latency/ping
async function measurePing(){
    const attempts = 6;
    let total = 0;
    for(let i = 0; i < attempts; i++){
        const start = performance.now();
        await fetch(`${BASE_URL}/health`, {cache:'no-store', mode:'cors'});
        const end = performance.now();
        total += (end - start);
    }
    return total / attempts;
}

// Download test (real-time)
async function downloadTest(){
    const res = await fetch(`${BASE_URL}/download`, {cache:'no-store', mode:'cors'});
    const reader = res.body.getReader();
    let received = 0;
    const start = performance.now();

    while(true){
        const {done, value} = await reader.read();
        if(done) break;
        received += value.length;
        const seconds = (performance.now() - start) / 1000;
        const mbps = ((received * 8) / 1e6) / seconds;
        animateSpeed(speedEl, mbps);
    }

    return ((received * 8) / 1e6) / ((performance.now() - start)/1000);
}

// Start button click
startBtn.addEventListener('click', async () => {
    startBtn.disabled = true;
    statusEl.textContent = 'Running...';

    try {
        const ping = await measurePing();
        latencyEl.textContent = ping.toFixed(1) + ' ms';

        await downloadTest();

        detailsEl.classList.remove('hidden');
        statusEl.textContent = 'Done';
    } catch(e){
        console.error(e);
        statusEl.textContent = 'Error';
    }

    startBtn.disabled = false;
});
