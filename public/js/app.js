const startBtn = document.getElementById('startBtn');
const showMoreBtn = document.getElementById('showMore');
const speedEl = document.getElementById('speed');
const statusEl = document.getElementById('status');
const latencyEl = document.getElementById('latency');
const loadedLatencyEl = document.getElementById('loadedLatency');
const uploadEl = document.getElementById('upload');
const detailsEl = document.getElementById('details');

function animateSpeed(resultEl, targetSpeed){
    let current = 0;
    const step = targetSpeed / 50; // adjust smoothness
    const interval = setInterval(()=>{
        current += step;
        if(current >= targetSpeed){
            current = targetSpeed;
            clearInterval(interval);
        }
        resultEl.textContent = current.toFixed(1)+' Mbps';
    }, 20); // adjust speed of counting
}

async function measurePing(url){
  const attempts = 6;
  let total = 0;
  for(let i=0;i<attempts;i++){
    const t0 = performance.now();
    await fetch(url + '&_=' + Date.now(), {cache: 'no-store'});
    const t1 = performance.now();
    total += (t1 - t0);
  }
  return total / attempts;
}

async function downloadTest(url){
  const res = await fetch(url, {cache: 'no-store'});
  const reader = res.body.getReader();
  const start = performance.now();
  let received = 0;
  while(true){
    const {done, value} = await reader.read();
    if(done) break;
    received += value.length;
    const seconds = (performance.now() - start) / 1000;
    const mbps = ((received * 8) / 1e6) / seconds;
    animateSpeed(speedEl, mbps);
  }
  const seconds = (performance.now() - start) / 1000;
  return ((received * 8) / 1e6) / seconds;
}

async function uploadTest(url, sizeMB){
  const chunk = new Uint8Array(1024*1024);
  const parts = [];
  for(let i=0;i<sizeMB;i++) parts.push(chunk);
  const body = new Blob(parts);

  const start = performance.now();
  const resp = await fetch(url, {method:'POST', body});
  const seconds = (performance.now() - start)/1000;
  return ((body.size * 8)/1e6)/seconds;
}

startBtn.addEventListener('click', async () => {
  startBtn.disabled = true;
  statusEl.textContent = 'Running...';

  const idle = await measurePing('/server/ping');
  latencyEl.textContent = idle.toFixed(1)+' ms';

  const d = await downloadTest('/server/testfile?size=20');
  animateSpeed(speedEl, d);

  const loaded = await measurePing('/server/ping?load=1');
  loadedLatencyEl.textContent = loaded.toFixed(1)+' ms';

  const u = await uploadTest('/server/upload', 5);
  uploadEl.textContent = u.toFixed(2)+' Mbps';

  detailsEl.classList.remove('hidden');
  statusEl.textContent = 'Done';
  startBtn.disabled = false;
});
