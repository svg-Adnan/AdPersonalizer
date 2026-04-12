let currentAdImageBase64 = null;

document.getElementById('generateBtn').addEventListener('click', async () => {
    const adCreative = document.getElementById('adCreative').value;
    const landingUrl = document.getElementById('landingUrl').value;
    const loader = document.getElementById('loader');
    const resultSection = document.getElementById('resultSection');
    const generateBtn = document.getElementById('generateBtn');

    if ((!adCreative && !currentAdImageBase64) || !landingUrl) {
        alert('Please provide an ad creative description or paste an image, and enter a landing page URL.');
        return;
    }

    // Reset UI
    generateBtn.disabled = true;
    loader.style.display = 'block';
    resultSection.style.display = 'none';

    try {
        const response = await fetch('http://localhost:3002/api/personalize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adCreative, url: landingUrl, adImage: currentAdImageBase64 })
        });

        const data = await response.json();

        if (data.error) throw new Error(data.error);

        if (data.appTheme) {
            applyGlobalTheme(data.appTheme);
        }

        renderResults(data);
        
        document.getElementById('inputSection').style.display = 'none';
        resultSection.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error(error);
        alert('Error: ' + error.message);
    } finally {
        generateBtn.disabled = false;
        loader.style.display = 'none';
    }
});

document.getElementById('startOverBtn')?.addEventListener('click', () => {
    resetTheme();
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('inputSection').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('loadFitnessBtn').addEventListener('click', () => {
    document.getElementById('adCreative').value = "Premium 1-on-1 fitness coaching for busy tech executives looking to lose 20lbs in 90 days without giving up their favorite foods. Private, data-driven, and results-guaranteed.";
    document.getElementById('landingUrl').value = "https://example.com/elite-coaching-demo";
    // We'll simulate the backend knowing this URL is a sample if it fails to scrape
});

// --- Image Upload Logic ---
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

// Drag & Drop
adDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    adDropzone.classList.add('dragover');
});
adDropzone.addEventListener('dragleave', () => {
    adDropzone.classList.remove('dragover');
});
adDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    adDropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleImageFile(e.dataTransfer.files[0]);
    }
});

// Paste
adCreativeInput.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (const item of items) {
        if (item.type.indexOf('image') === 0) {
            handleImageFile(item.getAsFile());
            // Optionally prevent default if you don't want text pasted too, but allowing both is fine
        }
    }
});

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

clearImageBtn.addEventListener('click', () => {
    currentAdImageBase64 = null;
    adImagePreview.src = '';
    imagePreviewContainer.classList.add('hidden');
});

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
            // Apply image to the entire UI instead of just the hero
            uiStyle = `background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url('${heroImage}'); background-size: cover; background-position: center; border: none;`;
            bodyStyle = `background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); color: #f8fafc;`; // Glassmorphism body
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

function renderResults(data) {
    const originalContainer = document.getElementById('originalContent');
    const personalizedContainer = document.getElementById('personalizedContent');
    const improvementsList = document.getElementById('improvementsList');

    // Render Original Side
    originalContainer.innerHTML = createLandingPageUI(data.original);

    // Render Personalized Side
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
        targetUrl: document.getElementById('landingUrl').value
    });

    // Render Reasoning
    improvementsList.innerHTML = data.reasoning.map(reason => `
        <div class="improvement-card">
            <div style="font-weight: 700; color: var(--primary); margin-bottom: 0.5rem;">• CRO Logic</div>
            <div>${reason}</div>
        </div>
    `).join('');
}
