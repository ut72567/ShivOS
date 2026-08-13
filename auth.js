import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    GithubAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

let currentMode = 'login'; // 'login' | 'signup'

class AuthManager {
    constructor() {
        this.initAuthCheck();
        this.bindEvents();
    }

    initAuthCheck() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is already signed in -> Redirect to Dashboard
                window.location.replace('/dashboard.html');
            }
        });
    }

    bindEvents() {
        const form = document.getElementById('auth-form');
        const googleBtn = document.getElementById('btn-google');
        const githubBtn = document.getElementById('btn-github');

        form.addEventListener('submit', (e) => this.handleEmailAuth(e));
        googleBtn.addEventListener('click', () => this.handleOAuth(new GoogleAuthProvider()));
        githubBtn.addEventListener('click', () => this.handleOAuth(new GithubAuthProvider()));
    }

    async handleEmailAuth(e) {
        e.preventDefault();
        this.clearError();

        const email = document.getElementById('input-email').value.trim();
        const password = document.getElementById('input-password').value;
        const name = document.getElementById('input-name').value.trim();

        try {
            if (currentMode === 'signup') {
                const credential = await createUserWithEmailAndPassword(auth, email, password);
                await this.createUserProfile(credential.user, name || 'ShivOS User');
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            window.location.replace('./dashboard.html');
        } catch (error) {
            this.showError(this.formatErrorMessage(error.code));
        }
    }

    async handleOAuth(provider) {
        this.clearError();
        try {
            const result = await signInWithPopup(auth, provider);
            await this.createUserProfile(result.user, result.user.displayName || 'ShivOS User');
            window.location.replace('/.dashboard.html');
        } catch (error) {
            this.showError(this.formatErrorMessage(error.code));
        }
    }

    async createUserProfile(user, displayName) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                photoURL: user.photoURL || '',
                savedDevices: [],
                createdAt: serverTimestamp()
            });
        }
    }

    showError(message) {
        const errBox = document.getElementById('auth-error');
        errBox.innerText = message;
        errBox.style.display = 'block';
    }

    clearError() {
        const errBox = document.getElementById('auth-error');
        errBox.innerText = '';
        errBox.style.display = 'none';
    }

    formatErrorMessage(code) {
        switch (code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                return 'Invalid email or password.';
            case 'auth/email-already-in-use':
                return 'An account with this email already exists.';
            case 'auth/weak-password':
                return 'Password must be at least 6 characters.';
            default:
                return 'Authentication failed. Please try again.';
        }
    }
}

// Global Tab Switcher
window.switchAuthMode = function(mode) {
    currentMode = mode;
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const nameGroup = document.getElementById('group-name');
    const submitBtn = document.getElementById('btn-submit');

    if (mode === 'signup') {
        tabSignup.classList.add('active');
        tabLogin.classList.remove('active');
        nameGroup.style.display = 'block';
        submitBtn.innerText = 'Create Account';
    } else {
        tabLogin.classList.add('active');
        tabSignup.classList.remove('active');
        nameGroup.style.display = 'none';
        submitBtn.innerText = 'Sign In';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});