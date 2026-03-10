const state = {
    currentCategory: 'dashboard',
    questions: [],
    answeredQuestions: JSON.parse(localStorage.getItem('prep_answered')) || {},
    loadedData: {},
    timer: 0,
    timerInterval: null,
    currentPage: 1,
    itemsPerPage: 50
};

// DOM Elements
const sidebar = document.getElementById('sidebar');
const contentArea = document.getElementById('content-area');
const searchInput = document.getElementById('question-search');
const timerDisplay = document.getElementById('session-timer');
const menuToggle = document.getElementById('mobile-menu-toggle');
const sidebarOverlay = document.getElementById('sidebar-overlay');

// Initialize
function init() {
    setupEventListeners();
    renderDashboard();
    // Timer state will be managed per category
}

function setupEventListeners() {
    // Sidebar Navigation
    sidebar.addEventListener('click', (e) => {
        const navItem = e.target.closest('.nav-item');
        if (navItem) {
            const category = navItem.dataset.category;
            switchCategory(category);
        }
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (state.currentCategory !== 'dashboard' && state.currentCategory !== 'input-guide' && state.questions.length > 0) {
            filterQuestions(query);
        }
    });

    // Global click for shortcut cards in dashboard
    document.addEventListener('click', (e) => {
        const shortcutCard = e.target.closest('.shortcut-card');
        if (shortcutCard && shortcutCard.dataset.category) {
            switchCategory(shortcutCard.dataset.category);
        }
    });

    // Mobile Menu Toggling
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', toggleSidebar);
    }
}

function toggleSidebar() {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');

    // Hamburger animation
    if (menuToggle) {
        menuToggle.classList.toggle('active');
    }
}

function startTimer() {
    if (state.timerInterval) return;
    state.timerInterval = setInterval(() => {
        state.timer++;
        const timeStr = formatTime(state.timer);
        timerDisplay.textContent = timeStr;

        // Update header timer if present
        const headerTimer = document.querySelector('#header-timer .timer-val');
        if (headerTimer) headerTimer.textContent = timeStr;
    }, 1000);
}

function formatTime(totalSeconds) {
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function switchCategory(category) {
    if (!category || category === state.currentCategory) return;

    // Update active class
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.category === category);
    });

    state.currentCategory = category;
    state.currentPage = 1;

    if (category === 'dashboard') {
        renderDashboard();
    } else if (category === 'input-guide') {
        renderInputGuide();
    } else {
        await loadCategoryData(category);
    }

    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
        toggleSidebar();
    }
}

