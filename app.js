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
        if (state.currentCategory !== 'dashboard' && state.questions.length > 0) {
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
    } else {
        await loadCategoryData(category);
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

// Start app
init();
