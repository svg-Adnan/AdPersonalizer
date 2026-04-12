const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const { Groq } = require('groq-sdk');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname)); // Serve static files (frontend)

const PORT = 3002;
// --- AIService Layer ---
class AIService {
    constructor() {
        const apiKey = process.env.GROQ_API_KEY;
        this.groq = apiKey ? new Groq({ apiKey }) : null;
    }

    async analyzeImageWithVision(imageBase64) {
        if (!this.groq) return "Mock Vision Ad Details: Intense fitness characters, bold muscular definition, dark high-contrast lighting, aggressive and motivational copy.";
        try {
            const completion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Describe the ad copy, the characters, the visual art style, the overall tone, and the core promise from this image. Be highly specific so we can use this to adapt a landing page's copy to match this style." },
                            { type: "image_url", image_url: { url: imageBase64 } }
                        ]
                    }
                ],
                model: "meta-llama/llama-4-scout-17b-16e-instruct"
            });
            return completion.choices[0].message.content;
        } catch (error) {
            console.error('Groq Vision API Error:', error);
            return "Vision Analysis Failed or Unavailable.";
        }
    }

    async analyzeAndPersonalize(adCreativeText, adImageBase64, originalContent) {
        let combinedAdCreative = adCreativeText || "";
        
        if (adImageBase64) {
            console.log("Analyzing image with Vision...");
            const visionContext = await this.analyzeImageWithVision(adImageBase64);
            combinedAdCreative += `\n\n[IMAGE VISUAL CONTEXT EXTRACTED BY VISION AI]\n${visionContext}`;
        }

        const adCreative = combinedAdCreative.trim();

        if (!this.groq) {
            console.warn('No Groq API key provided. Falling back to simulation.');
            return this.mockPersonalize(adCreative, originalContent);
        }

        try {
            const prompt = `
            You are a landing page optimization expert. 
            
            AD CREATIVE:
            "${adCreative}"
            
            ORIGINAL PAGE CONTENT:
            - Headline: "${originalContent.headline}"
            - Subheadline: "${originalContent.subheadline}"
            - CTA: "${originalContent.cta}"
            - Sections: ${JSON.stringify(originalContent.sections)}
            
            TASKS:
            1. Analyze the Ad Creative for: Target audience, Main promise, Tone, and Key benefits.
            2. Personalize the landing page content to align perfectly with the ad creative.
            3. Keep the same structure. Do not change the layout.
            4. Provide "What changed and why" as a list of bullet points explaining specific CRO improvements (e.g. "Aligned headline with ad promise to reduce bounce").
            5. Ensure outputs are concise, specific, and conversion-focused. Do not use generic placeholders.
            6. UI Skinning: Define an "appTheme" that changes the colors and typography of the AdPersonalizer app itself to match the ad's visual style. Pick a fontFamily from: 'Inter', 'Montserrat', 'Playfair Display', or 'Roboto Mono'.
            
            OUTPUT JSON FORMAT:
            {
                "headline": "...",
                "subheadline": "...",
                "cta": "...",
                "section_improvements": [
                    { "original": "...", "improved": "...", "explanation": "..." },
                    ...
                ],
                "reasoning": ["...", "...", "..."],
                "appTheme": {
                    "primaryColor": "Hex",
                    "secondaryColor": "Hex",
                    "backgroundColor": "Hex",
                    "cardBg": "RGBA",
                    "fontFamily": "Inter | Montserrat | Playfair Display | Roboto Mono"
                },
                "analysis": {
                    "audience": "...",
                    "promise": "...",
                    "tone": "...",
                    "benefits": ["...", "..."]
                }
            }
            `;

            const completion = await this.groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.3-70b-versatile', // Update to active model
                response_format: { type: 'json_object' }
            });

            return JSON.parse(completion.choices[0].message.content);
        } catch (error) {
            console.error('Groq API Error:', error);
            return this.mockPersonalize(adCreative, originalContent);
        }
    }

    mockPersonalize(adCreative, originalContent) {
        const adWords = adCreative.split(' ').slice(0, 6).join(' ') + (adCreative.split(' ').length > 6 ? '...' : '');
        return {
            headline: `Transform Faster: ${adWords}`,
            subheadline: `Discover how our targeted approach delivers the exact results you're looking for.`,
            cta: `Get Started Now`,
            section_improvements: originalContent.sections.map((s, i) => ({
                original: s,
                improved: `We adapt our core strategies to specifically support: ${adWords}. Experience accelerated progress without generic advice.`,
                explanation: `Replaced generic feature description with a direct tie-in to the specific ad promise.`
            })),
            reasoning: [
                "Aligned headline with the ad promise to reduce bounce rate immediately upon arrival.",
                "Adjusted subheadline to validate user intent instead of stating generic features.",
                "Modified section messaging to carry the ad's narrative through the entire page experience."
            ],
            appTheme: {
                primaryColor: "#f43f5e",
                secondaryColor: "#fb923c",
                backgroundColor: "#0f172a",
                cardBg: "rgba(30, 41, 59, 0.7)",
                fontFamily: "Montserrat"
            },
            analysis: {
                audience: "Audience derived from ad intent",
                promise: adWords,
                tone: "Action-oriented and specific",
                benefits: ["Targeted progress", "Personalized approach"]
            }
        };
    }
}

