import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

class DashboardController {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                window.location.replace('/login.html');
                return;
            }

            this.currentUser = user;
            this.renderProfile(user);
            this.listenToBugReports(user.uid);
            this.setupEvents();
        });
    }

    async renderProfile(user) {
        const nameEl = document.getElementById('user-display-name');
        const emailEl = document.getElementById('user-email');
        const avatarEl = document.getElementById('user-avatar-text');

        emailEl.innerText = user.email;

        // Fetch display name from Firestore profile document
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        let displayName = user.displayName;
        if (userSnap.exists() && userSnap.data().displayName) {
            displayName = userSnap.data().displayName;
        }

        displayName = displayName || 'ShivOS User';
        nameEl.innerText = displayName;
        avatarEl.innerText = displayName.charAt(0).toUpperCase();
    }

    listenToBugReports(uid) {
        const bugContainer = document.getElementById('user-bugs-container');
        const bugBadge = document.getElementById('bug-count-badge');
        
        const q = query(
            collection(db, 'bug_reports'),
            where('uid', '==', uid),
            orderBy('createdAt', 'desc')
        );

        onSnapshot(q, (snapshot) => {
            bugBadge.innerText = `${snapshot.size} Total`;

            if (snapshot.empty) {
                bugContainer.innerHTML = `<p class="text-muted" style="font-size: 0.9rem;">No bug reports submitted yet.</p>`;
                return;
            }

            bugContainer.innerHTML = '';
            snapshot.forEach((docSnap) => {
                const bug = docSnap.data();
                const item = document.createElement('div');
                item.className = 'bug-item';

                const statusClass = bug.status === 'Resolved' ? 'status-resolved' : 
                                   (bug.status === 'Closed' ? 'status-closed' : 'status-open');

                item.innerHTML = `
                    <div class="bug-title">[${bug.device}] ${bug.version}</div>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">${bug.description}</p>
                    <div class="bug-meta">
                        <span>Submitted: ${bug.createdAt ? new Date(bug.createdAt.toDate()).toLocaleDateString() : 'Just now'}</span>
                        <span class="status-badge ${statusClass}">${bug.status || 'Open'}</span>
                    </div>
                `;
                bugContainer.appendChild(item);
            });
        }, (error) => {
            console.error("Error fetching user bug reports:", error);
            bugContainer.innerHTML = `<p style="color: red; font-size: 0.85rem;">Failed to load bug reports.</p>`;
        });
    }

    setupEvents() {
        const logoutBtn = document.getElementById('btn-user-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                signOut(auth).then(() => window.location.replace('/login.html'));
            });
        }

        const bugForm = document.getElementById('bug-form');
        if (bugForm) {
            bugForm.addEventListener('submit', (e) => this.submitBugReport(e));
        }
    }

    async submitBugReport(e) {
        e.preventDefault();
        if (!this.currentUser) return;

        const device = document.getElementById('bug-device').value.trim();
        const version = document.getElementById('bug-version').value.trim();
        const description = document.getElementById('bug-description').value.trim();

        try {
            await addDoc(collection(db, 'bug_reports'), {
                uid: this.currentUser.uid,
                userEmail: this.currentUser.email,
                device: device,
                version: version,
                description: description,
                status: 'Open',
                createdAt: serverTimestamp()
            });

            window.closeBugModal();
            bugForm.reset();
        } catch (error) {
            console.error("Error submitting bug report:", error);
            alert("Failed to submit bug report. Please try again.");
        }
    }
}

// Global Modal Functions
window.openBugModal = function() {
    document.getElementById('bugModal').classList.add('active');
};

window.closeBugModal = function() {
    document.getElementById('bugModal').classList.remove('active');
};

document.addEventListener('DOMContentLoaded', () => {
    new DashboardController();
});