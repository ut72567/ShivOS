import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDzYZjKIFqvymAunjNaSg_H3ugi0FqxG4E",
  authDomain: "shivos.firebaseapp.com",
  projectId: "shivos",
  storageBucket: "shivos.firebasestorage.app",
  messagingSenderId: "323460412245",
  appId: "1:323460412245:web:290dee1b94d8441d3b35dc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

class ContentManager {
    constructor() {
        this.currentPath = window.location.pathname;
        this.init();
    }

    init() {
        if (this.currentPath.includes('blog')) {
            this.loadBlogPosts();
        } else if (this.currentPath.includes('changelog')) {
            this.loadChangelog();
        }
    }

    // ========================================
    // Blog & News System
    // ========================================
    async loadBlogPosts() {
        const container = document.getElementById('blog-container');
        if (!container) return;

        try {
            const q = query(collection(db, 'blog'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No news posts available at the moment.</div>`;
                return;
            }

            container.innerHTML = '';
            snapshot.forEach(doc => {
                const post = doc.data();
                const dateString = post.createdAt ? new Date(post.createdAt.toDate()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recent';
                const imageStyle = post.imageUrl ? `background-image: url('${post.imageUrl}')` : 'background-color: #111;';

                const card = document.createElement('article');
                card.className = 'blog-card';
                card.innerHTML = `
                    <div class="blog-image" style="${imageStyle}"></div>
                    <div class="blog-content">
                        <div class="blog-meta">
                            <span class="blog-category">${post.category || 'Announcement'}</span>
                            <span>${dateString}</span>
                        </div>
                        <h2 class="blog-title">${post.title}</h2>
                        <p class="blog-excerpt">${post.excerpt || 'Read the full article to learn more about this update...'}</p>
                        <a href="#" class="read-more">Read Full Post →</a>
                    </div>
                `;
                container.appendChild(card);
            });
        } catch (error) {
            console.error("Error loading blog posts:", error);
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #ff3c3c;">Failed to load connection.</div>`;
        }
    }

    // ========================================
    // System Changelog
    // ========================================
    async loadChangelog() {
        const container = document.getElementById('changelog-container');
        if (!container) return;

        try {
            // Reusing the 'releases' collection mapped to the Admin Panel uploads
            const q = query(collection(db, 'releases'), orderBy('releaseDate', 'desc'));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No release history available.</div>`;
                return;
            }

            container.innerHTML = '';
            snapshot.forEach(doc => {
                const release = doc.data();
                const dateObj = new Date(release.releaseDate);
                const shortDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const fullDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

                const item = document.createElement('div');
                item.className = 'timeline-item';
                
                // Using white-space: pre-wrap in CSS ensures that line breaks in the releaseNotes textarea are respected here.
                item.innerHTML = `
                    <div class="timeline-date">${shortDate}</div>
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <div>
                                <h3 class="timeline-title">${release.version}</h3>
                                <div class="timeline-subtitle">Android Base: ${release.androidBase} | Codename: ${release.codename}</div>
                            </div>
                            <span class="timeline-badge" style="${release.channel === 'Beta' ? 'color: #FF6B00; border-color: #FF6B00; background: rgba(255, 107, 0, 0.1);' : ''}">${release.channel}</span>
                        </div>
                        <div class="changelog-notes">${release.releaseNotes || 'No specific changelog provided for this release.'}</div>
                    </div>
                `;
                container.appendChild(item);
            });
        } catch (error) {
            console.error("Error loading changelog:", error);
            container.innerHTML = `<div style="text-align: center; color: #ff3c3c; padding: 2rem;">Failed to synchronize database.</div>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ContentManager();
});