async function loadCategoryData(category) {
    contentArea.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading ${category} questions...</p>
        </div>
    `;

    try {
        if (!state.loadedData[category]) {
            const cacheBust = category === 'practice' ? `?v=${Date.now()}` : '';
            const response = await fetch(`./data/${category}.json${cacheBust}`);
            const data = await response.json();

            if (category === 'practice') {
                // For practice, we can either shuffle all or focus on specific papers
                state.loadedData[category] = data.questions || [];
            } else {
                state.loadedData[category] = data.questions || data;
            }
        }

        state.questions = shuffleArray([...(state.loadedData[category] || [])]);

        console.log(`Loaded ${state.questions.length} questions for ${category}`);

        if (category === 'practice' && state.questions.length > 0) {
            renderPracticeLanding();
        } else {
            renderQuestions(state.questions);
        }
    } catch (error) {
        console.error('Error loading data:', error);
        contentArea.innerHTML = `<div class="error-state">
            <span class="error-icon">⚠️</span>
            <h3>Data Load Failed</h3>
            <p>We couldn't fetch the questions for this category. Please check your connection or try again.</p>
            <button class="shortcut-card" onclick="location.reload()">Reload Application</button>
        </div>`;
    }
}

function renderDashboard() {
    const template = document.getElementById('dashboard-template');
    const content = template.content.cloneNode(true);

    // Update stats
    const totalAnswered = Object.keys(state.answeredQuestions).length;
    content.querySelector('#answered-count').textContent = totalAnswered;

    const progress = (totalAnswered / 1000) * 100;
    content.querySelector('#overall-progress').style.width = `${progress}%`;

    contentArea.innerHTML = '';
    contentArea.appendChild(content);
}

function renderQuestions(questionsToRender) {
    contentArea.innerHTML = `
        <div class="category-header">
            <div class="header-main">
                ${state.currentCategory === 'practice' ? '<button class="back-btn-minimal" id="back-to-papers"><span class="icon">←</span> Back to selection</button>' : ''}
                <h2>${state.currentCategory === 'practice' ? 'Mock Test' : state.currentCategory.charAt(0).toUpperCase() + state.currentCategory.slice(1)} Preparation</h2>
                <p>Curated Collection • ${questionsToRender.length} Questions</p>
            </div>
            <div class="header-actions">
                <div class="header-timer" id="header-timer" style="display: ${state.timerInterval ? 'flex' : 'none'}">
                    <span class="timer-label">⏱️ SESSION TIME</span>
                    <span class="timer-val">${formatTime(state.timer)}</span>
                </div>
                ${!state.timerInterval ? '<button class="start-session-btn" id="start-header-timer">▶ Start Practice</button>' : ''}
            </div>
        </div>
        <div class="question-list" id="question-list-container"></div>
    `;

    if (state.currentCategory === 'practice') {
        const backBtn = document.getElementById('back-to-papers');
        if (backBtn) {
            backBtn.onclick = () => renderPracticeLanding();
        }
    }

    const startBtn = document.getElementById('start-header-timer');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            startTimer();
            renderQuestions(questionsToRender);
        });
    }

    const container = document.getElementById('question-list-container');
    if (!container) return;

    // For performance, we'll implement a simple "Load More" or pagination later
    // For now, let's render the first 15 questions
    const itemsToShow = questionsToRender.slice(0, state.currentPage * state.itemsPerPage);

    itemsToShow.forEach((q, index) => {
        let qCard;
        if (state.currentCategory === 'coding') {
            qCard = createCodingCard(q, index);
        } else {
            qCard = createQuestionCard(q, index);
        }
        container.appendChild(qCard);
    });

    if (questionsToRender.length > itemsToShow.length) {
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'load-more-btn';
        loadMoreBtn.type = 'button';
        loadMoreBtn.style.width = '100%';
        loadMoreBtn.style.marginTop = '1rem';
        loadMoreBtn.textContent = `Load More Questions (Showing ${itemsToShow.length} of ${questionsToRender.length})`;
        loadMoreBtn.onclick = (e) => {
            e.stopPropagation();
            const previousCount = itemsToShow.length;
            state.currentPage++;
            renderQuestions(questionsToRender);

            // Scroll to the first newly added question
            const newContainer = document.getElementById('question-list-container');
            if (newContainer && newContainer.children[previousCount]) {
                newContainer.children[previousCount].scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };
        container.appendChild(loadMoreBtn);
    } else if (questionsToRender.length === 0) {
        container.innerHTML = `
            <div class="error-state">
                <span class="error-icon">🔍</span>
                <h3>No Questions Found</h3>
                <p>Try adjusting your search query or select another category.</p>
            </div>
        `;
    }
}

function createQuestionCard(q, index) {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.id = `q-${q.id}`;

    const isAnswered = state.answeredQuestions[`${state.currentCategory}-${q.id}`];

    card.innerHTML = `
        <div class="question-header">
            <div class="tag-container">
                <span class="tag tag-difficulty">${q.tags || 'General'}</span>
            </div>
            <div class="q-number">Question #${index + 1}</div>
        </div>
        <div class="question-text">${q.question}</div>
        ${q.code_snippet ? `<pre class="code-block">${q.code_snippet}</pre>` : ''}
        <div class="options-grid">
            ${q.options ? Object.entries(q.options).map(([key, val]) => `
                <div class="option" data-key="${key}">
                    <div class="option-marker">${key}</div>
                    <div class="option-text">${val}</div>
                </div>
            `).join('') : '<p>No options available.</p>'}
        </div>
        <div class="solution-panel" style="display: ${isAnswered ? 'block' : 'none'}">
            <div class="solution-tabs">
                <button class="tab-btn active" data-tab="detailed"><span>🔍</span> Solution</button>
                <button class="tab-btn" data-tab="memory"><span>💡</span> Memory Tip</button>
                <button class="tab-btn" data-tab="pro"><span>🚀</span> Pro Tip</button>
            </div>
            <div class="solution-content">
                ${q.explanation ? formatExplanationContent(q.explanation.detailed, 'detailed') : '<div class="solution-text">No explanation available.</div>'}
            </div>
        </div>
    `;

    // Add event listeners for options
    const options = card.querySelectorAll('.option');
    options.forEach(opt => {
        opt.addEventListener('click', () => {
            if (card.classList.contains('answered')) return;
            handleAnswer(card, opt, q);
        });
    });

    // Add event listeners for solution tabs
    const solTabs = card.querySelectorAll('.tab-btn');
    solTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.stopPropagation();
            solTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const contentDiv = card.querySelector('.solution-content');
            const type = tab.dataset.tab;
            let rawContent = '';

            if (type === 'detailed') rawContent = q.explanation ? q.explanation.detailed : 'No explanation available.';
            if (type === 'memory') rawContent = q.explanation ? (q.explanation.memory_trick || q.explanation.short || 'Try to visualize the concept.') : 'Try to visualize the concept.';
            if (type === 'pro') rawContent = q.explanation ? (q.pro_tip || q.explanation.short || 'Focus on speed and accuracy.') : 'Focus on speed and accuracy.';

            contentDiv.innerHTML = formatExplanationContent(rawContent, type);
        });
    });

    if (isAnswered) {
        card.classList.add('answered');
        const savedAnswer = isAnswered.answer;
        const correct = q.correct_answer;

        card.querySelectorAll('.option').forEach(opt => {
            if (opt.dataset.key === correct) {
                opt.classList.add('correct');
                opt.querySelector('.option-marker').innerHTML = '✓';
            } else if (opt.dataset.key === savedAnswer) {
                opt.classList.add('wrong');
                opt.querySelector('.option-marker').innerHTML = '✕';
            }
        });
    }

    return card;
}

function createCodingCard(p, index) {
    const card = document.createElement('div');
    card.className = 'question-card coding-card';
    card.id = `p-${p.id}`;

    card.innerHTML = `
        <div class="question-header">
            <div class="tag-container">
                <span class="tag tag-difficulty">Coding Challenge</span>
                <span class="tag tag-difficulty">${p.difficulty || 'Easy'}</span>
            </div>
            <div class="q-number">Problem #${index + 1}</div>
        </div>
        <div class="problem-statement">
            <h3>${p.title || 'Problem Description'}</h3>
            <div class="description">${p.problem_statement || p.question || 'No description available.'}</div>
            
            ${p.constraints ? `
                <div class="section-title">Constraints</div>
                <div class="code-block">${p.constraints}</div>
            ` : ''}

            <div class="io-grid">
                <div class="io-section">
                    <div class="section-title">Sample Input</div>
                    <pre class="code-block">${p.sample_input || 'Standard Input'}</pre>
                </div>
                <div class="io-section">
                    <div class="section-title">Sample Output</div>
                    <pre class="code-block">${p.sample_output || 'Standard Output'}</pre>
                </div>
            </div>
        </div>

        <div class="solution-panel" style="display: block; margin-top: 2rem;">
            <div class="solution-tabs">
                <button class="tab-btn active" data-tab="python"><span>🐍</span> Python 3</button>
                <button class="tab-btn" data-tab="java"><span>☕</span> Java (JDK 17)</button>
                <button class="tab-btn" data-tab="logic"><span>🧠</span> Approach</button>
            </div>
            <div class="solution-content">
                <pre class="code-editor">${p.solutions && p.solutions.python ? p.solutions.python.code : 'Python solution not available'}</pre>
            </div>
        </div>
    `;

    const tabs = card.querySelectorAll('.tab-btn');
    const pythonCode = p.solutions && p.solutions.python ? p.solutions.python.code : 'Python solution not available';
    const javaCode = p.solutions && p.solutions.java ? p.solutions.java.code : 'Java solution not available';
    const approach = p.approach ? `<strong>Brute Force:</strong> ${p.approach.brute_force}<br><br><strong>Optimal:</strong> ${p.approach.optimal}<br><br><strong>Algorithm:</strong> ${p.approach.algorithm}` : 'Focus on optimizing time and space complexity.';

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const content = card.querySelector('.solution-content');
            const type = tab.dataset.tab;
            if (type === 'python') content.innerHTML = `<pre class="code-editor">${pythonCode}</pre>`;
            if (type === 'java') content.innerHTML = `<pre class="code-editor">${javaCode}</pre>`;
            if (type === 'logic') content.innerHTML = `<div class="solution-text">${approach}</div>`;
        });
    });

    return card;
}

function handleAnswer(card, selectedOpt, q) {
    const selectedKey = selectedOpt.dataset.key;
    const correctKey = q.correct_answer;

    card.classList.add('answered');

    if (selectedKey === correctKey) {
        selectedOpt.classList.add('correct');
        selectedOpt.querySelector('.option-marker').innerHTML = '✓';
    } else {
        selectedOpt.classList.add('wrong');
        selectedOpt.querySelector('.option-marker').innerHTML = '✕';
        const correctOpt = card.querySelector(`.option[data-key="${correctKey}"]`);
        if (correctOpt) {
            correctOpt.classList.add('correct');
            correctOpt.querySelector('.option-marker').innerHTML = '✓';
        }
    }

    // Show solution
    card.querySelector('.solution-panel').style.display = 'block';

    // Save to state and localStorage
    state.answeredQuestions[`${state.currentCategory}-${q.id}`] = {
        answer: selectedKey,
        isCorrect: selectedKey === correctKey
    };
    localStorage.setItem('prep_answered', JSON.stringify(state.answeredQuestions));
}

function filterQuestions(query) {
    const filtered = state.questions.filter(q => {
        const questionText = (q.question || q.problem_statement || "").toLowerCase();
        const titleText = (q.title || "").toLowerCase();
        const explanationText = (q.explanation && q.explanation.detailed ? q.explanation.detailed : "").toLowerCase();

        return questionText.includes(query) ||
            titleText.includes(query) ||
            explanationText.includes(query);
    });
    state.currentPage = 1;
    renderQuestions(filtered);
}

function formatExplanationContent(content, type) {
    if (!content) return '<div class="solution-text">No information available.</div>';

    if (type === 'detailed') {
        const steps = content.split(/Step \d+:/g).filter(s => s.trim().length > 0);
        if (steps.length > 0) {
            let html = `
                <div class="solution-steps-header">
                    <span>Step-by-Step Analysis</span>
                    <div class="header-line"></div>
                </div>
                <div class="steps-timeline">
            `;
            html += steps.map((step, idx) => {
                const isLast = idx === steps.length - 1;
                return `
                    <div class="solution-step ${isLast ? 'final-step' : ''}" style="animation-delay: ${idx * 0.1}s">
                        <div class="step-indicator">
                            <div class="step-number">${idx + 1}</div>
                            ${!isLast ? '<div class="step-line"></div>' : ''}
                        </div>
                        <div class="step-content">
                            <div class="step-text">${step.trim().replace(/\n/g, '<br>')}</div>
                            ${isLast ? '<div class="final-badge-minimal">Final Result</div>' : ''}
                        </div>
                    </div>
                `;
            }).join('');
            html += '</div>';
            return html;
        }
    }

    if (type === 'memory') {
        return `
            <div class="tip-box">
                <div class="tip-header">
                    <span class="tip-icon">💡</span>
                    <span>Memory Tip</span>
                </div>
                <div class="tip-text">${content.replace(/\n/g, '<br>')}</div>
            </div>
        `;
    }

    if (type === 'pro') {
        return `
            <div class="tip-box pro">
                <div class="tip-header">
                    <span class="tip-icon">🚀</span>
                    <span>Pro Tip</span>
                </div>
                <div class="tip-text">${content.replace(/\n/g, '<br>')}</div>
            </div>
        `;
    }

    return `<div class="solution-text">${content.replace(/\n/g, '<br>')}</div>`;
}

function renderCategoryLanding(category) {
    const iconMap = {
        'numerical': '🔢',
        'verbal': '🗣️',
        'reasoning': '🧠',
        'programming': '💻',
        'coding': '⚙️',
        'practice': '📝'
    };

    const categoryNames = {
        'numerical': 'Numerical Ability',
        'verbal': 'Verbal Ability',
        'reasoning': 'Reasoning Ability',
        'programming': 'Programming MCQs',
        'coding': 'Coding Challenges',
        'practice': 'Mock Tests Aptitude'
    };

    contentArea.innerHTML = `
        <div class="category-landing">
            <div class="landing-card">
                <div class="landing-icon">${iconMap[category] || '📚'}</div>
                <h2>${categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1)}</h2>
                <p>Sharpen your skills with our curated set of questions specifically designed for TCS NQT and other top MNC exams.</p>
                
                <div class="landing-stats">
                    <div class="l-stat">
                        <span class="l-val">${state.questions.length}</span>
                        <span class="l-lab">Questions</span>
                    </div>
                    <div class="l-stat">
                        <span class="l-val">~${Math.round(state.questions.length * 1.5)} min</span>
                        <span class="l-lab">Suggested Time</span>
                    </div>
                </div>

                <div class="landing-actions">
                    <button class="start-btn" id="start-section-btn">Start Practice</button>
                </div>
            </div>
        </div>
    `;

    if (!state.timerInterval) {
        startTimer();
    }
    renderQuestions(state.questions);
}

function renderPracticeLanding() {
    const papers = [...new Set(state.questions.map(q => q.paper_id || 1))].sort((a, b) => a - b);
    console.log(`Debug: Found ${papers.length} unique papers. IDs: ${papers.join(', ')}`);

    // Default to Paper 1 if only one or no paper_id found
    if (papers.length === 0) papers.push(1);

    contentArea.innerHTML = `
        <div class="category-header">
            <div class="header-main">
                <h2>Mock Tests Aptitude</h2>
                <p>10 Complete Practice Papers</p>
            </div>
        </div>
        <div class="papers-grid">
            ${papers.map(p => {
        const paperQuestions = state.questions.filter(q => (q.paper_id || 1) === p);
        const approxTime = Math.ceil(paperQuestions.length * 1.5);
        return `
                    <div class="paper-card" onclick="startPaper(${p})">
                        <div class="paper-badge">Paper ${p}</div>
                        <h3>Mock Test #${p}</h3>
                        <p>${paperQuestions.length} Questions</p>
                        <div class="paper-meta">
                            <span>⏱️ ~${approxTime} Mins</span>
                            <span>🏆 TCS-NQT Pattern</span>
                        </div>
                        <button class="start-paper-btn">Start Test</button>
                    </div>
                `;
    }).join('')}
        </div>
    `;
}

function startPaper(paperId) {
    const paperQuestions = state.questions.filter(q => (q.paper_id || 1) === paperId);
    state.timer = 0;
    startTimer();
    renderQuestions(paperQuestions);
}

function renderInputGuide() {
    contentArea.innerHTML = `
        <div class="article-container">
            <header class="article-header">
                <div class="article-badge">Coding Fundamentals</div>
                <h1>TCS NQT 2026 — How to Take Input</h1>
                <p class="subtitle">Super Simple Guide — Anyone Can Understand!</p>
            </header>

            <div class="article-video-section">
                <div class="video-grid">
                    <div class="video-card">
                        <div class="video-wrapper">
                            <iframe src="https://www.youtube.com/embed/TfZrr1ruex8?si=tJN6A0Zny5ucBNva" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                        </div>
                        <div class="video-info">
                            <p>For more understanding, refer to this video</p>
                        </div>
                    </div>
                    <div class="video-card">
                        <div class="video-wrapper">
                            <iframe src="https://www.youtube.com/embed/K-Y3KoHZuI0?si=BU3GEw5Mys6MvfCP" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                        </div>
                        <div class="video-info">
                            <p>Detailed coding walkthrough</p>
                        </div>
                    </div>
                </div>
            </div>

            <section class="article-section">
                <div class="concept-card highlight-card">
                    <h3>🤔 FIRST — WHAT IS INPUT?</h3>
                    <p>Think like this —</p>
                    <div class="analogy-box">
                        <div class="analogy-item">
                            <span class="icon">🏪</span>
                            <p>You go to a shop</p>
                        </div>
                        <div class="analogy-arrow">➜</div>
                        <div class="analogy-item">
                            <span class="icon">🗣️</span>
                            <p>You say — "Bhaiya ek Parle-G do!"</p>
                        </div>
                        <div class="analogy-arrow">➜</div>
                        <div class="analogy-item">
                            <span class="icon">🍪</span>
                            <p>Shopkeeper hears order and gives biscuit!</p>
                        </div>
                    </div>

                    <p style="margin-top: 1.5rem;">Or another example —</p>
                    <div class="analogy-box">
                        <div class="analogy-item">
                            <span class="icon">🍊</span>
                            <p>You put Fruits in Mixer</p>
                        </div>
                        <div class="analogy-arrow">➜</div>
                        <div class="analogy-item">
                            <span class="icon">⚙️</span>
                            <p>Mixer processes it</p>
                        </div>
                        <div class="analogy-arrow">➜</div>
                        <div class="analogy-item">
                            <span class="icon">🥤</span>
                            <p>You get Juice as result!</p>
                        </div>
                    </div>
                    <div class="logic-flow">
                        <p><strong>You give information to computer</strong> = INPUT</p>
                        <p><strong>Computer gives answer back</strong> = OUTPUT</p>
                    </div>
                </div>
            </section>

            <section class="article-section">
                <div class="importance-card">
                    <h3>🎯 WHY IS INPUT IMPORTANT IN TCS NQT?</h3>
                    <p>Imagine you are solving a maths problem —</p>
                    <ul>
                        <li>Teacher gives you numbers on paper ✏️</li>
                        <li>You read those numbers and solve it!</li>
                    </ul>
                    <div class="warning-box">
                        <p>Computer reads your numbers through <strong>INPUT</strong>! If you don't read correctly — answer will be <strong>WRONG</strong>, even if your logic is 100% correct! 😱</p>
                    </div>
                </div>
            </section>

            <div class="tabs-container article-tabs">
                <div class="tab-triggers">
                    <button class="tab-trigger active" data-target="python-guide">🐍 Python Guide</button>
                    <button class="tab-trigger" data-target="java-guide">☕ Java Guide</button>
                </div>
                
                <div class="tab-content active" id="python-guide">
                    <div class="step-guide">
                        <div class="guide-item">
                            <h4>Step 1 — Taking One Number</h4>
                            <p class="example-text">"Teacher asks — how many students are in your class?" ➜ "30!"</p>
                            <pre class="code-block"><code>n = int(input())</code></pre>
                            <div class="explanation-small">
                                <span><strong>input()</strong> = Computer asking something</span>
                                <span><strong>int()</strong> = Converting to a number</span>
                                <span><strong>n</strong> = Storing your answer</span>
                            </div>
                        </div>

                        <div class="guide-item">
                            <h4>Step 2 — Taking One Word or Sentence</h4>
                            <p class="example-text">"Teacher asks — what is your name?" ➜ "Raju!"</p>
                            <pre class="code-block"><code>name = input()</code></pre>
                        </div>

                        <div class="guide-item">
                            <h4>Step 3 — Taking Two Numbers at Once</h4>
                            <p class="example-text">"Teacher asks — tell me length and width!" ➜ "30 20!"</p>
                            <pre class="code-block"><code>a, b = map(int, input().split())</code></pre>
                            <div class="explanation-small">
                                <span><strong>split()</strong> = Separating 30 and 20</span>
                                <span><strong>map(int)</strong> = Converting both to numbers</span>
                            </div>
                        </div>

                        <div class="guide-item">
                            <h4>Step 4 — Taking a List of Numbers</h4>
                            <p class="example-text">"Marks of 5 students" ➜ "90 85 78 92 88"</p>
                            <pre class="code-block"><code>arr = list(map(int, input().split()))</code></pre>
                        </div>

                        <div class="guide-item pattern-highlight">
                            <h4>Step 5 — Most Common TCS NQT Pattern</h4>
                            <p class="example-text">"First tell me how many students (n), then tell me their marks!"</p>
                            <pre class="code-block"><code>n = int(input())
