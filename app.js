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
    checkDevice();
}

function checkDevice() {
    const banner = document.getElementById('desktop-recommendation');
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 1024;
    const isDismissed = localStorage.getItem('device_banner_dismissed');

    if (isMobile && !isDismissed && banner) {
        setTimeout(() => {
            banner.classList.add('show');
        }, 2000);
    }

    if (banner) {
        const closeBtn = document.getElementById('close-banner');
        const dismiss = () => {
            banner.classList.remove('show');
            localStorage.setItem('device_banner_dismissed', 'true');
        };
        
        if (closeBtn) closeBtn.onclick = dismiss;
        banner.onclick = (e) => {
            if (e.target === banner) dismiss();
        };
    }
}

function setupEventListeners() {
    // Sidebar Navigation
    sidebar.addEventListener('click', (e) => {
        const navItem = e.target.closest('.nav-item');
        if (navItem) {
            const category = navItem.dataset.category;
            switchCategory(category);
            
            // Auto close sidebar on mobile
            if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
                toggleSidebar();
            }
        }
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (state.currentCategory !== 'dashboard' && state.currentCategory !== 'input-guide' && state.questions.length > 0) {
            filterQuestions(query);
        }
    });

    // Global click for shortcut cards and alert banners in dashboard
    document.addEventListener('click', (e) => {
        const clickable = e.target.closest('.shortcut-card, .alert-banner');
        if (clickable && clickable.dataset.category) {
            switchCategory(clickable.dataset.category);
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

        if (category === 'shortcuts-practice') {
            state.questions = [...(state.loadedData[category] || [])];
        } else {
            state.questions = shuffleArray([...(state.loadedData[category] || [])]);
        }

        console.log(`Loaded ${state.questions.length} questions for ${category}`);

        if (category === 'practice' && state.questions.length > 0) {
            renderPracticeLanding();
        } else if (category === 'shortcuts-practice' && state.questions.length > 0) {
            renderShortcutsPracticeLanding();
        } else if (category === 'input-practice') {
            renderInputPractice(state.questions);
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
                ${state.currentCategory === 'practice' || state.currentCategory === 'shortcuts-practice' ? '<button class="back-btn-minimal" id="back-to-papers"><span class="icon">←</span> Back to selection</button>' : ''}
                <h2>${state.currentCategory === 'practice' ? 'Mock Test' : state.currentCategory === 'shortcuts-practice' ? 'Shortcuts' : state.currentCategory.charAt(0).toUpperCase() + state.currentCategory.slice(1)} Preparation</h2>
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
    
    if (state.currentCategory === 'shortcuts-practice') {
        const backBtn = document.getElementById('back-to-papers');
        if (backBtn) {
            backBtn.onclick = () => renderShortcutsPracticeLanding();
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
        if (state.currentCategory === 'coding' || state.currentCategory === 'scenario') {
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
    } else {
        if (state.currentCategory === 'shortcuts-practice' && !state.testSubmitted) {
            const submitBtn = document.createElement('button');
            submitBtn.className = 'start-session-btn submit-test-btn';
            submitBtn.style.marginTop = '2rem';
            submitBtn.style.width = '100%';
            submitBtn.textContent = 'Submit Test & View Results';
            submitBtn.onclick = () => submitShortcutsTest();
            container.appendChild(submitBtn);
        } else if (state.currentCategory === 'shortcuts-practice' && state.testSubmitted) {
            const returnedBtn = document.createElement('button');
            returnedBtn.className = 'shortcut-card';
            returnedBtn.style.textAlign = 'center';
            returnedBtn.style.marginTop = '2rem';
            returnedBtn.style.width = '100%';
            returnedBtn.textContent = 'Return to Categories';
            returnedBtn.onclick = () => renderShortcutsPracticeLanding();
            container.appendChild(returnedBtn);
        }
    }
}

function createQuestionCard(q, index) {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.id = `q-${q.id}`;

    const isTestMode = state.currentCategory === 'shortcuts-practice';
    const isAnswered = isTestMode ? state.testSubmitted : state.answeredQuestions[`${state.currentCategory}-${q.id}`];
    const savedAnswer = isTestMode 
        ? (state.testAnswers && state.testAnswers[q.id] ? state.testAnswers[q.id].answer : null) 
        : (state.answeredQuestions[`${state.currentCategory}-${q.id}`] ? state.answeredQuestions[`${state.currentCategory}-${q.id}`].answer : null);

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
                <div class="option ${savedAnswer === key && !isAnswered ? 'selected' : ''}" data-key="${key}">
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

    if (state.currentCategory === 'shortcuts-practice') {
        card.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
        selectedOpt.classList.add('selected');
        
        state.testAnswers = state.testAnswers || {};
        state.testAnswers[q.id] = {
            answer: selectedKey,
            isCorrect: selectedKey === correctKey
        };
        return;
    }

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
        'scenario': '🧩',
        'shortcuts-practice': '⚡',
        'practice': '📝'
    };

    const categoryNames = {
        'numerical': 'Numerical Ability',
        'verbal': 'Verbal Ability',
        'reasoning': 'Reasoning Ability',
        'programming': 'Programming MCQs',
        'coding': 'Coding Challenges',
        'scenario': 'Scenario Based',
        'shortcuts-practice': 'Shortcuts Practice',
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

function renderShortcutsPracticeLanding() {
    const papers = [...new Set(state.questions.map(q => q.category))];
    contentArea.innerHTML = `
        <div class="category-header">
            <div class="header-main">
                <h2>Shortcuts Practice</h2>
                <p>Official Memory Based TCS NQT 2020 Questions</p>
            </div>
        </div>
        <div class="papers-grid">
            ${papers.map(p => {
                const paperQuestions = state.questions.filter(q => q.category === p);
                const approxTime = Math.ceil(paperQuestions.length * 1.5);
                return `<div class="paper-card" onclick="startShortcutsPaper('${p}')">
                    <h3>${p}</h3>
                    <p>${paperQuestions.length} Questions</p>
                    <div class="paper-meta">
                        <span>⏱️ ~${approxTime} Mins</span>
                        <span>🏆 2020 Memory Based</span>
                    </div>
                    <button class="start-paper-btn">Start Practice</button>
                </div>`
            }).join('')}
        </div>
    `;
}

function startShortcutsPaper(category) {
    const paperQuestions = state.questions.filter(q => q.category === category);
    state.testAnswers = {};
    state.testSubmitted = false;
    state.timer = 0;
    startTimer();
    state.currentPage = 1;
    renderQuestions(paperQuestions);
}

function submitShortcutsTest() {
    state.testSubmitted = true;
    stopTimer();
    
    // Save all to answeredQuestions so it persists or just re-render
    if (state.testAnswers) {
        Object.keys(state.testAnswers).forEach(qId => {
            state.answeredQuestions[`shortcuts-practice-${qId}`] = state.testAnswers[qId];
        });
        localStorage.setItem('prep_answered', JSON.stringify(state.answeredQuestions));
    }
    
    // Re-render questions to show correct/wrong states
    renderQuestions(state.questions.filter(q => q.category === state.questions[0].category));
    
    // Calculate Score
    const total = Object.keys(state.testAnswers || {}).length;
    const correct = Object.values(state.testAnswers || {}).filter(a => a.isCorrect).length;
    
    // Show results
    contentArea.insertAdjacentHTML('afterbegin', `
        <div class="result-banner" style="background: linear-gradient(135deg, #1A202C 0%, #2D3748 100%); padding: 2rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 2rem; text-align: center; animation: fadeIn 0.5s ease;">
            <h2 style="color: #EAB308; margin-bottom: 0.5rem; font-size: 2rem;">Test Submitted!</h2>
            <p style="color: #A0AEC0; font-size: 1.1rem; margin-bottom: 1.5rem;">Here is how you did on the ${state.questions[0].category} test</p>
            <div style="display: flex; justify-content: center; gap: 2rem;">
                <div style="background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px; min-width: 120px;">
                    <div style="font-size: 2.5rem; color: white; font-weight: 700;">${correct}</div>
                    <div style="color: #48BB78; font-size: 0.9rem; margin-top: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Correct</div>
                </div>
                <div style="background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px; min-width: 120px;">
                    <div style="font-size: 2.5rem; color: white; font-weight: 700;">${total}</div>
                    <div style="color: #A0AEC0; font-size: 0.9rem; margin-top: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">Attempted</div>
                </div>
            </div>
            <button class="start-session-btn" style="margin-top: 2rem;" onclick="renderShortcutsPracticeLanding()">Return to Categories</button>
        </div>
    `);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

function renderInputPractice(questions) {
    contentArea.innerHTML = `
        <div class="category-header">
            <div class="header-main">
                <h2>Input Master — Practice Room</h2>
                <p>Learn TCS NQT patterns by doing. Try the problems and check your logic!</p>
            </div>
        </div>
        <div class="practice-layout">
            <aside class="practice-nav" id="practice-nav">
                <div class="nav-title">SESSIONS</div>
                <div class="nav-list">
                    ${questions.map((q, idx) => `
                        <button class="practice-nav-item ${idx === 0 ? 'active' : ''}" data-id="${q.id}">
                            <div class="item-icon">${idx + 1}</div>
                            <div class="item-info">
                                <span class="title">${q.title}</span>
                                <span class="tag">Pattern Master</span>
                            </div>
                        </button>
                    `).join('')}
                </div>
            </aside>
            <div class="practice-workspace" id="practice-content">
                <!-- Rendered dynamically -->
            </div>
        </div>
    `;

    const navItems = document.querySelectorAll('.practice-nav-item');
    navItems.forEach(item => {
        item.onclick = () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            renderPracticeProblem(item.dataset.id);
        };
    });

    if (questions.length > 0) {
        renderPracticeProblem(questions[0].id);
    }
}

function renderPracticeProblem(id) {
    const q = state.questions.find(item => item.id === id);
    if (!q) return;

    const container = document.getElementById('practice-content');
    container.innerHTML = `
        <div class="workspace-card fade-in">
            <div class="problem-details">
                <div class="detail-header">
                    <span class="badge red">REAL TCS PATTERN</span>
                    <h3>${q.title}</h3>
                </div>
                <div class="problem-description">
                    <div class="desc-content">${q.problem_statement.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</div>
                </div>

                <div class="constraints-box">
                    <h4>💡 Goal & Logic</h4>
                    <div class="constraints-content">${q.constraints.replace(/\n/g, '<br>')}</div>
                </div>

                <div class="format-grid">
                    ${q.input_format ? `
                    <div class="format-item">
                        <label>📥 Input Format</label>
                        <p>${q.input_format}</p>
                    </div>
                    ` : ''}
                    ${q.output_format ? `
                    <div class="format-item">
                        <label>📤 Output Format</label>
                        <p>${q.output_format}</p>
                    </div>
                    ` : ''}
                </div>
                
                <div class="io-sample-grid">
                    <div class="sample-box">
                        <label>📥 Sample Input</label>
                        <pre class="code-block">${q.sample_input}</pre>
                    </div>
                    <div class="sample-box">
                        <label>📤 Expected Output</label>
                        <pre class="code-block">${q.sample_output}</pre>
                    </div>
                </div>
            </div>

            <div class="coding-playground">
                <div class="playground-header">
                    <div class="play-title-wrap">
                        <div class="window-dots">
                            <div class="dot red"></div>
                            <div class="dot yellow"></div>
                            <div class="dot green"></div>
                        </div>
                        <div class="play-title">Try Mode — Code Editor</div>
                    </div>
                    <div class="lang-selector">
                        <button class="lang-btn active" data-lang="python">Python 3</button>
                        <button class="lang-btn" data-lang="java">Java</button>
                    </div>
                </div>
                
                <div class="editor-area">
                    <textarea id="code-playground" spellcheck="false" placeholder="Write your input reading logic here..."></textarea>
                </div>
                
                <div class="playground-footer">
                    <div class="playground-status">
                        <span class="status-dot"></span>
                        <span class="status-text">Ready to code</span>
                    </div>
                    <div class="footer-actions" style="display: flex; gap: 1rem;">
                        <button class="btn btn-secondary" id="show-solution"><span>🔓</span> Reveal Solution</button>
                        <button class="btn btn-primary" id="run-simulation"><span>▶</span> Run Simulation</button>
                    </div>
                </div>

                <div class="simulation-result" id="simulation-result" style="display: none;">
                    <!-- Results -->
                </div>
            </div>
        </div>
        
        <!-- Logic Modal -->
        <div id="logic-modal" class="modal">
            <div class="modal-content glass-effect">
                <div class="modal-header">
                    <h3>Logical Solution Code</h3>
                    <button class="close-modal">✕</button>
                </div>
                <div class="modal-body">
                    <div class="logic-header-text">
                        <p>${q.explanation}</p>
                    </div>
                    <div class="solution-code-section">
                        <div class="code-header">TCS Standard Solution (${q.title})</div>
                        <pre class="code-block" id="modal-code-block"></pre>
                    </div>
                </div>
            </div>
        </div>
    `;

    const editor = document.getElementById('code-playground');
    const runBtn = document.getElementById('run-simulation');
    const solutionBtn = document.getElementById('show-solution');
    const resultPanel = document.getElementById('simulation-result');
    const langBtns = document.querySelectorAll('.lang-btn');
    const modal = document.getElementById('logic-modal');
    const closeModal = modal.querySelector('.close-modal');

    let currentLang = 'python';

    langBtns.forEach(btn => {
        btn.onclick = () => {
            langBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLang = btn.dataset.lang;
            resultPanel.style.display = 'none';
        }
    });

    runBtn.onclick = () => {
        const userCode = editor.value.trim();
        const solutionCode = q.solutions[currentLang].trim();

        if(!userCode) {
            resultPanel.style.display = 'block';
            resultPanel.innerHTML = '<div class="result-error"><span class="icon">⚠️</span> Please write some code before simulating!</div>';
            return;
        }

        resultPanel.style.display = 'block';
        resultPanel.innerHTML = `
            <div class="running-indicator">
                <div class="spinner-small"></div>
                Analyzing logic and input patterns...
            </div>
        `;

        setTimeout(() => {
            // Basic normalization: remove extra whitespace and newlines for a fairer comparison
            const normalize = (str) => str.replace(/\s+/g, ' ').trim();
            const isMatch = normalize(userCode) === normalize(solutionCode);

            if(isMatch) {
                resultPanel.innerHTML = `
                    <div class="result-success fade-in">
                        <div class="res-head">
                            <span class="icon">✨</span>
                            <strong>Logic Matched!</strong>
                        </div>
                        <p>Perfect: Your <strong>${currentLang}</strong> code matches the required logic for this problem. You've mastered this pattern!</p>
                    </div>
                `;
            } else {
                resultPanel.innerHTML = `
                    <div class="result-error fade-in" style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171;">
                        <div class="res-head" style="color: #f87171; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.75rem;">
                            <span class="icon">❌</span>
                            <strong>Logic Mismatch</strong>
                        </div>
                        <p style="font-size: 0.85rem; color: #fca5a5;">Your logic doesn't quite match the required pattern for this problem. Review the "Reveal Solution" if you're stuck!</p>
                    </div>
                `;
            }
        }, 1200);
    };

    solutionBtn.onclick = () => {
        document.getElementById('modal-code-block').textContent = q.solutions[currentLang];
        modal.classList.add('active');
    };

    closeModal.onclick = () => modal.classList.remove('active');
    window.onclick = (event) => { if (event.target == modal) modal.classList.remove('active'); };
}

// Start app
init();
