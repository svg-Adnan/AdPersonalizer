let currentAdImageBase64 = null;

// ─── Streaming Personalization ──────────────────────────────────
document.getElementById('generateBtn').addEventListener('click', async () => {
    const adCreative = document.getElementById('adCreative').value;
    const landingUrl = document.getElementById('landingUrl').value;
    const generateBtn = document.getElementById('generateBtn');
    const pipelineProgress = document.getElementById('pipelineProgress');
    const resultSection = document.getElementById('resultSection');

    if ((!adCreative && !currentAdImageBase64) || !landingUrl) {
        alert('Please provide an ad creative description or paste an image, and enter a landing page URL.');
        return;
    }

    // Reset UI
    generateBtn.disabled = true;
    pipelineProgress.classList.remove('hidden');
    resultSection.style.display = 'none';
    resetStageIndicators();

    try {
        const response = await fetch('/api/personalize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adCreative, url: landingUrl, adImage: currentAdImageBase64 })
        });

        if (!response.ok && response.headers.get('content-type')?.includes('application/json')) {
            const err = await response.json();
            throw new Error(err.error || 'Request failed');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            let eventType = '';
            for (const line of lines) {
                if (line.startsWith('event: ')) {
                    eventType = line.slice(7).trim();
                } else if (line.startsWith('data: ') && eventType) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        handleSSEEvent(eventType, data);
                    } catch (e) {
                        // Skip malformed events
                    }
                    eventType = '';
                }
            }
        }
    } catch (error) {
        console.error(error);
        alert('Error: ' + error.message);
        pipelineProgress.classList.add('hidden');
    } finally {
        generateBtn.disabled = false;
    }
});

function handleSSEEvent(eventType, data) {
    if (eventType === 'stage') {
        updateStageIndicator(data.stage, data.status);
    } else if (eventType === 'complete') {
        document.getElementById('pipelineProgress').classList.add('hidden');
        
        if (data.appTheme) {
            applyGlobalTheme(data.appTheme);
        }
        
        renderResults(data, data.historyId);
        renderEvaluation(data.evaluation);
        
        document.getElementById('inputSection').style.display = 'none';
        document.getElementById('resultSection').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Refresh history
        loadHistory();
    } else if (eventType === 'error') {
        document.getElementById('pipelineProgress').classList.add('hidden');
        alert('Pipeline error: ' + data.error);
    }
}

// ─── Stage Progress UI ─────────────────────────────────────────
function resetStageIndicators() {
    document.querySelectorAll('.stage-item').forEach(el => {
        el.classList.remove('running', 'complete', 'error');
        el.querySelector('.stage-status').textContent = '';
    });
}

function updateStageIndicator(stage, status) {
    const item = document.querySelector(`.stage-item[data-stage="${stage}"]`);
    if (!item) return;
    
    item.classList.remove('running', 'complete', 'error');
    item.classList.add(status);
    
    const statusEl = item.querySelector('.stage-status');
    if (status === 'running') statusEl.textContent = '⏳';
    else if (status === 'complete') statusEl.textContent = '✅';
    else if (status === 'error') statusEl.textContent = '❌';
}

// ─── Evaluation Scores ─────────────────────────────────────────
function renderEvaluation(evaluation) {
    if (!evaluation) return;

    const scores = [
        { id: 'evalToneMatch', value: evaluation.tone_match_score },
        { id: 'evalCtaStrength', value: evaluation.cta_strength },
        { id: 'evalEmotional', value: evaluation.emotional_consistency },
        { id: 'evalOverall', value: evaluation.overall_score },
    ];

    scores.forEach(({ id, value }) => {
        const card = document.getElementById(id);
        if (!card) return;
        
        const scoreEl = card.querySelector('.eval-score');
        const barFill = card.querySelector('.eval-bar-fill');
        
        scoreEl.textContent = value.toFixed(1);
        barFill.style.width = `${value * 10}%`;
        
        // Color coding
        let color = '#ef4444'; // red
        if (value >= 7) color = '#22c55e'; // green
        else if (value >= 5) color = '#eab308'; // yellow
        
        barFill.style.background = color;
        scoreEl.style.color = color;
    });

    // Feedback
    const feedbackEl = document.getElementById('evalFeedback');
    if (evaluation.feedback && evaluation.feedback.length > 0) {
        feedbackEl.innerHTML = evaluation.feedback
            .map(f => `<div class="eval-feedback-item">💡 ${f}</div>`)
            .join('');
    }
}

