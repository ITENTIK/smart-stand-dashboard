// Импорт Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// ===== КОНФИГУРАЦИЯ FIREBASE =====
const firebaseConfig = {
  apiKey: "AIzaSyDMfmMhEyFUiQ8oIecbDkJFJxcYf9z00MM",
  authDomain: "smart-stand-7e599.firebaseapp.com",
  databaseURL: "https://smart-stand-7e599-default-rtdb.firebaseio.com",
  projectId: "smart-stand-7e599",
  storageBucket: "smart-stand-7e599.firebasestorage.app",
  messagingSenderId: "600827325868",
  appId: "1:600827325868:web:572b46cb91234c35ad1e09",
  measurementId: "G-114B4VX489"
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Путь к данным в Firebase (совпадает с тем, что отправляет ESP)
const dataPath = 'sensor_data';

// ===== СЛУШАЕМ ИЗМЕНЕНИЯ В БАЗЕ ДАННЫХ =====
const sensorDataRef = ref(database, dataPath);
onValue(sensorDataRef, (snapshot) => {
  const data = snapshot.val();
  
  if (data) {
    // --- Температура ---
    document.getElementById("temp").textContent = data.temperature ? data.temperature + " °C" : "—";
    
    // --- Вес ---
    document.getElementById("weight").textContent = data.weight ? data.weight + " г" : "—";
    
    // --- Статус кружки ---
    const cupStatus = document.getElementById("cup");
    if (data.isCupPresent === true) {
      cupStatus.textContent = "✅ Да";
      cupStatus.className = "value status-ok";
    } else if (data.isCupPresent === false) {
      cupStatus.textContent = "❌ Нет";
      cupStatus.className = "value status-no";
    } else {
      cupStatus.textContent = "—";
    }
    
    // --- Оставшееся время таймера (в секундах) ---
    const timeLeft = document.getElementById("timeLeft");
    if (data.timeLeft !== undefined && data.timeLeft !== null) {
      const seconds = data.timeLeft;
      if (seconds > 60) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timeLeft.textContent = minutes + " мин " + secs + " сек";
      } else {
        timeLeft.textContent = seconds + " сек";
      }
    } else {
      timeLeft.textContent = "—";
    }
    
    // --- Заряд батареи ---
    const battery = document.getElementById("battery");
    if (data.battery !== undefined && data.battery !== null) {
      const voltage = data.battery;
      // Примерное отображение в процентах (для 9В батареи: 6.5В = 0%, 9В = 100%)
      let percent = 0;
      if (voltage >= 9.0) percent = 100;
      else if (voltage <= 6.5) percent = 0;
      else {
        percent = (voltage - 6.5) / (9.0 - 6.5) * 100;
      }
      if (percent > 100) percent = 100;
      if (percent < 0) percent = 0;
      
      battery.textContent = voltage.toFixed(2) + " В (" + Math.round(percent) + "%)";
    } else {
      battery.textContent = "—";
    }
  } else {
    // Если данных нет — показываем прочерки
    document.getElementById("temp").textContent = "—";
    document.getElementById("weight").textContent = "—";
    document.getElementById("cup").textContent = "—";
    document.getElementById("timeLeft").textContent = "—";
    document.getElementById("battery").textContent = "—";
  }
});
