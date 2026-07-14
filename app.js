import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

// ===== КОНФИГ FIREBASE =====
const firebaseConfig = {
    apiKey: "AIzaSyDMfmMhEyFUiQ8oIecbDkJFJxcYf9z00MM",
    authDomain: "smart-stand-7e599.firebaseapp.com",
    databaseURL: "https://smart-stand-7e599-default-rtdb.firebaseio.com",
    projectId: "smart-stand-7e599",
    storageBucket: "smart-stand-7e599.firebasestorage.app",
    messagingSenderId: "600827325868",
    appId: "1:600827325868:web:572b46cb91234c35ad1e09"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const dataPath = 'sensor_data';

function map(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

// ===== ЭЛЕМЕНТЫ =====
const tempEl = document.getElementById("temp");
const weightEl = document.getElementById("weight");
const cupEl = document.getElementById("cup");
const timeEl = document.getElementById("timeLeft");
const batteryEl = document.getElementById("battery");
const historyList = document.getElementById("historyList");
const toast = document.getElementById("toast");
const notifBox = document.getElementById("notifBox");
const notifMsg = document.getElementById("notifMsg");

// ===== ТЕМА =====
const themeToggle = document.getElementById("themeToggle");
function setTheme(dark) {
    if (dark) { document.body.classList.add("dark"); themeToggle.textContent = "☀️ Светлая"; }
    else { document.body.classList.remove("dark"); themeToggle.textContent = "🌙 Тёмная"; }
    localStorage.setItem("theme", dark ? "dark" : "light");
}
const savedTheme = localStorage.getItem("theme");
setTheme(savedTheme === "dark");
themeToggle.addEventListener("click", () => setTheme(!document.body.classList.contains("dark")));

// ===== ГРАФИКИ =====
const ctxCombined = document.getElementById('chartCombined').getContext('2d');
const ctxTemp = document.getElementById('chartTemp').getContext('2d');
const ctxWeight = document.getElementById('chartWeight').getContext('2d');

const chartCombined = new Chart(ctxCombined, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            { label: 'Вес (г)', data: [], borderColor: '#2a9d8f', backgroundColor: 'rgba(42,157,143,0.1)', fill: true, tension: 0.3, yAxisID: 'yWeight' },
            { label: 'Температура (°C)', data: [], borderColor: '#e76f51', backgroundColor: 'rgba(231,111,81,0.1)', fill: true, tension: 0.3, yAxisID: 'yTemp' }
        ]
    },
    options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: {
            yWeight: { type: 'linear', position: 'left', beginAtZero: true, title: { display: true, text: 'Вес (г)' } },
            yTemp: { type: 'linear', position: 'right', beginAtZero: true, title: { display: true, text: 'Температура (°C)' }, grid: { drawOnChartArea: false }, min: 0, max: 50 }
        }
    }
});

const chartTemp = new Chart(ctxTemp, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Температура (°C)', data: [], borderColor: '#e76f51', backgroundColor: 'rgba(231,111,81,0.1)', fill: true, tension: 0.3 }] },
    options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, max: 50 } } }
});

const chartWeight = new Chart(ctxWeight, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Вес (г)', data: [], borderColor: '#2a9d8f', backgroundColor: 'rgba(42,157,143,0.1)', fill: true, tension: 0.3 }] },
    options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }
});

// ===== ПЕРЕКЛЮЧЕНИЕ ГРАФИКОВ =====
const grid = document.getElementById('chartGrid');
const viewOne = document.getElementById('viewOne');
const viewTwo = document.getElementById('viewTwo');

function setView(mode) {
    const boxes = grid.querySelectorAll('.chart-box');
    if (mode === 'one') {
        grid.className = 'chart-grid one';
        boxes.forEach((el, i) => el.style.display = i === 0 ? '' : 'none');
        viewOne.classList.add('active');
        viewTwo.classList.remove('active');
    } else {
        grid.className = 'chart-grid two';
        boxes.forEach(el => el.style.display = '');
        viewTwo.classList.add('active');
        viewOne.classList.remove('active');
    }
}
viewOne.addEventListener('click', () => setView('one'));
viewTwo.addEventListener('click', () => setView('two'));
setView('one');

