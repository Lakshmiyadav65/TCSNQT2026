'use strict';

/* =========================================================
   Learn with Lakshmi — app shell (Arcade design)
   Hash routes:
     #                      home
     #topics[/<section>]    practice library
     #topic/<sec>/<topic>[/<level>]   practice quiz
     #mock[/<paper>]        mock tests (timed)
     #shortcuts/<section>   2020 memory-based test (timed)
     #saved                 practise bookmarked questions
     #coding[/<id>]  #scenario[/<id>]   coding problems
     #input-practice        input pattern practice room
     #progress              stats, badges, saved list
   ========================================================= */

// ---------- Static content ----------
const SECTIONS = [
    { key: 'numerical', name: 'Numerical Ability', short: 'Numerical', glyph: '%', hue: 55 },
    { key: 'verbal', name: 'Verbal Ability', short: 'Verbal', glyph: 'Aa', hue: 85 },
    { key: 'reasoning', name: 'Reasoning Ability', short: 'Reasoning', glyph: '?', hue: 35 },
    { key: 'programming', name: 'Programming', short: 'Programming', glyph: '</>', hue: 20 },
];
const SECTION_BY_KEY = Object.fromEntries(SECTIONS.map(s => [s.key, s]));
const LEVELS = ['Easy', 'Medium', 'Hard'];

const FEATURED = [
    ['NEW', '🚀', '6-Day TCS NQT Series', '250+ TCS NQT coding questions — Arrays to Graphs, Easy to Hard', 'dsa-series.html'],
    ['NEW', '📖', 'Input Guide', 'Master TCS NQT Input Patterns (Highly Recommended)', 'input-handling-guide.html'],
    ['NEW', '📉', 'TCS NQT Paper Analysis', 'Real-time analysis of the 20 March 2026 Morning Slot exam questions and patterns.', 'tcs-nqt-2026-analysis.html'],
    ['HOT', '🔥', 'All 8 Real Exam Questions', 'Complete March 20-21 coding questions with Java & Python solutions.', 'march-20-21-all-questions.html'],
    ['NEW', '🎉', 'Interview Prep', '70+ real Technical, Managerial & HR questions from previous TCS interviews', 'interview-prep.html'],
    ['HOT', '💬', 'Real Interview Qs', '30 real candidate experiences — Ninja, Digital & Prime roles with actual questions asked', 'real-interview-questions.html'],
    ['NEW', '⏱️', 'Shortcuts Practice', 'Practice specific previous year memory-based questions from TCS NQT!', 'shortcuts-practice.html'],
    ['HOT', '⚡', 'Input Practice', 'Hands-on practice room to master competitive input parsing patterns.', '#input-practice'],
];

const EXAMS = [
    { name: 'TCS NQT', pattern: 'Numerical, Verbal, Reasoning, Programming and Coding' },
    { name: 'Infosys', pattern: 'Quantitative, Logical Reasoning, Verbal, Pseudocode and Puzzles', sections: [['🔢', 'Quantitative'], ['🧠', 'Logical Reasoning'], ['🗣️', 'Verbal Ability'], ['💻', 'Pseudocode'], ['🧩', 'Puzzles']] },
    { name: 'Deloitte', pattern: 'Language, Logical, Quantitative, Technical MCQs and Coding', sections: [['🗣️', 'Language Skills'], ['🧠', 'Logical Reasoning'], ['🔢', 'Quantitative'], ['💻', 'Technical MCQs'], ['⚙️', 'Coding']] },
    { name: 'Accenture', pattern: 'Cognitive, Technical, Coding and Communication', sections: [['🧠', 'Cognitive Ability'], ['💻', 'Technical Assessment'], ['⚙️', 'Coding'], ['🗣️', 'Communication']] },
    { name: 'Wipro', pattern: 'Aptitude, Written Communication and Coding', sections: [['🔢', 'Aptitude'], ['📝', 'Written Communication'], ['⚙️', 'Coding']] },
    { name: 'Cognizant', pattern: 'Aptitude, Reasoning, Verbal and Coding', sections: [['🔢', 'Aptitude'], ['🧠', 'Reasoning'], ['🗣️', 'Verbal'], ['⚙️', 'Coding']] },
    { name: 'Capgemini', pattern: 'Pseudocode, English, Game-based Aptitude and Behavioural', sections: [['💻', 'Pseudocode'], ['🗣️', 'English'], ['🎮', 'Game-based Aptitude'], ['🤝', 'Behavioural']] },
];
// Map a company's exam section onto the practice sets we have
const routeForSection = n =>
    /cod/i.test(n) && !/pseudo/i.test(n) ? '#coding'
        : /quant|aptitude|numer/i.test(n) ? '#topics/numerical'
            : /verbal|language|english|communication/i.test(n) ? '#topics/verbal'
                : /pseudo|technical/i.test(n) ? '#topics/programming'
                    : '#topics/reasoning';

const CATEGORIES = [
    ['📝', 'Mock Tests Aptitude', '10 Practice Papers', '#mock', 55],
    ['🔢', 'Numerical', '200 Questions', '#topics/numerical', 85],
    ['🗣️', 'Verbal', '200 Questions', '#topics/verbal', 35],
    ['🧠', 'Reasoning', '200 Questions', '#topics/reasoning', 70],
    ['💻', 'Programming', '250 Questions', '#topics/programming', 45],
    ['⚙️', 'Coding', '150 Questions', '#coding', 95],
    ['🧩', 'Scenario Based', 'Latest Questions', '#scenario', 25, true],
];
const ROTS = ['-2deg', '1.5deg', '-1deg', '2deg', '-1.5deg', '1deg', '-2.5deg'];
const MARQUEE = ['TCS NQT', 'Infosys', 'Deloitte', 'Accenture', 'Wipro', 'Cognizant', 'Capgemini', 'Aptitude', 'Reasoning', 'Coding'];
const ANSWER_GROUPS = [
    ['shortcuts-practice', 'mock'], ['practice', 'mock'],
    ['numerical', 'numerical'], ['verbal', 'verbal'], ['reasoning', 'reasoning'], ['programming', 'programming'],
];

// ---------- Storage ----------
const store = {
    get(key, fallback) {
        try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch (e) { return fallback; }
    },
    set(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* storage unavailable */ }
    },
};
// prep_answered is the original key, kept so existing progress carries over
const answered = store.get('prep_answered', {});
const meta = Object.assign(
    { streak: 0, lastDay: null, bookmarks: [], solved: [], exam: 'TCS NQT', code: {}, daily: null, best: {} },
    store.get('lwl_meta', {})
);
const saveAnswered = () => store.set('prep_answered', answered);
const saveMeta = () => store.set('lwl_meta', meta);

// ---------- Helpers ----------
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);
const dayStr = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => dayStr(new Date());
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayStr(d); };
const dayNumber = () => { const d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
const fmt = s => { s = Math.max(0, s); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const tint = (hue, l = 0.88, c = 0.07) => `oklch(${l} ${c} ${hue})`;
const secsOf = t => { const m = /(\d+(?:\.\d+)?)\s*(sec|min)/i.exec(t || ''); return m ? (/min/i.test(m[2]) ? +m[1] * 60 : +m[1]) : 60; };
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}
// Escaped text with **bold**, and "Step N:" / newlines split into paragraphs
function rich(s) {
    const t = esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\s*(Step \d+:)/g, '\n$1').trim();
    return t.split(/\n+/).map(l => `<p>${l}</p>`).join('');
}
const solCode = v => (typeof v === 'string' ? v : v && v.code) || '';

// ---------- Data ----------
const cache = {};
const pending = {};
const failed = {};
const watching = {};

function normalizeMcq(key, q) {
    const ex = q.explanation || {};
    let topic = q.subcategory || q.category;
    if (key === 'practice') topic = Array.isArray(q.tags) && q.tags[1] && q.tags[1] !== 'Practice' ? q.tags[1] : q.category;
    return {
        uid: `${key}-${q.id}`, cat: key, id: q.id, paper: q.paper_id,
        section: key === 'programming' ? 'Programming' : q.category,
        topic, difficulty: q.difficulty || '',
        text: q.question || '', code: q.code_snippet || '',
        options: Object.entries(q.options || {}), answer: q.correct_answer,
        hint: ex.short || '', solution: ex.detailed || '', formula: ex.formula || '',
        tip: q.pro_tip || ex.similar_questions_tip || ex.memory_trick || '',
        secs: secsOf(q.time_to_solve),
    };
}

