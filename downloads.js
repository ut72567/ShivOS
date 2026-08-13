import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const db = getFirestore(app);

class DownloadsManager {
    constructor() {
        this.releases = [];
        this.container = document.getElementById('devices-container');
        this.searchInput = document.getElementById('search-device');
        this.channelFilter = document.getElementById('filter-channel');
        
        this.init();
    }

    async init() {
        await this.fetchReleases();
        this.renderDevices(this.releases);
        this.setupFilters();
    }

    async fetchReleases() {
        try {
            const releasesRef = collection(db, 'releases');
            // Fetching releases ordered by date descending to get the newest builds first
            const q = query(releasesRef, orderBy('releaseDate', 'desc'));
            const snapshot = await getDocs(q);
            
            this.releases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching releases:", error);
            this.container.innerHTML = `<p style="color: red; text-align: center; grid-column: 1/-1;">Error loading database. Please check your connection.</p>`;
        }
    }

    renderDevices(data) {
        this.container.innerHTML = '';
        
        if (data.length === 0) {
            this.container.innerHTML = `<p style="text-align: center; grid-column: 1/-1; color: var(--text-muted);">No releases found matching your criteria.</p>`;
            return;
        }

        data.forEach(release => {
            const card = document.createElement('div');
            card.className = 'device-card';
            
            // Format file size nicely
            const sizeInMB = (release.fileSize / (1024 * 1024)).toFixed(2);
            
            card.innerHTML = `
                <div class="device-header">
                    <div>
                        <div class="device-name">${release.deviceName || 'Unknown Device'}</div>
                        <div class="device-codename">${release.codename}</div>
                    </div>
                    <span class="badge ${release.channel === 'Stable' ? 'badge-secure' : 'badge-beta'}" style="font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px; background: ${release.channel === 'Stable' ? 'rgba(0, 255, 100, 0.1)' : 'rgba(255, 107, 0, 0.1)'}; color: ${release.channel === 'Stable' ? '#00ff64' : '#FF6B00'}; border: 1px solid currentColor;">
                        ${release.channel}
                    </span>
                </div>
                <div class="release-info">
                    <p>ShivOS Version: <span>${release.version}</span></p>
                    <p>Android Base: <span>${release.androidBase}</span></p>
                    <p>Maintainer: <span>${release.maintainer || 'SRT'}</span></p>
                    <p>Build Date: <span>${new Date(release.releaseDate).toLocaleDateString()}</span></p>
                    <p>Size: <span>${sizeInMB} MB</span></p>
                </div>
                <a href="${release.downloadUrl}" target="_blank" class="btn btn-primary download-btn">Download ROM</a>
                <div class="checksum-box" title="SHA-256 Checksum">
                    SHA256: ${release.sha256 || 'N/A'}
                </div>
            `;
            this.container.appendChild(card);
        });
    }

    setupFilters() {
        const filterData = () => {
            const searchTerm = this.searchInput.value.toLowerCase();
            const channel = this.channelFilter.value;

            const filtered = this.releases.filter(release => {
                const matchesSearch = (release.deviceName && release.deviceName.toLowerCase().includes(searchTerm)) || 
                                      (release.codename && release.codename.toLowerCase().includes(searchTerm));
                const matchesChannel = channel === 'All' || release.channel === channel;
                
                return matchesSearch && matchesChannel;
            });

            this.renderDevices(filtered);
        };

        this.searchInput.addEventListener('input', filterData);
        this.channelFilter.addEventListener('change', filterData);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DownloadsManager();
});