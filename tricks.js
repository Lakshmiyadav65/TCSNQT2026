let tricksData = [];
let categories = new Set();
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', initTricks);

async function initTricks() {
    try {
        const response = await fetch('./data/aptitude-tricks.json');
        tricksData = await response.json();
        
        processTricks(tricksData);
        renderCategories();
        renderTricks(tricksData);
        setupEventListeners();
    } catch (error) {
        console.error('Error loading tricks:', error);
        document.getElementById('tricks-grid').innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 2rem;">
                <span style="font-size: 2rem; display: block; margin-bottom: 1rem;">⚠️</span>
                Failed to load shortcodes. Please try refreshing the page.
            </div>
        `;
    }
}

function processTricks(data) {
    data.forEach(trick => {
        // Clean up title and extract category
        let rawTitle = trick.title || "";
        // Match things like "1 - Topic", "2 – Topic"
        let parts = rawTitle.split(/[-–—]+/);
        
        let trickNum = trick.id;
        let category = "General";
        
        if (parts.length > 1) {
            trickNum = parts[0].trim();
            category = parts.slice(1).join('-').trim();
        } else {
            category = "General Tricks";
        }
        
        trick.cleanNumber = trickNum;
        trick.category = category;
        categories.add(category);
    });
}

function renderCategories() {
    const sidebar = document.getElementById('category-list');
    
    // Convert set to array and sort
    const sortedCategories = Array.from(categories).sort();
    
    let html = `
        <div class="trick-category-link active" data-category="all">
            <span>All Topics</span>
            <span style="opacity:0.5; font-size:0.85rem">${tricksData.length}</span>
        </div>
    `;
    
    sortedCategories.forEach(cat => {
        const count = tricksData.filter(t => t.category === cat).length;
        html += `
            <div class="trick-category-link" data-category="${cat}">
                <span>${cat}</span>
                <span style="opacity:0.5; font-size:0.85rem">${count}</span>
            </div>
        `;
    });
    
    sidebar.innerHTML = html;
}

function renderTricks(dataToRender) {
    const grid = document.getElementById('tricks-grid');
    
    if (dataToRender.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 4rem;">
                <span style="font-size: 2rem; margin-bottom: 1rem; display: block;">🔍</span>
                <p>No tricks found matching your search.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    dataToRender.forEach(trick => {
        // First line of content is usually the trick title
        let contentLines = (trick.content || "").split('\n');
        let specificHeading = contentLines.length > 0 ? contentLines[0].trim() : trick.category;
        
        // The rest is content
        let restOfContent = contentLines.slice(1).join('\n');
        
        // Format content beautifully, extracting Question / Answer if they exist
        let contentHtml = formatContent(restOfContent);
        
        html += `
            <div class="trick-card">
                <div class="trick-title">${trick.category}</div>
                <h3 style="font-size: 1.2rem; color: #fff; margin-bottom: 0.8rem;">${specificHeading}</h3>
                <div class="trick-body">${contentHtml}</div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

function formatContent(text) {
    if (!text) return "";
    
    // Try to highlight "Question:" and "Answer:"
    let formatted = text
        .replace(/(Question[:]*)/gi, '<strong style="color:var(--accent-secondary); display:block; margin-top:1rem; margin-bottom:0.2rem;">📝 $1</strong>')
        .replace(/(Answer[:]*)/gi, '<strong style="color:var(--accent-primary); display:block; margin-top:1rem; margin-bottom:0.2rem;">💡 $1</strong>')
        .replace(/(Solution[:]*)/gi, '<strong style="color:var(--accent-primary); display:block; margin-top:1rem; margin-bottom:0.2rem;">💡 $1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
        
    return `<p>${formatted}</p>`;
}

function setupEventListeners() {
    // Search
    document.getElementById('trick-search').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        let filtered = tricksData;
        
        if (currentFilter !== 'all') {
            filtered = filtered.filter(t => t.category === currentFilter);
        }
        
        if (query) {
            filtered = filtered.filter(t => 
                (t.content && t.content.toLowerCase().includes(query)) || 
                (t.category && t.category.toLowerCase().includes(query))
            );
        }
        
        renderTricks(filtered);
    });
    
    // Category Filtering
    document.getElementById('category-list').addEventListener('click', (e) => {
        const link = e.target.closest('.trick-category-link');
        if (!link) return;
        
        // Update active class
        document.querySelectorAll('.trick-category-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        const category = link.dataset.category;
        currentFilter = category;
        
        // Clear search
        document.getElementById('trick-search').value = '';
        
        if (category === 'all') {
            renderTricks(tricksData);
        } else {
            const filtered = tricksData.filter(t => t.category === category);
            renderTricks(filtered);
        }
        
        // Scroll to top of grid
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}
