import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDzYZjKIFqvymAunjNaSg_H3ugi0FqxG4E",
  authDomain: "shivos.firebaseapp.com",
  projectId: "shivos",
  storageBucket: "shivos.firebasestorage.app",
  messagingSenderId: "323460412245",
  appId: "1:323460412245:web:290dee1b94d8441d3b35dc",
  measurementId: "G-TTF55F03W2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

class ShivOSCore {
    constructor() {
        this.initAuthObserver();
        this.initLiveStats();
    }

    initAuthObserver() {
        onAuthStateChanged(auth, (user) => {
            const authBtnContainer = document.querySelector('.auth-buttons');
            if (!authBtnContainer) return;
            
            if (user) {
                // FIXED RELATIVE PATH HERE
                authBtnContainer.innerHTML = `<a href="./dashboard.html" class="btn btn-secondary" style="padding: 0.5rem 1.5rem;">Dashboard</a>`;
            } else {
                // FIXED RELATIVE PATH HERE
                authBtnContainer.innerHTML = `<a href="./login.html" class="btn btn-secondary" style="padding: 0.5rem 1.5rem;">User Portal</a>`;
            }
        });
    }

    initLiveStats() {
        const statsRef = doc(db, "analytics", "global_stats");
        
        onSnapshot(statsRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                this.animateCounter('stat-downloads', data.total_downloads || 0);
                this.animateCounter('stat-devices', data.supported_devices || 0);
                this.animateCounter('stat-users', data.active_users || 0);
                this.animateCounter('stat-releases', data.stable_releases || 0);
            }
        }, (error) => {
            console.error("Error fetching live statistics: ", error);
        });
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const formatNumber = (num) => {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M+';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K+';
            return num;
        };

        let startValue = 0;
        const duration = 1500; 
        const interval = 30;
        const step = (targetValue / (duration / interval));

        if (targetValue === 0) {
            element.innerText = "0";
            return;
        }

        const counter = setInterval(() => {
            startValue += step;
            if (startValue >= targetValue) {
                element.innerText = formatNumber(targetValue);
                clearInterval(counter);
            } else {
                element.innerText = Math.floor(startValue);
            }
        }, interval);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ShivOSCore();
});