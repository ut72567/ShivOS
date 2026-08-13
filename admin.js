import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, doc, getDoc, collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDzYZjKIFqvymAunjNaSg_H3ugi0FqxG4E",
  authDomain: "shivos.firebaseapp.com",
  projectId: "shivos",
  storageBucket: "shivos.firebasestorage.app",
  messagingSenderId: "323460412245",
  appId: "1:323460412245:web:290dee1b94d8441d3b35dc"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

class AdminController {
    constructor() {
        this.protectRoute();
        this.initUI();
    }

    protectRoute() {
        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                window.location.replace('/login.html');
                return;
            }
            try {
                const roleDocRef = doc(db, 'roles', user.uid);
                const roleSnapshot = await getDoc(roleDocRef);

                if (roleSnapshot.exists() && (roleSnapshot.data().role === 'Admin' || roleSnapshot.data().role === 'Super Admin')) {
                    this.loadRecentReleases();
                } else {
                    alert("Access Denied: Insufficient permissions.");
                    window.location.replace('/dashboard.html');
                }
            } catch (error) {
                window.location.replace('/login.html');
            }
        });
    }

    initUI() {
        document.getElementById('menu-toggle')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });

        document.getElementById('btn-logout')?.addEventListener('click', () => {
            signOut(auth).then(() => window.location.replace('/login.html'));
        });

        // Form Submit Listeners
        document.getElementById('form-add-device')?.addEventListener('submit', (e) => this.handleDeviceSubmit(e));
        document.getElementById('form-add-release')?.addEventListener('submit', (e) => this.handleReleaseSubmit(e));
    }

    async handleDeviceSubmit(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-submit-device');
        btn.innerText = 'Saving...';
        btn.disabled = true;

        try {
            await addDoc(collection(db, 'devices'), {
                deviceName: document.getElementById('dev-name').value.trim(),
                codename: document.getElementById('dev-codename').value.trim().toLowerCase(),
                maintainer: document.getElementById('dev-maintainer').value.trim(),
                status: document.getElementById('dev-status').value,
                addedAt: serverTimestamp()
            });

            alert("Device successfully added to tree.");
            document.getElementById('form-add-device').reset();
            window.closeModal('deviceModal');
        } catch (error) {
            console.error("Error adding device:", error);
            alert("Failed to add device. Check console for details.");
        } finally {
            btn.innerText = 'Save Device';
            btn.disabled = false;
        }
    }

    async handleReleaseSubmit(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-submit-release');
        btn.innerText = 'Publishing...';
        btn.disabled = true;

        try {
            await addDoc(collection(db, 'releases'), {
                codename: document.getElementById('rel-codename').value.trim().toLowerCase(),
                version: document.getElementById('rel-version').value.trim(),
                androidBase: document.getElementById('rel-base').value.trim(),
                channel: document.getElementById('rel-channel').value,
                downloadUrl: document.getElementById('rel-url').value.trim(),
                fileSize: parseFloat(document.getElementById('rel-size').value),
                sha256: document.getElementById('rel-sha').value.trim(),
                releaseNotes: document.getElementById('rel-notes').value.trim(),
                releaseDate: new Date().toISOString(),
                createdAt: serverTimestamp()
            });

            alert("OTA Release published globally.");
            document.getElementById('form-add-release').reset();
            window.closeModal('releaseModal');
            
            // Refresh Dashboard table to show new release
            this.loadRecentReleases();
        } catch (error) {
            console.error("Error pushing release:", error);
            alert("Failed to push release. Check console for details.");
        } finally {
            btn.innerText = 'Publish Release';
            btn.disabled = false;
        }
    }

    async loadRecentReleases() {
        const tableBody = document.getElementById('recent-releases-body');
        if (!tableBody) return;

        try {
            const q = query(collection(db, 'releases'), orderBy('createdAt', 'desc'), limit(5));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No recent releases found.</td></tr>`;
                return;
            }

            tableBody.innerHTML = ''; 

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${data.version}</strong><br><small class="text-muted">${data.androidBase}</small></td>
                    <td><span style="font-family: monospace; color: var(--accent-orange);">${data.codename}</span></td>
                    <td><span class="badge ${data.channel === 'Stable' ? 'badge-secure' : 'badge-beta'}">${data.channel}</span></td>
                    <td><span style="color: #00ff64; font-size: 0.85rem;">Live</span></td>
                `;
                tableBody.appendChild(tr);
            });
        } catch (error) {
            console.error("Error loading releases:", error);
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: red;">Failed to fetch database.</td></tr>`;
        }
    }
}

// Global Modal Handlers accessible by HTML onclick attributes
window.openModal = function(modalId) {
    document.getElementById(modalId)?.classList.add('active');
};

window.closeModal = function(modalId) {
    document.getElementById(modalId)?.classList.remove('active');
};

document.addEventListener('DOMContentLoaded', () => {
    new AdminController();
});