// Import Firebase modules via CDN for native browser support
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

// ShivOS Production Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzYZjKIFqvymAunjNaSg_H3ugi0FqxG4E",
  authDomain: "shivos.firebaseapp.com",
  projectId: "shivos",
  storageBucket: "shivos.firebasestorage.app",
  messagingSenderId: "323460412245",
  appId: "1:323460412245:web:290dee1b94d8441d3b35dc",
  measurementId: "G-TTF55F03W2"
};

// Initialize Firebase Ecosystem
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

class AdminController {
    constructor() {
        this.protectRoute();
        this.initUI();
    }

    /**
     * Route Protection & Role-Based Access Control
     * Verifies authentication and checks Firestore for 'Admin' or 'Super Admin' role.
     */
    protectRoute() {
        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                // Not logged in -> Kick to login
                window.location.replace('/login.html');
                return;
            }

            try {
                // Fetch user role from Firestore
                const roleDocRef = doc(db, 'roles', user.uid);
                const roleSnapshot = await getDoc(roleDocRef);

                if (roleSnapshot.exists()) {
                    const userData = roleSnapshot.data();
                    if (userData.role === 'Admin' || userData.role === 'Super Admin') {
                        // Access Granted: Load Dashboard Data
                        this.loadRecentReleases();
                    } else {
                        // Unauthorized user -> Kick to public portal
                        alert("Access Denied: Insufficient permissions.");
                        window.location.replace('/dashboard.html');
                    }
                } else {
                    // No role document exists
                    window.location.replace('/dashboard.html');
                }
            } catch (error) {
                console.error("RBAC Verification Failed:", error);
                // Fail secure
                window.location.replace('/login.html');
            }
        });
    }

    /**
     * UI Interactions & Event Listeners
     */
    initUI() {
        // Mobile Sidebar Toggle
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('sidebar');

        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }

        // Logout Handler
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                signOut(auth).then(() => {
                    window.location.replace('/login.html');
                }).catch((error) => {
                    console.error("Logout error", error);
                });
            });
        }
    }

    /**
     * Fetch Recent OTA Releases for the Dashboard Table
     */
    async loadRecentReleases() {
        const tableBody = document.getElementById('recent-releases-body');
        if (!tableBody) return;

        try {
            const releasesRef = collection(db, 'releases');
            // Fetch the 5 most recent releases
            const q = query(releasesRef, orderBy('releaseDate', 'desc'), limit(5));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No recent releases found.</td></tr>`;
                return;
            }

            tableBody.innerHTML = ''; // Clear loading state

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                
                // Construct table row
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${data.version}</strong><br><small class="text-muted">${data.androidBase}</small></td>
                    <td>${data.codename}</td>
                    <td><span class="badge ${data.channel === 'Stable' ? 'badge-secure' : 'badge-beta'}">${data.channel}</span></td>
                    <td>Published</td>
                `;
                tableBody.appendChild(tr);
            });
        } catch (error) {
            console.error("Error loading releases:", error);
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: red;">Failed to load data.</td></tr>`;
        }
    }
}

// Global Modal Functions (can be triggered by HTML onclick attributes)
window.openModal = function(modalId) {
    console.log(`Opening modal: ${modalId}`);
    // Modal logic will go here
};

window.closeModal = function(modalId) {
    console.log(`Closing modal: ${modalId}`);
};

// Initialize Application once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminController();
});