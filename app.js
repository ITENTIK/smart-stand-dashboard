import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// Ваш конфиг (вставлен без изменений)
const firebaseConfig = {
  apiKey: "AIzaSyDMfmMhEyFUiQ8oIecbDkJfJxcYf9z00MM",
  authDomain: "smart-stand-7e599.firebaseapp.com",
  databaseURL: "https://smart-stand-7e599-default-rtdb.firebaseio.com",
  projectId: "smart-stand-7e599",
  storageBucket: "smart-stand-7e599.firebasestorage.app",
  messagingSenderId: "600827325868",
  appId: "1:600827325868:web:572b46cb91234c35ad1e09",
  measurementId: "G-114B4VX489"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const dataPath = 'sensor_data'; // путь, куда ESP отправляет данные

const sensorDataRef = ref(database, dataPath);
onValue(sensorDataRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        document.getElementById("temp").textContent = data.temperature ? data.temperature + " °C" : "Нет данных";
        document.getElementById("weight").textContent = data.weight ? data.weight + " г" : "Нет данных";
        const cupStatus = document.getElementById("cup");
        if (data.isCupPresent === true) {
            cupStatus.textContent = "✅ Да";
            cupStatus.className = "value status-ok";
        } else if (data.isCupPresent === false) {
            cupStatus.textContent = "❌ Нет";
            cupStatus.className = "value status-no";
        } else {
            cupStatus.textContent = "Нет данных";
        }
    }
});