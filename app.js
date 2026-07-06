import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

// ===== КОНФИГ FIREBASE =====
const firebaseConfig = {
    apiKey: "AIzaSyDMfmMhEyFUiQ8oIecbDkJfJxcYf9z00MM",
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

// ===== ЭЛЕМЕНТЫ =====
const tempEl = document.getElementById("temp");
const weightEl = document.getElementById("weight");
const cupEl = document.getElementById("cup");
const timeEl = document.getElementById("timeLeft");
const batteryEl = document.getElementById("battery");
const historyList = document.getElementById("historyList");
const toast = document.getElementById("toast");

// ===== ТЕМА =====
const themeToggle = document.getElementById("themeToggle");

function setTheme(dark) {
    if (dark) {
        document.body.classList.add("dark");
        themeToggle.textContent = "☀️ Светлая";
    } else {
        document.body.classList.remove("dark");
        themeToggle.textContent = "🌙 Тёмная";
    }
    localStorage.setItem("theme", dark ? "dark" : "light");
}

const savedTheme = localStorage.getItem("theme");
setTheme(savedTheme === "dark");

themeToggle.addEventListener("click", () => {
    setTheme(!document.body.classList.contains("dark"));
});

// ===== ГРАФИК С ДВУМЯ ОСЯМИ =====
const ctx = document.getElementById('chart').getContext('2d');
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Вес (г)',
                data: [],
                borderColor: '#2a9d8f',
                backgroundColor: 'rgba(42,157,143,0.1)',
                fill: true,
                tension: 0.3,
                yAxisID: 'yWeight'
            },
            {
                label: 'Температура (°C)',
                data: [],
                borderColor: '#e76f51',
                backgroundColor: 'rgba(231,111,81,0.1)',
                fill: true,
                tension: 0.3,
                yAxisID: 'yTemp'
            }
        ]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { position: 'top' }
        },
        scales: {
            yWeight: {
                type: 'linear',
                position: 'left',
                beginAtZero: true,
                title: { display: true, text: 'Вес (г)' }
            },
            yTemp: {
                type: 'linear',
                position: 'right',
                beginAtZero: true,
                title: { display: true, text: 'Температура (°C)' },
                grid: { drawOnChartArea: false },
                min: 0,
                max: 50
            }
        }
    }
});

// ===== ИСТОРИЯ =====
let history = [];
const MAX_HISTORY = 20;
let lastAlert = false;

function playAlertSound() {
    try {
        const audio = new Audio("data:audio/wav;base64,UklGRlwAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVoAAACBhYV/hH2EfoR+hoeFhYaFhoeFhYaFhoeFhYaFhoeFhYaFhoeFhYaFhoeFhYaFhoeFhYaFhoeFhYaFhoeFhYaFhoeFhYaFhoeFhYaF");
        audio.play();
    } catch (e) {}
}

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 5000);
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

    if (timeLeft > 0) {
        if (timeLeft > 60) {
            const m = Math.floor(timeLeft / 60);
            const s = timeLeft % 60;
            timeEl.textContent = m + " мин " + s + " сек";
        } else {
            timeEl.textContent = timeLeft + " сек";
        }
    } else {
        timeEl.textContent = "—";
    }

    if (battery) {
        let p = 0;
        if (battery >= 9.0) p = 100;
        else if (battery <= 6.5) p = 0;
        else p = ((battery - 6.5) / (9.0 - 6.5)) * 100;
        if (p > 100) p = 100;
        if (p < 0) p = 0;
        batteryEl.textContent = battery.toFixed(2) + " В (" + Math.round(p) + "%)";
    } else {
        batteryEl.textContent = "—";
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    history.push({ time: timeStr, weight, temp, cup });
    if (history.length > MAX_HISTORY) history.shift();

    historyList.innerHTML = history.slice().reverse().map(h =>
        `<li>
            <span>${h.weight} г, ${h.temp}°C ${h.cup ? '✅' : '❌'}</span>
            <span class="time">${h.time}</span>
        </li>`
    ).join('') || '<li style="color:#aaa;">Нет данных</li>';

    // ===== ГРАФИК =====
    chart.data.labels = history.map(h => h.time);
    chart.data.datasets[0].data = history.map(h => h.weight);
    chart.data.datasets[1].data = history.map(h => h.temp);
    chart.update();

    if (cup && timeLeft <= 5 && timeLeft > 0 && !lastAlert) {
        showToast("🔔 Чай скоро готов! Осталось " + timeLeft + " сек");
        playAlertSound();
        lastAlert = true;
    }
    if (!cup) lastAlert = false;
});