arr = list(map(int, input().split()))</code></pre>
                        </div>
                    </div>
                </div>

                <div class="tab-content" id="java-guide">
                    <div class="step-guide">
                        <div class="guide-item">
                            <h4>Step 1 — Getting Ready (The Scanner)</h4>
                            <p>Think like this: Before eating, you need a plate and spoon! In Java, you need a <strong>Scanner</strong>.</p>
                            <pre class="code-block"><code>import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Your code here
    }
}</code></pre>
                        </div>

                        <div class="guide-item">
                            <h4>Step 2 — Taking One Number</h4>
                            <pre class="code-block"><code>int n = sc.nextInt();</code></pre>
                        </div>

                        <div class="guide-item">
                            <h4>Step 3 — Taking One Word</h4>
                            <pre class="code-block"><code>String name = sc.next();</code></pre>
                        </div>

                        <div class="guide-item">
                            <h4>Step 4 — Taking Two Numbers</h4>
                            <pre class="code-block"><code>int a = sc.nextInt();
int b = sc.nextInt();</code></pre>
                        </div>

                        <div class="guide-item pattern-highlight">
                            <h4>Step 5 — Taking List of Numbers</h4>
                            <pre class="code-block"><code>int n = sc.nextInt();
int[] arr = new int[n];
for(int i = 0; i < n; i++){
    arr[i] = sc.nextInt();
}</code></pre>
                        </div>
                    </div>
                </div>
            </div>

            <section class="article-section">
                <h2 class="section-title center">🎯 5 MOST COMMON TCS NQT PATTERNS</h2>
                <div class="patterns-container">
                    <div class="pattern-box">
                        <div class="pattern-header">Pattern 1 — Just One Number</div>
                        <div class="pattern-io">Input: 5</div>
                        <div class="pattern-grid">
                            <div class="lang-code">
                                <span>🐍 Python</span>
                                <pre><code>n = int(input())</code></pre>
                            </div>
                            <div class="lang-code">
                                <span>☕ Java</span>
                                <pre><code>int n = sc.nextInt();</code></pre>
                            </div>
                        </div>
                    </div>

                    <div class="pattern-box">
                        <div class="pattern-header">Pattern 2 — Two Numbers Same Line</div>
                        <div class="pattern-io">Input: 5 10</div>
                        <div class="pattern-grid">
                            <div class="lang-code">
                                <span>🐍 Python</span>
                                <pre><code>a, b = map(int, input().split())</code></pre>
                            </div>
                            <div class="lang-code">
                                <span>☕ Java</span>
                                <pre><code>int a = sc.nextInt();