function loadOnce(key) {
    if (cache[key]) return Promise.resolve(cache[key]);
    if (!pending[key]) {
        pending[key] = fetch(`./data/${key}.json`)
            .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
            .then(text => {
                const mcq = SECTION_BY_KEY[key] || key === 'practice' || key === 'shortcuts-practice';
                // Some question files hold double-escaped characters (a literal \u20b9 for ₹); decode those in MCQ text
                const unescape = (k, v) => typeof v === 'string' ? v.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))) : v;
                const d = JSON.parse(text, mcq ? unescape : undefined);
                const list = Array.isArray(d) ? d : (d.questions || []);
                cache[key] = mcq ? list.filter(q => q.options).map(q => normalizeMcq(key, q)) : list;
                delete failed[key];
                return cache[key];
            })
            .catch(err => { delete pending[key]; failed[key] = err; throw err; });
    }
    return pending[key];
}

// For views: returns 'ok' | 'loading' | 'error', repainting once data lands
function need(keys) {
    const missing = keys.filter(k => !cache[k]);
    if (!missing.length) return 'ok';
    if (missing.some(k => failed[k])) return 'error';
    missing.forEach(k => {
        if (watching[k]) return;
        watching[k] = true;
        loadOnce(k).then(() => paint(), () => paint()).finally(() => { delete watching[k]; });
    });
    return 'loading';
}

let topicMemo = null;
function getTopics() {
    if (topicMemo) return topicMemo;
    topicMemo = [];
    SECTIONS.forEach(sec => {
        const groups = new Map();
        cache[sec.key].forEach(q => {
            if (!groups.has(q.topic)) groups.set(q.topic, []);
            groups.get(q.topic).push(q);
        });
        groups.forEach((qs, name) => topicMemo.push({ sec, name, qs }));
    });
    return topicMemo;
}

function filterTopics() {
    const term = ui.search.trim().toLowerCase();
    return getTopics()
        .filter(t => ui.section === 'All' || t.sec.key === ui.section)
        .map(t => ({ ...t, pool: ui.level === 'All' ? t.qs : t.qs.filter(q => q.difficulty === ui.level) }))
        .filter(t => t.pool.length && (!term || `${t.name} ${t.sec.name}`.toLowerCase().includes(term)));
}

// ---------- Stats ----------
function groupOf(uid) {
    const g = ANSWER_GROUPS.find(([prefix]) => uid.startsWith(prefix + '-'));
    return g ? g[1] : null;
}

function stats() {
    let attempted = 0, correct = 0, ever = 0;
    const by = {};
    Object.entries(answered).forEach(([uid, a]) => {
        attempted++;
        if (a.isCorrect) correct++;
        if (a.ever ?? a.isCorrect) ever++;
        const g = groupOf(uid);
        if (g) { by[g] = by[g] || { c: 0, t: 0 }; by[g].t++; if (a.isCorrect) by[g].c++; }
    });
    const xp = ever * 10 + meta.solved.length * 30;
    const level = Math.floor(xp / 100) + 1;
    const streak = meta.lastDay === today() || meta.lastDay === yesterday() ? meta.streak : 0;
    return {
        attempted, correct, xp, level, by, streak,
        nextLevel: level + 1, xpToNext: 100 - (xp % 100), levelPct: (xp % 100) + '%',
        acc: attempted ? Math.round(100 * correct / attempted) + '%' : '–',
    };
}

function touchStreak() {
    const d = today();
    if (meta.lastDay === d) return;
    meta.streak = meta.lastDay === yesterday() ? meta.streak + 1 : 1;
    meta.lastDay = d;
}

function record(q, key) {
    const prev = answered[q.uid];
    const isCorrect = key === q.answer;
    answered[q.uid] = { answer: key, isCorrect, ever: !!((prev && (prev.ever ?? prev.isCorrect)) || isCorrect) };
    touchStreak();
}

function badges(s) {
    return [
        { icon: '🎯', label: 'First 10', hint: 'Answer 10 questions', on: s.attempted >= 10 },
        { icon: '🔥', label: '3-day streak', hint: 'Practise 3 days in a row', on: s.streak >= 3 },
        { icon: '💻', label: 'Coder', hint: 'Solve a coding problem', on: meta.solved.length > 0 },
        { icon: '📝', label: 'Mock finisher', hint: 'Submit a full mock test', on: Object.keys(meta.best).length > 0 },
        { icon: '💯', label: 'Century', hint: 'Answer 100 questions', on: s.attempted >= 100 },
    ];
}

// ---------- UI state ----------
const app = document.getElementById('app');
const ui = {
    view: 'loading', message: '',
    search: '', section: 'All', level: 'All',
    quiz: null, elapsed: 0,
    coding: { set: 'coding', ids: {}, level: 'All', search: '', sol: false, tab: 'python' },
    input: { id: null, lang: 'python', result: null, sol: false },
};
let routeSeq = 0;

