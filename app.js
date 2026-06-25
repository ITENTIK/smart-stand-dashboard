import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

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

const sensorDataRef = ref(database, dataPath);
onValue(sensorDataRef, (snapshot) => {
    const data = snapshot.val();

    const tempEl = document.getElementById("temp");
    const weightEl = document.getElementById("weight");
    const cupEl = document.getElementById("cup");
    const timeEl = document.getElementById("timeLeft");
    const batteryEl = document.getElementById("battery");

    if (!data) {
        tempEl.textContent = "—";
        weightEl.textContent = "—";
        timeEl.textContent = "—";
        batteryEl.textContent = "—";
        cupEl.innerHTML = `<span class="status-badge off">Нет данных</span>`;
        return;
    }

    // Температура
    tempEl.textContent = data.temperature !== undefined ? data.temperature + " °C" : "—";

    // Вес
    weightEl.textContent = data.weight !== undefined ? data.weight + " г" : "—";

    // Статус кружки
    if (data.isCupPresent === true) {
        cupEl.innerHTML = `<span class="status-badge">✅ Кружка на месте</span>`;
    } else if (data.isCupPresent === false) {
        cupEl.innerHTML = `<span class="status-badge off">❌ Кружки нет</span>`;
    } else {
        cupEl.innerHTML = `<span class="status-badge off">—</span>`;
    }

    // Оставшееся время
    if (data.timeLeft !== undefined && data.timeLeft !== null) {
        const sec = data.timeLeft;
        if (sec > 60) {
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            timeEl.textContent = m + " мин " + s + " сек";
        } else {
            timeEl.textContent = sec + " сек";
        }
    } else {
        timeEl.textContent = "—";
    }

    // Батарея
    if (data.battery !== undefined && data.battery !== null) {
        const v = data.battery;
        let percent = 0;
        if (v >= 9.0) percent = 100;
        else if (v <= 6.5) percent = 0;
        else percent = ((v - 6.5) / (9.0 - 6.5)) * 100;
        if (percent > 100) percent = 100;
        if (percent < 0) percent = 0;
        batteryEl.textContent = v.toFixed(2) + " В (" + Math.round(percent) + "%)";
    } else {
        batteryEl.textContent = "—";
    }
});