// ─── History ────────────────────────────────────────────────────
document.getElementById('toggleHistoryBtn').addEventListener('click', () => {
    const list = document.getElementById('historyList');
    const btn = document.getElementById('toggleHistoryBtn');
    list.classList.toggle('hidden');
    btn.textContent = list.classList.contains('hidden') ? 'Show History' : 'Hide History';
    if (!list.classList.contains('hidden')) loadHistory();
});

async function loadHistory() {
    try {
        const res = await fetch('/api/history?limit=10');
        const data = await res.json();
        const list = document.getElementById('historyList');
        
        if (!data.results || data.results.length === 0) {
            list.innerHTML = '<div class="history-empty">No generations yet.</div>';
            return;
        }

        list.innerHTML = data.results.map(item => `
            <div class="history-item" data-id="${item.id}">
                <div class="history-item-header">
                    <span class="history-url">${item.landing_url}</span>
                    <span class="history-date">${new Date(item.created_at).toLocaleString()}</span>
                </div>
                <div class="history-item-body">
                    <span class="history-ad">${(item.ad_creative || '').substring(0, 80)}...</span>
                    <span class="history-score">${item.evaluation_scores?.overall_score?.toFixed(1) || '—'}/10</span>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Failed to load history:', e);
    }
}

// ─── Start Over ─────────────────────────────────────────────────
document.getElementById('startOverBtn')?.addEventListener('click', () => {
    resetTheme();
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('inputSection').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ─── Load Sample ────────────────────────────────────────────────
document.getElementById('loadFitnessBtn').addEventListener('click', () => {
    document.getElementById('adCreative').value = "Premium 1-on-1 fitness coaching for busy tech executives looking to lose 20lbs in 90 days without giving up their favorite foods. Private, data-driven, and results-guaranteed.";
    document.getElementById('landingUrl').value = "https://example.com/elite-coaching-demo";
});

// ─── Image Upload Logic ─────────────────────────────────────────
const adDropzone = document.getElementById('adDropzone');
const adCreativeInput = document.getElementById('adCreative');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const adImagePreview = document.getElementById('adImagePreview');
const clearImageBtn = document.getElementById('clearImageBtn');

function handleImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        currentAdImageBase64 = e.target.result;
        adImagePreview.src = currentAdImageBase64;
        imagePreviewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

adDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    adDropzone.classList.add('dragover');
});
adDropzone.addEventListener('dragleave', () => adDropzone.classList.remove('dragover'));
adDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    adDropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleImageFile(e.dataTransfer.files[0]);
    }
});

adCreativeInput.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (const item of items) {
        if (item.type.indexOf('image') === 0) {
            handleImageFile(item.getAsFile());
        }
    }
});

clearImageBtn.addEventListener('click', () => {
    currentAdImageBase64 = null;
    adImagePreview.src = '';
    imagePreviewContainer.classList.add('hidden');
});

// ─── Theme Application ─────────────────────────────────────────
function applyGlobalTheme(theme) {
    const root = document.documentElement;
    if (theme.primaryColor) root.style.setProperty('--primary', theme.primaryColor);
    if (theme.secondaryColor) root.style.setProperty('--secondary', theme.secondaryColor);
    if (theme.backgroundColor) root.style.setProperty('--app-bg', theme.backgroundColor);
    if (theme.cardBg) root.style.setProperty('--card-bg', theme.cardBg);
    if (theme.fontFamily) root.style.setProperty('--app-font', theme.fontFamily + ', sans-serif');
}

function resetTheme() {
    const root = document.documentElement;
    root.style.removeProperty('--primary');
    root.style.removeProperty('--secondary');
    root.style.removeProperty('--app-bg');
    root.style.removeProperty('--card-bg');
    root.style.removeProperty('--app-font');
}

// ─── Landing Page UI Renderer ───────────────────────────────────
function createLandingPageUI(pageData, config = {}) {
    const isPersonalized = config.isPersonalized || false;
    const theme = config.theme || {};
    const heroImage = config.heroImageBase64 || null;
    const targetUrl = config.targetUrl || '#';

    let uiStyle = '';
    let bodyStyle = '';
    let btnStyle = '';

    if (isPersonalized) {
        if (heroImage) {
            uiStyle = `background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url('${heroImage}'); background-size: cover; background-position: center; border: none;`;
            bodyStyle = `background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); color: #f8fafc;`;
        } else if (theme.backgroundColor) {
            uiStyle = `background: ${theme.backgroundColor};`;
            bodyStyle = `background: ${theme.cardBg || 'rgba(0,0,0,0.2)'}; color: #f8fafc;`;
        }
        if (theme.primaryColor) {
            btnStyle = `background: ${theme.primaryColor}; color: white; border: none; box-shadow: 0 4px 15px ${theme.primaryColor}66;`;
        }
        if (theme.fontFamily) {
            uiStyle += ` font-family: '${theme.fontFamily}', sans-serif;`;
        }
    }

    const sectionsHTML = pageData.sections.map(s => `
        <div class="lp-section">
            <div class="lp-section-icon" style="${isPersonalized && theme.primaryColor ? `color: ${theme.primaryColor}; background: ${theme.primaryColor}22;` : ''}">❖</div>
            <p style="${isPersonalized ? 'color: #e2e8f0;' : ''}">${s}</p>
        </div>
    `).join('');

    const redirectBtnHTML = isPersonalized ? `
        <div style="text-align: center; padding: 1rem; border-top: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.8);">
            <a href="${targetUrl}" target="_blank" style="color: ${theme.primaryColor || '#3b82f6'}; text-decoration: none; font-weight: bold; font-size: 0.9rem;">Visit Live Website ↗</a>
        </div>
    ` : '';

    return `
        <div class="landing-page-ui" style="${uiStyle}">
            <div class="lp-hero" style="background: transparent; border-bottom: none;">
                <h1 class="lp-headline" style="${isPersonalized ? 'color: #ffffff; text-shadow: 0 2px 10px rgba(0,0,0,0.5);' : ''}">${pageData.headline}</h1>
                <p class="lp-subheadline" style="${isPersonalized ? 'color: #e2e8f0; text-shadow: 0 1px 5px rgba(0,0,0,0.5);' : ''}">${pageData.subheadline}</p>
                <button class="lp-cta" style="${btnStyle}">${pageData.cta}</button>
            </div>
            <div class="lp-body" style="${bodyStyle}">
                ${sectionsHTML}
            </div>
            ${redirectBtnHTML}
        </div>
    `;
}

function renderResults(data, historyId) {
    const originalContainer = document.getElementById('originalContent');
    const personalizedContainer = document.getElementById('personalizedContent');
    const improvementsList = document.getElementById('improvementsList');

    originalContainer.innerHTML = createLandingPageUI(data.original);

    const personalizedData = {
        headline: data.headline,
        subheadline: data.subheadline,
        cta: data.cta,
        sections: data.section_improvements.map(s => s.improved)
    };
    personalizedContainer.innerHTML = createLandingPageUI(personalizedData, {
        isPersonalized: true,
        theme: data.appTheme,
        heroImageBase64: currentAdImageBase64,
        targetUrl: historyId ? `/preview/${historyId}` : '#'
    });

    improvementsList.innerHTML = data.reasoning.map(reason => `
        <div class="improvement-card">
            <div style="font-weight: 700; color: var(--primary); margin-bottom: 0.5rem;">• CRO Logic</div>
            <div>${reason}</div>
        </div>
    `).join('');
}
