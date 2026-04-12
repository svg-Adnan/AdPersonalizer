document.getElementById('generateBtn').addEventListener('click', async () => {
    const adCreative = document.getElementById('adCreative').value;
    const landingUrl = document.getElementById('landingUrl').value;
    const loader = document.getElementById('loader');
    const resultSection = document.getElementById('resultSection');
    const generateBtn = document.getElementById('generateBtn');

    if (!adCreative || !landingUrl) {
        alert('Please provide both ad creative and a landing page URL.');
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
            body: JSON.stringify({ adCreative, url: landingUrl })
        });

        const data = await response.json();

        if (data.error) throw new Error(data.error);

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
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('inputSection').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('loadFitnessBtn').addEventListener('click', () => {
    document.getElementById('adCreative').value = "Premium 1-on-1 fitness coaching for busy tech executives looking to lose 20lbs in 90 days without giving up their favorite foods. Private, data-driven, and results-guaranteed.";
    document.getElementById('landingUrl').value = "https://example.com/elite-coaching-demo";
    // We'll simulate the backend knowing this URL is a sample if it fails to scrape
});

function createLandingPageUI(pageData) {
    const sectionsHTML = pageData.sections.map(s => `
        <div class="lp-section">
            <div class="lp-section-icon">❖</div>
            <p>${s}</p>
        </div>
    `).join('');

    return `
        <div class="landing-page-ui">
            <div class="lp-hero">
                <h1 class="lp-headline">${pageData.headline}</h1>
                <p class="lp-subheadline">${pageData.subheadline}</p>
                <button class="lp-cta">${pageData.cta}</button>
            </div>
            <div class="lp-body">
                ${sectionsHTML}
            </div>
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
    personalizedContainer.innerHTML = createLandingPageUI(personalizedData);

    // Render Reasoning
    improvementsList.innerHTML = data.reasoning.map(reason => `
        <div class="improvement-card">
            <div style="font-weight: 700; color: var(--primary); margin-bottom: 0.5rem;">• CRO Logic</div>
            <div>${reason}</div>
        </div>
    `).join('');
}