// ---------- Router ----------
async function route() {
    const seq = ++routeSeq;
    const [head = '', a, b, c] = location.hash.replace(/^#\/?/, '').split('/').map(p => { try { return decodeURIComponent(p); } catch (e) { return p; } });
    switch (head) {
        case '': case 'dashboard': return show('home');
        case 'topics': ui.section = SECTION_BY_KEY[a] ? a : 'All'; return show('topics');
        case 'numerical': case 'verbal': case 'reasoning': case 'programming': ui.section = head; return show('topics');
        case 'topic':
            if (!SECTION_BY_KEY[a]) return show('topics');
            return startFrom(seq, [a], () => {
            const lvl = LEVELS.includes(c) ? c : null;
            const qs = (cache[a] || []).filter(q => q.topic === b && (!lvl || q.difficulty === lvl));
            return { mode: 'practice', title: `${b} · ${lvl || SECTION_BY_KEY[a]?.short || ''}`, qs: shuffle(qs), back: '#topics/' + a };
        });
        case 'mock': case 'practice': case 'shortcuts-practice':
            if (!a) return show('mock');
            return startFrom(seq, ['practice'], () => {
                const qs = cache.practice.filter(q => String(q.paper) === a);
                return { mode: 'mock', title: `Mock Test #${a} · TCS NQT pattern`, qs, back: '#mock', key: 'mock/' + a };
            });
        case 'shortcuts': return startFrom(seq, ['shortcuts-practice'], () => {
            const qs = cache['shortcuts-practice'].filter(q => q.section === a);
            return { mode: 'mock', title: `${a} · 2020 memory-based`, qs, back: '#mock', key: 'shortcuts/' + a };
        });
        case 'saved': {
            const cats = [...new Set(meta.bookmarks.map(x => x.cat))];
            return startFrom(seq, cats, () => {
                const all = cats.flatMap(k => cache[k]);
                const qs = meta.bookmarks.map(x => all.find(q => q.uid === x.uid)).filter(Boolean);
                return { mode: 'practice', title: 'Saved questions', qs, back: '#progress' };
            });
        }
        case 'coding': case 'scenario':
            ui.coding.set = head;
            if (a) ui.coding.ids[head] = a;
            ui.coding.sol = false;
            return show('coding');
        case 'input-practice': return show('input');
        case 'input-guide': location.replace('input-handling-guide.html'); return;
        case 'progress': return show('progress');
        default: return show('home');
    }
}

function show(view) {
    ui.view = view;
    paint();
    window.scrollTo(0, 0);
}

async function startFrom(seq, keys, build) {
    ui.view = 'loading';
    paint();
    try {
        await Promise.all(keys.map(loadOnce));
    } catch (e) {
        if (seq === routeSeq) { ui.view = 'error'; paint(); }
        return;
    }
    if (seq !== routeSeq) return;
    const spec = build();
    if (!spec.qs.length) {
        ui.view = 'empty';
        ui.message = 'Nothing to practise here yet.';
        return paint();
    }
    startQuiz(spec);
}

// ---------- Quiz engine ----------
function startQuiz(spec) {
    const n = spec.qs.length;
    ui.quiz = {
        ...spec, idx: 0, answers: Array(n).fill(null), hints: Array(n).fill(false), flags: Array(n).fill(false),
        submitted: false, used: 0, burst: null,
        limit: spec.mode === 'mock' ? Math.ceil(n * 1.5) * 60 : 0,
    };
    ui.elapsed = 0;
    show('quiz');
}

function pick(key) {
    const q = ui.quiz;
    if (!q || q.submitted || ui.view !== 'quiz') return;
    if (q.mode === 'practice' && q.answers[q.idx] != null) return;
    q.answers[q.idx] = key;
    if (q.mode === 'practice') {
        const cur = q.qs[q.idx];
        record(cur, key);
        saveAnswered();
        saveMeta();
        if (key === cur.answer) q.burst = q.idx;
    }
    paint();
}

function go(i) {
    const q = ui.quiz;
    q.idx = Math.max(0, Math.min(q.qs.length - 1, i));
    paint();
}

function primary() {
    const q = ui.quiz, last = q.idx === q.qs.length - 1;
    if (q.submitted) { if (last) { ui.view = 'results'; paint(); window.scrollTo(0, 0); } else go(q.idx + 1); return; }
    last ? finish() : go(q.idx + 1);
}

function finish() {
    const q = ui.quiz;
    if (!q || q.submitted) return;
    let any = false;
    if (q.mode === 'mock') {
        q.qs.forEach((x, i) => { if (q.answers[i] != null) { record(x, q.answers[i]); any = true; } });
        const score = scoreOf(q);
        const prev = meta.best[q.key];
        if (!prev || score > prev.score) meta.best[q.key] = { score, total: q.qs.length };
        saveAnswered();
    }
    q.submitted = true;
    q.used = q.mode === 'mock' ? Math.min(ui.elapsed, q.limit) : ui.elapsed;
    if (any) touchStreak();
    saveMeta();
    ui.view = 'results';
    paint();
    window.scrollTo(0, 0);
}

const scoreOf = q => q.qs.filter((x, i) => q.answers[i] === x.answer).length;

function combo(q) {
    let n = 0;
    for (let i = q.idx; i >= 0; i--) { if (q.answers[i] != null && q.answers[i] === q.qs[i].answer) n++; else break; }
    return n;
}

function toggleBookmark(q) {
    const i = meta.bookmarks.findIndex(x => x.uid === q.uid);
    if (i >= 0) meta.bookmarks.splice(i, 1);
    else meta.bookmarks.push({ uid: q.uid, cat: q.cat, topic: q.topic, text: q.text.slice(0, 200) });
    saveMeta();
}

// ---------- Painting ----------
function paint() {
    // Keep focus/caret and list scroll positions across re-renders
    const active = document.activeElement;
    const inputKey = active && active.dataset ? active.dataset.input : null;
    const caret = inputKey && typeof active.selectionStart === 'number' ? [active.selectionStart, active.selectionEnd] : null;
    const scrolls = [...app.querySelectorAll('[data-keep-scroll]')].map(el => [el.dataset.keepScroll, el.scrollTop]);

    app.innerHTML = (VIEWS[ui.view] || VIEWS.home)();

    scrolls.forEach(([k, top]) => { const el = app.querySelector(`[data-keep-scroll="${k}"]`); if (el) el.scrollTop = top; });
    if (inputKey) {
        const el = app.querySelector(`[data-input="${inputKey}"]`);
        if (el) { el.focus(); if (caret) el.setSelectionRange(caret[0], caret[1]); }
    }
    if (ui.quiz) ui.quiz.burst = null;
    paintHeader();
}

function paintHeader() {
    const s = stats();
    document.getElementById('hdr-level').textContent = `⚡ Lv ${s.level}`;
    document.getElementById('hdr-streak').textContent = `🔥 ${s.streak}`;
    const q = ui.quiz, inQuiz = ui.view === 'quiz' || ui.view === 'results';
    const activeNav = {
        home: 'home', topics: 'topics', coding: 'coding', input: 'coding', mock: 'mock', progress: 'progress',
    }[ui.view] || (inQuiz && q ? (q.mode === 'mock' ? 'mock' : 'topics') : '');
    document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.nav === activeNav));
}

// ---------- Shared bits ----------
const loadingHtml = (msg = 'Loading questions...') => `<div class="loading"><div class="spinner"></div><p>${esc(msg)}</p></div>`;
const errorHtml = () => `<div class="page"><div class="empty"><strong>Couldn't load the questions</strong><p class="muted">Check your connection and try again.</p><div><button class="btn btn-accent" data-act="retry-load">Try again</button></div></div></div>`;

function chips(list, current, act, extra = '') {
    return list.map(([value, label]) =>
        `<button class="chip ${extra} ${value === current ? 'on' : ''}" data-act="${act}" data-arg="${esc(value)}">${esc(label)}</button>`).join('');
}

function topicCard(t) {
    const counts = LEVELS.map(l => [l, t.pool.filter(q => q.difficulty === l).length]).filter(([, n]) => n);
    const mins = Math.max(1, Math.round(t.pool.reduce((sum, q) => sum + q.secs, 0) / 60));
    const level = ui.level !== 'All' ? ui.level : counts.length === 1 ? counts[0][0] : 'Mixed';
    const done = t.pool.filter(q => answered[q.uid]).length;
    const href = `#topic/${t.sec.key}/${encodeURIComponent(t.name)}${ui.level !== 'All' ? '/' + ui.level : ''}`;
    return `<div class="topic">
        <div class="topic-thumb" style="background:${tint(t.sec.hue)}">${esc(t.sec.glyph)}</div>
        <div class="topic-body">
            <span class="eyebrow">${esc(t.sec.name)}</span>
            <strong>${esc(t.name)}</strong>
            <p>${counts.map(([l, n]) => `${l} ${n}`).join(' · ')}${done ? ` · ✓ ${done} done` : ''}</p>
            <div class="topic-meta"><span>▤ ${t.pool.length} questions</span><span>◷ ${mins} min</span><b>● ${level}</b></div>
        </div>
        <a class="btn btn-accent" href="${href}">Play</a>
    </div>`;
}