int b = sc.nextInt();</code></pre>
                            </div>
                        </div>
                    </div>

                    <div class="pattern-box">
                        <div class="pattern-header">Pattern 3 — List of Numbers</div>
                        <div class="pattern-io">Input: 5 \n 1 2 3 4 5</div>
                        <div class="pattern-grid">
                            <div class="lang-code">
                                <span>🐍 Python</span>
                                <pre><code>n = int(input())
arr = list(map(int, input().split()))</code></pre>
                            </div>
                            <div class="lang-code">
                                <span>☕ Java</span>
                                <pre><code>int n = sc.nextInt();
int[] arr = new int[n];
for(int i = 0; i < n; i++) {
    arr[i] = sc.nextInt();
}</code></pre>
                            </div>
                        </div>
                    </div>
                    
                    <div class="pattern-box">
                        <div class="pattern-header">Pattern 4 — Table of Numbers (Matrix)</div>
                        <div class="pattern-io">Input: 3 3 \n 1 2 3...</div>
                        <div class="pattern-grid">
                            <div class="lang-code">
                                <span>🐍 Python</span>
                                <pre><code>r, c = map(int, input().split())
matrix = []
for i in range(r):
    row = list(map(int, input().split()))
    matrix.append(row)</code></pre>
                            </div>
                            <div class="lang-code">
                                <span>☕ Java</span>
                                <pre><code>int r = sc.nextInt();
