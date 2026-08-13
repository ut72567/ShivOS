import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

// Note: Firebase project configuration is safe to expose in client-side code.
// Security is handled exclusively by the Firestore Rules defined above.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "shivos-production.firebaseapp.com",
  projectId: "shivos-production",
  storageBucket: "shivos-production.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase Ecosystem
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

class ShivOSCore {
    constructor() {
        this.initAuthObserver();
        this.initLiveStats();
    }

    // Monitor User State Globally
    initAuthObserver() {
        onAuthStateChanged(auth, (user) => {
            const authBtnContainer = document.querySelector('.auth-buttons');
            if (user) {
                // User is signed in
                authBtnContainer.innerHTML = `<a href="/dashboard.html" class="btn btn-secondary" style="padding: 0.5rem 1.5rem;">Dashboard</a>`;
            } else {
                // User is signed out
                authBtnContainer.innerHTML = `<a href="/login.html" class="btn btn-secondary" style="padding: 0.5rem 1.5rem;">User Portal</a>`;
            }
        });
    }

    // Fetch and bind real-time Firebase data to the UI
    initLiveStats() {
        // Listening to the 'global_stats' document within the 'analytics' collection
        const statsRef = doc(db, "analytics", "global_stats");
        
        onSnapshot(statsRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                this.animateCounter('stat-downloads', data.total_downloads);
                this.animateCounter('stat-devices', data.supported_devices);
                this.animateCounter('stat-users', data.active_users);
                this.animateCounter('stat-releases', data.stable_releases);
            } else {
                console.warn("Analytics document not found. Ensure backend has initialized stats.");
            }
        }, (error) => {
            console.error("Error fetching live statistics: ", error);
        });
    }

    // Premium UI Counter Animation
    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // Format large numbers (e.g., 10000 -> 10K+)
        const formatNumber = (num) => {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M+';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K+';
            return num;
        };

        let startValue = 0;
        const duration = 1500; 
        const interval = 30;
        const step = (targetValue / (duration / interval));

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

// Initialize Application once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ShivOSCore();
});