// ---------- Views ----------
const VIEWS = {
    loading: () => loadingHtml(),
    error: errorHtml,
    empty: () => `<div class="page"><div class="empty"><strong>${esc(ui.message)}</strong><p class="muted">Pick another topic from the library.</p><div><a class="btn btn-accent" href="#topics">Open practice library</a></div></div></div>`,

    home() {
        const s = stats();
        const exam = EXAMS.find(e => e.name === meta.exam) || EXAMS[0];
        const isTcs = exam.name === 'TCS NQT';
        const bs = badges(s).slice(0, 3);

        const featured = isTcs
            ? `<div class="feat-grid">${FEATURED.map(([badge, icon, title, desc, href], i) => {
                const external = !href.startsWith('#');
                return `<a class="feat ${i === 0 ? 'lead' : ''}" href="${href}"${external ? ' target="_blank" rel="noopener"' : ''}>
                    <span class="feat-top"><span class="feat-icon">${icon}</span><span class="feat-badge ${badge === 'HOT' ? 'hot' : ''}">${badge}</span></span>
                    <h3>${esc(title)}</h3><p>${esc(desc)}</p></a>`;
            }).join('')}</div>`
            : `<div class="empty"><strong>${esc(exam.name)} materials are on the way</strong><p class="muted">Exam pattern: ${esc(exam.pattern)}. Until the dedicated papers are up, practise the matching sections below.</p></div>`;

        const cats = (isTcs
            ? CATEGORIES.map(([icon, title, sub, href, hue, isNew]) => ({ icon, title, sub, href, hue, isNew }))
            : exam.sections.map(([icon, title], i) => ({ icon, title, sub: 'Practice set', href: routeForSection(title), hue: [55, 85, 35, 70, 20][i % 5] })))
            .map((c, i) => `<a class="cat" href="${c.href}" style="--rot:${ROTS[i % ROTS.length]}">
                <span class="cat-thumb" style="background:${tint(c.hue, 0.9, 0.06)}">${c.icon}</span>
                <span class="cat-body"><strong>${esc(c.title)}</strong><span>${esc(c.sub)}</span></span>
                ${c.isNew ? '<span class="new-tag">NEW</span>' : ''}</a>`).join('');

        return `
        <section class="hero-sec">
            <div class="hero">
                <div class="hero-sun"></div><div class="hero-ring"></div>
                <div class="hero-copy">
                    <span class="hero-tag">🚀 ${esc(exam.name)} 2026 · Complete Prep Kit</span>
                    <div>
                        <span class="hero-hey">Hey, future engineer!</span>
                        <h1>Let's crack ${esc(exam.name)} <span class="boxed">together.</span></h1>
                    </div>
                    <p class="hero-lead">1000+ hand-picked questions, real exam papers, and step-by-step solutions — everything you need to clear the test, in one place.</p>
                    <div class="hero-ctas">
                        <a class="btn btn-ink btn-big btn-shadow" href="#topics"><span>▶</span><span>Start Practicing</span></a>
                        <a class="btn btn-paper btn-big" href="#scenario"><span>🧩</span><span>Try Scenario Questions</span></a>
                    </div>
                    <div class="hero-stats">
                        <span class="hero-stat" style="background:var(--ink);color:var(--bg);transform:rotate(-3deg)"><strong>1000+</strong><span>Questions</span></span>
                        <span class="hero-stat" style="background:var(--surface);transform:rotate(2deg)"><strong>10</strong><span>Mock Papers</span></span>
                        <span class="hero-stat" style="background:var(--sun);transform:rotate(-1deg)"><strong>100%</strong><span>Free</span></span>
                    </div>
                </div>
                <div class="hero-art">
                    <div class="hero-halo"></div>
                    <div class="hero-emoji" style="top:8px;left:6%;font-size:44px;transform:rotate(-12deg)">🏆</div>
                    <div class="hero-emoji" style="bottom:18px;right:8%;font-size:40px;transform:rotate(10deg)">🎯</div>
                    <div class="level-card">
                        <div class="row-between" style="align-items:center"><strong style="font-size:15px">Your level</strong><span class="pill pill-soft" style="font-family:var(--body);font-size:13px">🔥 ${s.streak} day streak</span></div>
                        <span class="lv">Lv ${s.level}</span>
                        <div class="meter"><span style="width:${s.levelPct}"></span></div>
                        <span class="muted" style="font-size:14px">⚡ ${s.xp} XP · ${s.xpToNext} XP to Level ${s.nextLevel}</span>
                        <div class="badge-row">${bs.map(b => `<span class="badge ${b.on ? 'on' : ''}" title="${esc(b.hint)}">${b.icon} ${esc(b.label)}</span>`).join('')}</div>
                    </div>
                </div>
            </div>
        </section>

        <section class="marquee"><div class="marquee-in">${MARQUEE.map(w => `<span>${esc(w)}<i>✦</i></span>`).join('')}</div></section>

        <section class="wrap" style="padding-bottom:24px;display:flex;flex-direction:column;gap:14px">
            <div class="update-bar">
                <span style="font-size:20px">🔥</span>
                <p><strong>Latest Update:</strong> New Scenario-Based Questions are now live! Master the latest patterns.</p>
                <a class="btn btn-accent btn-sm" style="font-weight:700" href="#scenario">Check Now →</a>
            </div>
            <div class="dash-grid">
                ${qotdHtml()}
                <div class="dash-side">
                    <div class="card" style="display:flex;flex-direction:column;gap:12px">
                        <div class="row-between"><strong>Overall Progress</strong><span class="mono muted" style="font-size:15px">${s.attempted} / 1000 Completed</span></div>
                        <div class="meter"><span style="width:${Math.min(100, s.attempted / 10)}%"></span></div>
                    </div>
                    <div class="card row-between" style="align-items:center">
                        <div style="display:flex;flex-direction:column;gap:4px"><strong>Accuracy</strong><span class="muted" style="font-size:14px">${!s.attempted || s.correct / s.attempted < 0.8 ? 'Keep improving!' : 'Excellent. Stay consistent!'}</span></div>
                        <span class="big-num">${s.attempted ? s.acc : '0%'}</span>
                    </div>
                    <div class="card-inv" style="flex:1;display:flex;flex-direction:column;justify-content:space-between;gap:12px">
                        <div class="row-between"><strong>Level ${s.level}</strong><span class="mono muted" style="font-size:15px">${s.xpToNext} XP to Level ${s.nextLevel}</span></div>
                        <div class="meter"><span style="width:${s.levelPct}"></span></div>
                        <span class="muted" style="font-size:14px">Every correct answer earns 10 XP. Solved coding problems earn 30.</span>
                    </div>
                </div>
            </div>
        </section>

        <section class="sec">
            <h2 class="sec-title">⭐ Featured &amp; New</h2>
            ${featured}
        </section>

        <section class="sec">
            <div class="sec-head">
                <h2 class="sec-title">🏢 Prepare by Company</h2>
                <span class="muted" style="font-size:15px">Pick a company and the categories below switch to its exam pattern.</span>
            </div>
            <div class="exam-grid">${EXAMS.map(e => `<button class="exam ${e.name === exam.name ? 'on' : ''}" data-act="exam" data-arg="${esc(e.name)}">
                <span class="row-between" style="width:100%;align-items:center"><strong>${esc(e.name)}</strong><span style="font-size:12px;font-weight:700">${e.name === exam.name ? '✓ Selected' : ''}</span></span>
                <small>${esc(e.pattern)}</small></button>`).join('')}</div>
        </section>

        <section class="sec">
            <h2 class="sec-title">📚 Practice by Category</h2>
            <div class="cat-grid">${cats}</div>
        </section>

        <section class="sec explore">
            <h2 class="sec-title">Explore quizzes</h2>
            <div class="chips">${chips([['All', 'All'], ...SECTIONS.map(x => [x.key, x.name])], ui.section, 'section')}</div>
            <input class="search" data-input="search" value="${esc(ui.search)}" placeholder="🔍  Search a topic" aria-label="Search a topic">
            ${exploreGrid()}
        </section>

        <section class="sec" style="padding-bottom:88px">
            <div class="how">
                <h2>How a practice session works</h2>
                <div><span class="n">01</span><strong>Pick a topic</strong><p>Short sets grouped by NQT section. Filter by difficulty.</p></div>
                <div><span class="n">02</span><strong>Answer on the clock</strong><p>A timer keeps you at exam pace. Stuck? Take a hint first.</p></div>
                <div><span class="n">03</span><strong>Learn my shortcut</strong><p>Every answer has a worked solution and an exam tip.</p></div>
            </div>
        </section>`;
    },

    topics() {
        const st = need(SECTIONS.map(x => x.key));
        const body = st === 'loading' ? loadingHtml('Loading topics...') : st === 'error' ? errorHtml() : (() => {
            const list = filterTopics();
            return list.length
                ? `<div class="topic-grid">${list.map(topicCard).join('')}</div>`
                : `<p class="muted" style="font-size:16px">Nothing matches yet. Try a shorter word, or clear the filters.</p>`;
        })();
        return `<section class="page">
            <div class="sec-head" style="margin:0">
                <div style="display:flex;flex-direction:column;gap:8px">
                    <h1 class="page-title">Practice library</h1>
                    <p class="page-sub">Search for a topic, or narrow down by section and difficulty.</p>
                </div>
                ${meta.bookmarks.length ? `<a class="btn" style="background:var(--surface)" href="#saved">★ Practise ${meta.bookmarks.length} saved</a>` : ''}
            </div>
            <input class="search" data-input="search" value="${esc(ui.search)}" placeholder="Search: percentages, syllogisms, pointers…" aria-label="Search topics">
            <div style="display:flex;gap:24px;flex-wrap:wrap;align-items:center">
                <div class="chips">${chips([['All', 'All'], ...SECTIONS.map(x => [x.key, x.name])], ui.section, 'section')}</div>
                <div class="chips">${chips(['All', ...LEVELS].map(l => [l, l]), ui.level, 'level', 'mono')}</div>
            </div>
            ${body}
        </section>`;
    },

    quiz() {
        const q = ui.quiz;
        if (!q) return VIEWS.home();
        const cur = q.qs[q.idx];
        const isMock = q.mode === 'mock';
        const picked = q.answers[q.idx];
        const revealed = q.submitted || (!isMock && picked != null);
        const total = q.qs.length, last = q.idx === total - 1;
        const saved = meta.bookmarks.some(x => x.uid === cur.uid);
        const streakNow = !isMock ? combo(q) : 0;

        let verdict = '', vClass = '';
        if (revealed) {
            if (picked == null) { verdict = 'Skipped. Here’s how I’d solve it:'; vClass = 'skip'; }
            else if (picked === cur.answer) { verdict = 'Correct! Nicely done. +10 XP ⚡'; vClass = 'ok'; }
            else {
                const right = cur.options.find(([k]) => k === cur.answer);
                verdict = `Not quite. The answer is ${cur.answer}${right ? ` (${right[1]})` : ''}.`; vClass = 'bad';
            }
        }
        const primaryLabel = q.submitted ? (last ? 'Back to results' : 'Next →')
            : isMock ? (last ? 'Submit test' : 'Save & next →')
                : picked == null ? (last ? 'Skip & finish' : 'Skip →') : (last ? 'See my results' : 'Next question →');

        const options = cur.options.map(([key, label]) => {
            let cls = '', mark = '';
            if (revealed && key === cur.answer) { cls = 'ok'; mark = '✓'; }
            else if (revealed && key === picked) { cls = 'bad'; mark = '✗'; }
            else if (!revealed && key === picked) cls = 'sel';
            return `<button class="opt ${cls}" data-act="pick" data-arg="${esc(key)}" ${revealed ? 'disabled' : ''}>
                <span class="opt-key">${esc(key)}</span><span class="opt-label">${esc(label)}</span><span class="opt-mark">${mark}</span></button>`;
        }).join('');

        const palette = q.qs.map((x, i) => {
            const a = q.answers[i], showRes = q.submitted || (!isMock && a != null);
            const cls = [
                showRes && a != null ? (a === x.answer ? 'ok' : 'bad') : a != null ? 'filled' : '',
                q.flags[i] && !q.submitted ? 'flag' : '',
                i === q.idx ? 'cur' : '',
            ].join(' ');
            return `<button class="pal ${cls}" data-act="go" data-arg="${i}" aria-label="Question ${i + 1}">${i + 1}</button>`;
        }).join('');

        const remaining = q.limit - ui.elapsed;
        const timeLabel = q.submitted ? fmt(q.used) : isMock ? fmt(remaining) : fmt(ui.elapsed);

        return `<section class="quiz">
            <div class="quiz-main">
                <div class="quiz-head">
                    <div><span class="eyebrow">${esc(q.title)}</span><h1>Question ${q.idx + 1} of ${total}</h1></div>
                    <a href="${q.back}">✕ Exit</a>
                </div>
                ${streakNow >= 2 ? `<span class="combo">🔥 ${streakNow} in a row! Keep it going</span>` : ''}
                <div class="ink-card qcard">
                    ${q.burst === q.idx ? burstHtml(q.idx) : ''}
                    <div class="qtop">
                        <span class="qtag">${esc(cur.section)}${cur.topic !== cur.section ? ' · ' + esc(cur.topic) : ''}${cur.difficulty ? ' · ' + esc(cur.difficulty) : ''}</span>
                        <div class="qtools">
                            ${isMock && !q.submitted ? `<button class="btn btn-sm ${q.flags[q.idx] ? 'on' : ''}" data-act="flag">${q.flags[q.idx] ? '⚑ Marked' : '⚐ Mark for review'}</button>` : ''}
                            <button class="btn btn-sm ${saved ? 'on' : ''}" data-act="bookmark">${saved ? '★ Saved' : '☆ Save'}</button>
                        </div>
                    </div>
                    <p class="qtext">${esc(cur.text)}</p>
                    ${cur.code ? `<pre class="code">${esc(cur.code)}</pre>` : ''}
                    <div class="opts">${options}</div>
                    ${q.hints[q.idx] && !revealed ? `<div class="hint"><strong>Lakshmi's hint · </strong>${esc(cur.hint)}</div>` : ''}
                    ${revealed ? `<div class="sol">
                        <strong class="verdict ${vClass}">${esc(verdict)}</strong>
                        <div class="sol-text">${cur.solution ? rich(cur.solution) : '<p>No worked solution for this one yet.</p>'}</div>
                        ${cur.formula ? `<div class="sol-extra"><span class="eyebrow">Formula · </span>${esc(cur.formula)}</div>` : ''}
                        ${cur.tip ? `<div class="sol-extra"><span class="eyebrow">Exam tip · </span>${esc(cur.tip)}</div>` : ''}
                    </div>` : ''}
                    <div class="qnav">
                        <div>
                            <button class="btn" data-act="prev" ${q.idx === 0 ? 'disabled' : ''}>← Back</button>
                            ${!isMock && !revealed && !q.hints[q.idx] && cur.hint ? '<button class="btn" data-act="hint">💡 Hint</button>' : ''}
                        </div>
                        <button class="btn btn-accent" data-act="primary">${primaryLabel}</button>
                    </div>
                </div>
                <span class="kbd-note">Keyboard: A–D to choose · Enter to continue</span>
            </div>
            <aside class="quiz-aside">
                <div class="card-inv" style="display:flex;flex-direction:column;gap:6px">
                    <span class="eyebrow">${isMock && !q.submitted ? 'Time left' : 'Time spent'}</span>
                    <span class="timer-num ${isMock && !q.submitted && remaining <= 60 ? 'low' : ''}" id="timer-num">${timeLabel}</span>
                </div>
                ${!isMock && !q.submitted ? `<div class="xp-card"><span>XP this set</span><span>⚡ ${scoreOf(q) * 10}</span></div>` : ''}
                <div class="card" style="display:flex;flex-direction:column;gap:14px;padding:20px">
                    <span class="eyebrow">Questions</span>
                    <div class="palette" data-keep-scroll="palette">${palette}</div>
                    <span class="muted" style="font-size:13px;line-height:1.5">${isMock && !q.submitted ? 'Filled = answered · dashed = marked for review. Jump to any question.' : 'Green = correct · red = wrong. Tap a number to jump.'}</span>
                </div>
                ${isMock && !q.submitted ? `<button class="btn" style="border-color:var(--ink)" data-act="finish">Submit test (${q.answers.filter(a => a != null).length}/${total} answered)</button>` : ''}
                ${!isMock && !q.submitted ? `<button class="btn" data-act="finish">Finish set</button>` : ''}
            </aside>
        </section>`;
    },

    results() {
        const q = ui.quiz;
        if (!q) return VIEWS.home();
        const score = scoreOf(q), total = q.qs.length, ratio = total ? score / total : 0;
        const msg = ratio >= 0.8 ? 'Brilliant work. You’re exam-ready on this one.'
            : ratio >= 0.5 ? 'Good going! Read the solutions for the ones you missed, then try once more.'
                : 'Every topper started here. Go through my solutions below, then retry.';
        const review = q.qs.map((x, i) => {
            const a = q.answers[i], ok = a === x.answer;
            const chosen = a == null ? 'Skipped' : 'You chose ' + (x.options.find(([k]) => k === a) || [a, a])[1];
            const right = (x.options.find(([k]) => k === x.answer) || [x.answer, x.answer])[1];
            return `<button data-act="review" data-arg="${i}">
                <span class="dot ${a == null ? '' : ok ? 'ok' : 'bad'}">${a == null ? '–' : ok ? '✓' : '✗'}</span>
                <span class="review-text"><strong>${esc(x.text)}</strong><span>${esc(chosen)} · Answer: ${esc(right)}</span></span>
                <span class="review-go">Solution →</span></button>`;
        }).join('');
        return `<section class="results">
            <div class="res-hero">
                <div style="display:flex;flex-direction:column;gap:10px">
                    <span class="eyebrow">${esc(q.title)} · complete</span>
                    <span class="res-score">${score}<span>/${total}</span></span>
                    <span class="res-msg">${msg}</span>
                </div>
                <div class="res-nums">
                    <div><span class="eyebrow">Accuracy</span><b>${total ? Math.round(100 * ratio) + '%' : '–'}</b></div>
                    <div><span class="eyebrow">Time</span><b>${fmt(q.used)}</b></div>
                </div>
            </div>
            <h2 style="font-size:28px;margin-top:8px">Review with solutions</h2>
            <div class="review">${review}</div>
            <div class="btn-row">
                <button class="btn btn-accent" data-act="retry">Try again</button>
                <a class="btn" href="${q.mode === 'mock' ? '#mock' : '#topics'}">${q.mode === 'mock' ? 'Choose another paper' : 'Choose another topic'}</a>
                <a class="btn" href="#progress">See my progress</a>
            </div>
        </section>`;
    },

    mock() {
        const st = need(['practice', 'shortcuts-practice']);
        if (st !== 'ok') return st === 'error' ? errorHtml() : loadingHtml('Loading mock tests...');
        const card = (glyph, hue, eyebrow, title, desc, qs, key, href) => {
            const best = meta.best[key];
            return `<div class="topic">
                <div class="topic-thumb" style="background:${tint(hue)}">${esc(glyph)}</div>
                <div class="topic-body">
                    <span class="eyebrow">${esc(eyebrow)}</span><strong>${esc(title)}</strong><p>${esc(desc)}</p>
                    <div class="topic-meta"><span>▤ ${qs.length} questions</span><span>◷ ${Math.ceil(qs.length * 1.5)} min</span><b>● ${best ? `Best ${best.score}/${best.total}` : 'Not attempted'}</b></div>
                </div>
                <a class="btn btn-accent" href="${href}">Start test</a></div>`;
        };
        const papers = [...new Set(cache.practice.map(q => q.paper))].sort((a, b) => a - b);
        const spSections = [...new Set(cache['shortcuts-practice'].map(q => q.section))];
        const hues = [55, 85, 35, 70, 20];
        return `<section class="page">
            <div style="display:flex;flex-direction:column;gap:8px">
                <h1 class="page-title">Mock tests</h1>
                <p class="page-sub">Timed papers in exam conditions. Answers and solutions unlock when you submit.</p>
            </div>
            <div class="topic-grid">${papers.map((p, i) => card('P' + p, hues[i % 5], 'TCS NQT pattern', `Mock Test #${p}`, 'Numerical, verbal and reasoning in one timed paper.',
            cache.practice.filter(q => q.paper === p), 'mock/' + p, '#mock/' + p)).join('')}</div>
            <h2 class="sec-title" style="margin:26px 0 0">⏱️ Shortcuts practice · 2020 memory-based</h2>
            <div class="topic-grid">${spSections.map((sec, i) => card(['%', '?', 'Aa'][i % 3], hues[(i + 2) % 5], 'TCS NQT 2020', sec, 'Previous-year memory-based questions, solved with shortcuts.',
                cache['shortcuts-practice'].filter(q => q.section === sec), 'shortcuts/' + sec, '#shortcuts/' + encodeURIComponent(sec))).join('')}</div>
        </section>`;
    },

    coding() {
        const c = ui.coding, set = c.set;
        const st = need([set]);
        const switcher = `<div class="chips">${chips([['coding', 'Coding · 150'], ['scenario', 'Scenario · 30']], set, 'code-set')}</div>`;
        const side = body => `<aside class="code-side">
            <h1>Coding practice</h1>
            <p class="muted" style="font-size:15px;line-height:1.5;margin-bottom:6px">NQT-style problems with Python and Java solutions. Try it yourself first, then compare.</p>
            ${switcher}${body}</aside>`;
        if (st !== 'ok') return `<section class="code-page">${side('')}<div class="code-main">${st === 'error' ? errorHtml() : loadingHtml('Loading problems...')}</div></section>`;

        const all = cache[set];
        const term = c.search.trim().toLowerCase();
        const list = all.filter(p => (c.level === 'All' || p.difficulty === c.level) && (!term || `${p.title} ${p.subcategory || ''}`.toLowerCase().includes(term)));
        const p = all.find(x => String(x.id) === String(c.ids[set])) || list[0] || all[0];
        if (!p) return `<section class="code-page">${side('')}<div class="code-main"><div class="empty"><strong>No problems here yet.</strong></div></div></section>`;
        const uid = `${set}-${p.id}`;
        const solved = meta.solved.includes(uid);

        const items = list.map(x => `<button class="prob ${x === p ? 'on' : ''}" data-act="prob" data-arg="${esc(x.id)}">
            <span class="prob-top"><span>${esc(x.difficulty || '')}${x.subcategory ? ' · ' + esc(x.subcategory) : ''}</span><span class="solved">${meta.solved.includes(`${set}-${x.id}`) ? '✓ Solved' : ''}</span></span>
            <strong>${esc(x.title)}</strong></button>`).join('') || '<p class="muted" style="font-size:14px">No problems match.</p>';

        const langs = Object.keys(p.solutions || {}).filter(k => solCode(p.solutions[k]));
        const tabs = [...langs, ...(p.approach || p.common_mistakes || p.pro_tip ? ['approach'] : [])];
        const tab = tabs.includes(c.tab) ? c.tab : tabs[0];
        const LANG = { python: 'Python 3', java: 'Java', c: 'C', cpp: 'C++', approach: 'Approach' };
        let solBody = '';
        if (tab === 'approach') {
            solBody = `${p.approach ? `<div class="sol-text">
                    ${p.approach.brute_force ? `<p><strong>Brute force:</strong> ${esc(p.approach.brute_force)}</p>` : ''}
                    ${p.approach.optimal ? `<p><strong>Optimal:</strong> ${esc(p.approach.optimal)}</p>` : ''}
                    ${p.approach.algorithm ? `<p><strong>Technique:</strong> ${esc(p.approach.algorithm)}</p>` : ''}</div>` : ''}
                ${Array.isArray(p.common_mistakes) && p.common_mistakes.length ? `<div><span class="eyebrow">Common mistakes</span><ul class="list-plain">${p.common_mistakes.map(m => `<li>${esc(m)}</li>`).join('')}</ul></div>` : ''}
                ${p.pro_tip ? `<div class="sol-extra"><span class="eyebrow">Exam tip · </span>${esc(p.pro_tip)}</div>` : ''}`;
        } else if (tab) {
            const v = p.solutions[tab];
            solBody = `<pre class="code" style="background:var(--surface)">${esc(solCode(v))}</pre>
                ${v.time_complexity || v.space_complexity ? `<span class="mono muted" style="font-size:14px">Time ${esc(v.time_complexity || '–')} · Space ${esc(v.space_complexity || '–')}</span>` : ''}
                ${v.explanation ? `<div class="sol-text">${rich(v.explanation)}</div>` : ''}`;
        }

        return `<section class="code-page">
            ${side(`<div class="chips">${chips(['All', ...LEVELS].map(l => [l, l]), c.level, 'code-level', 'mono')}</div>
                <input class="search" data-input="code-search" value="${esc(c.search)}" placeholder="Search problems" aria-label="Search problems">
                <div class="prob-list" data-keep-scroll="probs">${items}</div>`)}
            <div class="code-main">
                <div class="card prob-card">
                    <span class="eyebrow accent">${esc(p.subcategory || 'Problem')}${p.difficulty ? ' · ' + esc(p.difficulty) : ''}${p.is_previous_year && p.year_asked ? ' · Asked in ' + esc(p.year_asked) : ''}</span>
                    <h2>${esc(p.title)}</h2>
                    <div class="prose">${esc(p.problem_statement)}</div>
                    ${p.input_format || p.output_format ? `<div class="io-grid">
                        ${p.input_format ? `<div><span class="eyebrow">Input format</span><div class="prose" style="font-size:15px">${esc(p.input_format)}</div></div>` : ''}
                        ${p.output_format ? `<div><span class="eyebrow">Output format</span><div class="prose" style="font-size:15px">${esc(p.output_format)}</div></div>` : ''}</div>` : ''}
                    ${p.constraints ? `<div><span class="eyebrow">Constraints</span><pre class="code" style="white-space:pre-wrap;margin-top:6px">${esc(p.constraints)}</pre></div>` : ''}
                    <div class="io-grid">
                        <div><span class="eyebrow">Sample input</span><pre class="code">${esc(p.sample_input)}</pre></div>
                        <div><span class="eyebrow">Sample output</span><pre class="code">${esc(p.sample_output)}</pre></div>
                    </div>
                    ${p.explanation_of_example ? `<div class="note">${rich(p.explanation_of_example)}</div>` : ''}
                </div>
                <div class="editor">
                    <div class="editor-bar"><span>your-attempt</span><span>Saved on this device</span></div>
                    <textarea data-input="code" data-uid="${esc(uid)}" spellcheck="false" placeholder="Write your solution here, then compare it with mine.">${esc(meta.code[uid] || '')}</textarea>
                </div>
                <div class="btn-row">
                    <button class="btn ${solved ? '' : 'btn-accent'}" data-act="solved" data-arg="${esc(uid)}">${solved ? '✓ Solved · undo' : '✓ Mark as solved (+30 XP)'}</button>
                    ${tabs.length ? `<button class="btn" data-act="toggle-sol">${c.sol ? 'Hide solution' : 'Show solution'}</button>` : ''}
                </div>
                ${c.sol && tabs.length ? `<div class="sol">
                    <div class="sol-tabs">${chips(tabs.map(t => [t, LANG[t] || t]), tab, 'sol-tab')}</div>
                    ${solBody}
                </div>` : ''}
            </div>
        </section>`;
    },

    input() {
        const st = need(['input-practice']);
        if (st !== 'ok') return st === 'error' ? errorHtml() : loadingHtml('Loading practice room...');
        const s = ui.input, all = cache['input-practice'];
        const q = all.find(x => String(x.id) === String(s.id)) || all[0];
        if (!q) return VIEWS.empty();
        const draftKey = `input-${q.id}-${s.lang}`;
        const solution = q.solutions && q.solutions[s.lang] || '';
        const res = s.result && s.result.id === q.id && s.result.lang === s.lang ? s.result : null;
        return `<section class="code-page">
            <aside class="code-side">
                <h1>Input practice</h1>
                <p class="muted" style="font-size:15px;line-height:1.5;margin-bottom:6px">Learn TCS NQT input patterns by doing. Read the input yourself, then check against the standard solution.</p>
                <div class="prob-list" data-keep-scroll="inputs">${all.map((x, i) => `<button class="prob ${x === q ? 'on' : ''}" data-act="input-prob" data-arg="${esc(x.id)}">
                    <span class="prob-top"><span>Session ${i + 1}</span></span><strong>${esc(x.title)}</strong></button>`).join('')}</div>
            </aside>
            <div class="code-main">
                <div class="card prob-card">
                    <span class="eyebrow accent">Real TCS pattern</span>
                    <h2>${esc(q.title)}</h2>
                    <div class="sol-text">${rich(q.problem_statement)}</div>
                    ${q.constraints ? `<div class="note"><strong>💡 Goal &amp; logic</strong>${rich(q.constraints)}</div>` : ''}
                    ${q.input_format || q.output_format ? `<div class="io-grid">
                        ${q.input_format ? `<div><span class="eyebrow">Input format</span><div class="prose" style="font-size:15px">${esc(q.input_format)}</div></div>` : ''}
                        ${q.output_format ? `<div><span class="eyebrow">Output format</span><div class="prose" style="font-size:15px">${esc(q.output_format)}</div></div>` : ''}</div>` : ''}
                    <div class="io-grid">
                        <div><span class="eyebrow">Sample input</span><pre class="code">${esc(q.sample_input)}</pre></div>
                        <div><span class="eyebrow">Expected output</span><pre class="code">${esc(q.sample_output)}</pre></div>
                    </div>
                </div>
                <div class="editor">
                    <div class="editor-bar"><span>your-solution</span><span class="tabs">${[['python', 'Python 3'], ['java', 'Java']].map(([k, l]) => `<button class="${k === s.lang ? 'on' : ''}" data-act="input-lang" data-arg="${k}">${l}</button>`).join('')}</span></div>
                    <textarea data-input="code" data-uid="${esc(draftKey)}" spellcheck="false" placeholder="Write your input reading logic here...">${esc(meta.code[draftKey] || '')}</textarea>
                </div>
                <div class="btn-row">
                    <button class="btn btn-accent" data-act="input-check">▶ Check my logic</button>
                    <button class="btn" data-act="input-sol">${s.sol ? 'Hide solution' : '🔓 Reveal solution'}</button>
                </div>
                ${res ? `<div class="result-box ${res.ok ? 'ok' : 'bad'}">${res.empty ? 'Write some code first, then check it.'
                    : res.ok ? '<strong>✨ Logic matched!</strong> Your code matches the standard solution for this pattern.'
                        : '<strong>Not matching yet.</strong> Your code differs from the standard solution. Different code can still be right, so compare it with the solution.'}</div>` : ''}
                ${s.sol ? `<div class="sol">
                    <span class="eyebrow">Standard solution · ${s.lang === 'java' ? 'Java' : 'Python 3'}</span>
                    ${q.explanation ? `<div class="sol-text">${rich(q.explanation)}</div>` : ''}
                    <pre class="code" style="background:var(--surface)">${esc(solution)}</pre>
                </div>` : ''}
            </div>
        </section>`;
    },

    progress() {
        const s = stats();
        const groups = [['numerical', 'Numerical Ability'], ['verbal', 'Verbal Ability'], ['reasoning', 'Reasoning Ability'], ['programming', 'Programming'], ['mock', 'Mock tests']];
        const bars = groups.map(([k, name]) => {
            const d = s.by[k], p = d && d.t ? Math.round(100 * d.c / d.t) : 0;
            const color = p >= 70 ? 'var(--ok)' : p >= 40 ? 'var(--accent)' : 'var(--bad)';
            return `<div class="bar-row">
                <div class="row-between"><span style="font-weight:500">${name}</span><span class="mono muted">${d && d.t ? `${p}% · ${d.c}/${d.t}` : 'Not started'}</span></div>
                <div class="meter"><span style="width:${p}%;background:${color}"></span></div></div>`;
        }).join('');
        const saved = meta.bookmarks.map(x => `<div class="saved-row"><span>${esc(x.topic)}</span><span>${esc(x.text)}</span>
            <button data-act="unsave" data-arg="${esc(x.uid)}" title="Remove">✕</button></div>`).join('');
        return `<section class="page">
            <div style="display:flex;flex-direction:column;gap:8px">
                <h1 class="page-title">Your progress</h1>
                <p class="page-sub">${s.attempted ? 'Look how far you’ve come. Here’s where to focus next.' : 'Finish your first practice set and your stats will show up here.'}</p>
            </div>
            <div class="stat-grid">
                ${[['Day streak', s.streak], ['Questions done', s.attempted], ['Accuracy', s.acc], ['Coding solved', meta.solved.length]]
                .map(([l, v]) => `<div class="card stat"><span class="eyebrow">${l}</span><b>${v}</b></div>`).join('')}
            </div>
            <div class="two-col">
                <div class="card" style="padding:24px;display:flex;flex-direction:column;gap:18px">
                    <h2 style="font-size:22px">Accuracy by section</h2>
                    <div class="bars">${bars}</div>
                </div>
                <div class="card" style="padding:24px;display:flex;flex-direction:column;gap:12px">
                    <div class="row-between"><h2 style="font-size:22px">Badges</h2><span class="mono muted" style="font-size:13px">⚡ ${s.xp} XP · LV ${s.level}</span></div>
                    <div class="badge-list">${badges(s).map(b => `<div class="badge-item ${b.on ? 'on' : ''}"><span>${b.icon}</span><div><strong>${esc(b.label)}</strong><small>${esc(b.hint)}</small></div><span class="mono" style="font-size:13px">${b.on ? 'Earned' : 'Locked'}</span></div>`).join('')}</div>
                </div>
            </div>
            <div class="card" style="padding:24px;display:flex;flex-direction:column;gap:12px">
                <div class="row-between" style="align-items:center;flex-wrap:wrap">
                    <h2 style="font-size:22px">Saved questions</h2>
                    ${meta.bookmarks.length ? '<a class="btn btn-accent btn-sm" style="font-weight:700" href="#saved">Practise these →</a>' : ''}
                </div>
                ${saved || '<p class="muted" style="font-size:15px">Tap ☆ Save on any question and it will wait for you here.</p>'}
            </div>
        </section>`;
    },
};

function exploreGrid() {
    const st = need(SECTIONS.map(x => x.key));
    if (st === 'loading') return loadingHtml('Loading topics...');
    if (st === 'error') return '<p class="muted">Topics could not load. <button class="btn btn-sm" data-act="retry-load">Try again</button></p>';
    const list = filterTopics();
    const shown = ui.section === 'All' && !ui.search.trim()
        ? SECTIONS.map(x => list.find(t => t.sec.key === x.key)).filter(Boolean)
        : list.slice(0, 4);
    const seeAll = ui.section === 'All' ? '#topics' : '#topics/' + ui.section;
    return `${shown.length ? `<div class="topic-grid" style="margin-top:6px">${shown.map(topicCard).join('')}</div>` : '<p class="muted">Nothing matches yet. Try a shorter word.</p>'}
        <a class="btn" href="${seeAll}">See all ${getTopics().length} topics →</a>`;
}

function dailyQuestion() {
    const pool = [...cache.numerical, ...cache.reasoning].filter(q => q.difficulty !== 'Hard' && !q.code && q.text.length <= 220);
    return pool[dayNumber() % pool.length];
}

function qotdHtml() {
    const st = need(['numerical', 'reasoning']);
    const head = label => `<div class="row-between" style="align-items:center"><span class="eyebrow accent">Question of the day</span><span class="mono muted" style="font-size:12px">${label}</span></div>`;
    if (st !== 'ok') return `<div class="qotd">${head('')}<p class="muted">${st === 'error' ? 'Today’s question could not load.' : 'Loading today’s question…'}</p></div>`;
    const q = dailyQuestion();
    const done = meta.daily && meta.daily.day === today() && meta.daily.uid === q.uid ? meta.daily.choice : null;
    const opts = q.options.map(([k, label]) => {
        const cls = done != null && k === q.answer ? 'ok' : done === k ? 'bad' : '';
        return `<button class="${cls}" data-act="daily" data-arg="${esc(k)}" ${done != null ? 'disabled' : ''}><b>${esc(k)}</b><span>${esc(label)}</span></button>`;
    }).join('');
    const right = (q.options.find(([k]) => k === q.answer) || [q.answer, q.answer])[1];
    return `<div class="qotd">
        ${head(`${esc(q.section.replace(' Ability', ''))} · ${esc(q.topic)}`)}
        <p class="qotd-q">${esc(q.text)}</p>
        <div class="opt-grid">${opts}</div>
        ${done != null ? `<div class="note"><strong>${done === q.answer ? 'Yes! +10 XP ⚡' : `It’s ${esc(q.answer)} (${esc(right)}).`}</strong> ${esc(q.hint)}
            ${q.tip ? `<div style="margin-top:8px" class="muted"><span class="eyebrow accent">Exam tip · </span>${esc(q.tip)}</div>` : ''}</div>` : ''}
    </div>`;
}

function burstHtml(idx) {
    const cols = ['var(--accent)', 'var(--sun)', '#221d17', 'oklch(0.7 0.16 25)', 'oklch(0.72 0.14 150)'];
    let seed = idx * 97 + 13;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const bits = Array.from({ length: 34 }, (_, i) => {
        const a = rnd() * Math.PI * 2, d = 120 + rnd() * 220;
        return `<i style="width:${8 + rnd() * 6}px;height:${10 + rnd() * 8}px;border-radius:${rnd() > .5 ? 2 : 999}px;background:${cols[i % cols.length]};--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d - 60}px;--r:${rnd() * 720}deg;animation-delay:${rnd() * 0.08}s"></i>`;
    }).join('');
    return `<div class="burst">${bits}<b>+10 XP</b></div>`;
}

// ---------- Actions ----------
const ACTIONS = {
    'retry-load': () => { Object.keys(failed).forEach(k => delete failed[k]); route(); },
    exam: name => { meta.exam = name; saveMeta(); paint(); },
    section: key => { ui.section = key; paint(); },
    level: lvl => { ui.level = lvl; paint(); },
    daily: key => {
        const q = dailyQuestion();
        meta.daily = { day: today(), uid: q.uid, choice: key };
        record(q, key);
        saveAnswered();
        saveMeta();
        paint();
    },

    pick: key => pick(key),
    go: i => go(+i),
    prev: () => go(ui.quiz.idx - 1),
    primary: () => primary(),
    finish: () => finish(),
    hint: () => { ui.quiz.hints[ui.quiz.idx] = true; paint(); },
    flag: () => { const q = ui.quiz; q.flags[q.idx] = !q.flags[q.idx]; paint(); },
    bookmark: () => { const q = ui.quiz; toggleBookmark(q.qs[q.idx]); paint(); },
    review: i => { ui.view = 'quiz'; ui.quiz.idx = +i; paint(); window.scrollTo(0, 0); },
    retry: () => { const q = ui.quiz; startQuiz({ mode: q.mode, title: q.title, back: q.back, key: q.key, qs: q.mode === 'practice' ? shuffle(q.qs) : q.qs }); },
    unsave: uid => { meta.bookmarks = meta.bookmarks.filter(x => x.uid !== uid); saveMeta(); paint(); },

    'code-set': set => { location.hash = set; },
    'code-level': lvl => { ui.coding.level = lvl; paint(); },
    prob: id => {
        const c = ui.coding;
        c.ids[c.set] = id;
        c.sol = false;
        history.replaceState(null, '', `#${c.set}/${encodeURIComponent(id)}`);
        paint();
        if (window.innerWidth < 900) document.querySelector('.code-main')?.scrollIntoView({ behavior: 'smooth' });
    },
    solved: uid => {
        const i = meta.solved.indexOf(uid);
        if (i >= 0) meta.solved.splice(i, 1);
        else { meta.solved.push(uid); touchStreak(); }
        saveMeta();
        paint();
    },
    'toggle-sol': () => { ui.coding.sol = !ui.coding.sol; paint(); },
    'sol-tab': tab => { ui.coding.tab = tab; paint(); },

    'input-prob': id => { Object.assign(ui.input, { id, result: null, sol: false }); paint(); },
    'input-lang': lang => { Object.assign(ui.input, { lang, result: null }); paint(); },
    'input-check': () => {
        const s = ui.input, q = cache['input-practice'].find(x => String(x.id) === String(s.id)) || cache['input-practice'][0];
        const draft = (meta.code[`input-${q.id}-${s.lang}`] || '').trim();
        const norm = str => str.replace(/\s+/g, ' ').trim();
        s.id = q.id;
        s.result = { id: q.id, lang: s.lang, empty: !draft, ok: !!draft && norm(draft) === norm(q.solutions[s.lang] || '') };
        paint();
    },
    'input-sol': () => { ui.input.sol = !ui.input.sol; paint(); },
};

