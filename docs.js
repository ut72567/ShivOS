// docs.js - Interactive Documentation Controller

class DocsManager {
    constructor() {
        this.navLinks = document.querySelectorAll('.docs-nav-link');
        this.sections = document.querySelectorAll('.doc-section');
        this.init();
    }

    init() {
        // Handle initial load based on URL Hash (e.g., /docs.html#recovery)
        this.handleHashChange();

        // Bind Navigation Clicks
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('data-target');
                
                // Update URL quietly
                history.pushState(null, null, `#${targetId}`);
                
                this.switchSection(targetId);
            });
        });

        // Listen for browser back/forward buttons
        window.addEventListener('hashchange', () => this.handleHashChange());
    }

    handleHashChange() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            this.switchSection(hash);
        }
    }

    switchSection(targetId) {
        // Remove active class from all links and sections
        this.navLinks.forEach(nav => nav.classList.remove('active'));
        this.sections.forEach(sec => sec.classList.remove('active'));

        // Find targets
        const activeLink = document.querySelector(`.docs-nav-link[data-target="${targetId}"]`);
        const activeSection = document.getElementById(targetId);

        if (activeLink && activeSection) {
            activeLink.classList.add('active');
            activeSection.classList.add('active');
            
            // On mobile, scroll to top of content
            if (window.innerWidth <= 900) {
                window.scrollTo({
                    top: activeSection.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        }
    }
}

// Global Clipboard Logic attached to window
window.copyCode = function(button) {
    // Find the closest code block within the same container
    const container = button.closest('.code-container');
    const codeBlock = container.querySelector('.code-block');
    
    // Copy to clipboard
    navigator.clipboard.writeText(codeBlock.innerText).then(() => {
        const originalText = button.innerText;
        button.innerText = 'Copied!';
        button.style.color = '#00ff64';
        button.style.borderColor = '#00ff64';
        
        // Reset button state after 2 seconds
        setTimeout(() => {
            button.innerText = originalText;
            button.style.color = 'var(--text-muted)';
            button.style.borderColor = 'var(--glass-border)';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy code: ', err);
        button.innerText = 'Failed';
    });
};

// Initialize Application once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DocsManager();
});