// ===== ИСТОРИЯ =====
let history = [];
const MAX_HISTORY = 20;
let lastAlert = false;

function playAlertSound() {
    try { new Audio("data:audio/wav;base64,UklGRlwAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVoAAACBhYV/hH2EfoR+hoeFhYaFhoeFhYaFhoeFhYaFhoeFhYaFhoeFhYaFhoeFhYaFhoeFhYaFhoeFhYaFhoeFhYaFhoeFhYaFhoeFhYaF").play(); } catch(e) {}
}

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 5000);
}

function updateNotification(cup, timeLeft, temp) {
    if (cup) {
        if (timeLeft <= 5 && timeLeft > 0) {
            notifMsg.innerHTML = `⏰ <span class="highlight">Скоро остынет! Осталось ${timeLeft} сек</span>`;
            notifBox.className = 'notifications alarm';
        } else if (timeLeft > 5) {
            notifMsg.innerHTML = `☕ Напиток на месте. Температура: ${temp}°C. Ожидание...`;
            notifBox.className = 'notifications';
        } else {
            notifMsg.innerHTML = `☕ Напиток на месте. Температура: ${temp}°C.`;
            notifBox.className = 'notifications';
        }
    } else {
        notifMsg.innerHTML = `📌 Ожидание... поставьте кружку`;
        notifBox.className = 'notifications';
    }
}

// ===== ЧТЕНИЕ ДАННЫХ =====
onValue(ref(database, dataPath), (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const temp = data.temperature ?? 0;
    const weight = data.weight ?? 0;
    const cup = data.isCupPresent ?? false;
    const timeLeft = data.timeLeft ?? 0;
    const battery = data.battery ?? 0;

    tempEl.textContent = temp ? temp + " °C" : "—";
    weightEl.textContent = weight ? weight + " г" : "—";
    cupEl.textContent = cup ? "✅ Да" : "❌ Нет";
    cupEl.className = "value " + (cup ? "status-ok" : "status-no");

    let invertedTime = 0;
    if (timeLeft > 0) {
        invertedTime = Math.round(map(timeLeft, 30, 600, 600, 30));
        if (invertedTime > 60) {
            const m = Math.floor(invertedTime / 60);
            const s = invertedTime % 60;
            timeEl.textContent = m + " мин " + s + " сек";
        } else {
            timeEl.textContent = invertedTime + " сек";
        }
    } else {
        timeEl.textContent = "—";
    }

    if (battery) {
        let p = 0;
        if (battery >= 4.2) p = 100;
        else if (battery <= 3.0) p = 0;
        else p = ((battery - 3.0) / (4.2 - 3.0)) * 100;
        if (p > 100) p = 100;
        if (p < 0) p = 0;
        batteryEl.textContent = battery.toFixed(2) + " В (" + Math.round(p) + "%)";
    } else {
        batteryEl.textContent = "—";
    }

    // Уведомления
    updateNotification(cup, invertedTime, temp);

    // История
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    history.push({ time: timeStr, weight, temp, cup });
    if (history.length > MAX_HISTORY) history.shift();

    historyList.innerHTML = history.slice().reverse().map(h =>
        `<li><span>${h.weight} г, ${h.temp}°C ${h.cup ? '✅' : '❌'}</span><span class="time">${h.time}</span></li>`
    ).join('') || '<li style="color:#aaa;">Нет данных</li>';

    // Графики
    const labels = history.map(h => h.time);
    const weightData = history.map(h => h.weight);
    const tempData = history.map(h => h.temp);

    chartCombined.data.labels = labels;
    chartCombined.data.datasets[0].data = weightData;
    chartCombined.data.datasets[1].data = tempData;
    chartCombined.update();

    chartTemp.data.labels = labels;
    chartTemp.data.datasets[0].data = tempData;
    chartTemp.update();

    chartWeight.data.labels = labels;
    chartWeight.data.datasets[0].data = weightData;
    chartWeight.update();

    if (cup && timeLeft <= 5 && timeLeft > 0 && !lastAlert) {
        showToast("🔔 Чай скоро готов! Осталось " + timeLeft + " сек");
        playAlertSound();
        lastAlert = true;
    }
    if (!cup) lastAlert = false;
});