document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (el && !el.disabled && ACTIONS[el.dataset.act]) {
        e.preventDefault();
        ACTIONS[el.dataset.act](el.dataset.arg);
        return;
    }
    // Re-run the route when a link points at the page we're already on
    const a = e.target.closest('a[href^="#"]');
    if (a && a.getAttribute('href') === (location.hash || '#')) { e.preventDefault(); route(); }
});

let codeSaveTimer = null;
document.addEventListener('input', e => {
    const key = e.target.dataset && e.target.dataset.input;
    if (key === 'search') { ui.search = e.target.value; paint(); }
    else if (key === 'code-search') { ui.coding.search = e.target.value; paint(); }
    else if (key === 'code') {
        meta.code[e.target.dataset.uid] = e.target.value;
        clearTimeout(codeSaveTimer);
        codeSaveTimer = setTimeout(saveMeta, 400);
    }
});

// Tab inserts spaces in the code editors
document.addEventListener('keydown', e => {
    if (e.key === 'Tab' && e.target.dataset && e.target.dataset.input === 'code') {
        e.preventDefault();
        e.target.setRangeText('    ', e.target.selectionStart, e.target.selectionEnd, 'end');
        e.target.dispatchEvent(new Event('input', { bubbles: true }));
        return;
    }
    if (ui.view !== 'quiz' || !ui.quiz || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (/^(BUTTON|A)$/.test(e.target.tagName) && e.key === 'Enter') return;
    const key = e.key.toUpperCase();
    const cur = ui.quiz.qs[ui.quiz.idx];
    if (cur.options.some(([k]) => k === key)) pick(key);
    else if (e.key === 'Enter') { e.preventDefault(); primary(); }
});

// One clock for the quiz timer
setInterval(() => {
    const q = ui.quiz;
    if (ui.view !== 'quiz' || !q || q.submitted) return;
    ui.elapsed++;
    const el = document.getElementById('timer-num');
    if (q.mode === 'mock') {
        const left = q.limit - ui.elapsed;
        if (left <= 0) return finish();
        if (el) { el.textContent = fmt(left); el.classList.toggle('low', left <= 60); }
    } else if (el) {
        el.textContent = fmt(ui.elapsed);
    }
}, 1000);

window.addEventListener('hashchange', route);
route();