// --- Scraping Engine ---
async function scrapeLandingPage(url) {
    const defaultPage = {
        headline: "Transform Your Body in 30 Days",
        subheadline: "Personalized fitness coaching designed for real results",
        cta: "Start Your Journey",
        sections: [
            "Custom workout plans tailored to your goals",
            "Nutrition guidance that fits your lifestyle",
            "Track progress and stay motivated"
        ]
    };

    // Demo Sample Case
    if (url === 'https://example.com/elite-coaching-demo' || !url) {
        return defaultPage;
    }

    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(data);

        // Filter out unwanted elements
        $('nav, footer, script, style, noscript, .popup, .overlay, #menu, .header-menu').remove();

        const headline = $('h1').first().text().trim() || 'No Headline Found';
        const subheadline = $('h2, p').filter(function() {
            return $(this).text().length > 20 && $(this).text().length < 200;
        }).first().text().trim() || 'No Subheadline Found';
        
        const cta = $('button, a.button, a.btn, .cta').filter(function() {
            const text = $(this).text().trim();
            return text.length > 0 && text.length < 30;
        }).first().text().trim() || 'Click Here';

        const sections = [];
        $('section, div').each((i, el) => {
            if (sections.length >= 3) return false;
            const text = $(el).text().trim();
            // Look for visible sections with substantial content
            if (text.length > 100 && $(el).is(':visible') !== false) {
                // Get clean text (limit length for demo)
                const cleanText = text.replace(/\s\s+/g, ' ').substring(0, 500);
                if (!sections.includes(cleanText)) {
                    sections.push(cleanText);
                }
            }
        });

        return { headline, subheadline, cta, sections };
    } catch (error) {
        console.error('Scraping Error:', error);
        // Fallback to sample data if scraping fails
        return defaultPage;
    }
}

// --- Endpoints ---
app.post('/api/personalize', async (req, res) => {
    const { url, adCreative, adImage } = req.body;

    if (!adCreative && !adImage) {
        return res.status(400).json({ error: 'Ad Creative or Image is required' });
    }

    try {
        const originalContent = await scrapeLandingPage(url);
        const aiService = new AIService();
        const result = await aiService.analyzeAndPersonalize(adCreative, adImage, originalContent);

        res.json({
            original: originalContent,
            ...result
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, (err) => {
    if (err) {
        console.error('Failed to start server:', err);
        return;
    }
    console.log(`Server running on http://localhost:${PORT}`);
});