int c = sc.nextInt();
int[][] matrix = new int[r][c];
for(int i = 0; i < r; i++){
    for(int j = 0; j < c; j++){
        matrix[i][j] = sc.nextInt();
    }
}</code></pre>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="article-section">
                <h2 class="section-title">❌ COMMON MISTAKES — DON'T DO THIS!</h2>
                <div class="table-scroll">
                    <table class="mistake-table">
                        <thead>
                            <tr>
                                <th>Mistake</th>
                                <th>❌ Wrong</th>
                                <th>✅ Right</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Forgetting <strong>int</strong> in Python</td>
                                <td class="wrong-val">input()</td>
                                <td class="right-val">int(input())</td>
                            </tr>
                            <tr>
                                <td>Forgetting <strong>Scanner</strong> in Java</td>
                                <td class="wrong-val">sc.nextInt() directly</td>
                                <td class="right-val">import Scanner first</td>
                            </tr>
                            <tr>
                                <td>Forgetting <strong>split()</strong></td>
                                <td class="wrong-val">map(int, input())</td>
                                <td class="right-val">map(int, input().split())</td>
                            </tr>
                            <tr>
                                <td>Forgetting <strong>list()</strong></td>
                                <td class="wrong-val">map(int, input().split())</td>
                                <td class="right-val">list(map(int, input().split()))</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section class="article-section golden-rules">
                <h2 class="section-title">✅ GOLDEN RULES — REMEMBER ALWAYS!</h2>
                <div class="rules-grid">
                    <div class="rule-card python">
                        <h3>🐍 Python Rules</h3>
                        <ul>
                            <li><span>1</span> One number = <code>int(input())</code></li>
                            <li><span>2</span> One word = <code>input()</code></li>
                            <li><span>3</span> Many numbers = <code>list(map(int, input().split()))</code></li>
                            <li><span>4</span> Two numbers = <code>a, b = map(int, input().split())</code></li>
                            <li><span>5</span> Size + List = Always use two lines!</li>
                        </ul>
                    </div>
                    <div class="rule-card java">
                        <h3>☕ Java Rules</h3>
                        <ul>
                            <li><span>1</span> Always import Scanner first!</li>
                            <li><span>2</span> One number = <code>sc.nextInt()</code></li>
                            <li><span>3</span> One word = <code>sc.next()</code></li>
                            <li><span>4</span> Many numbers = use loop with <code>sc.nextInt()</code></li>
                            <li><span>5</span> Never forget: <code>Scanner sc = new Scanner(System.in)</code></li>
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    `;

    // Add tab functionality
    const triggers = document.querySelectorAll('.tab-trigger');
    const contents = document.querySelectorAll('.tab-content');

    triggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const target = trigger.dataset.target;
            triggers.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            trigger.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Start app
init();
