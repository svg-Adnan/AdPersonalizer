const { Groq } = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function listModels() {
    try {
        const models = await groq.models.list();
        console.log(JSON.stringify(models, null, 2));
    } catch (error) {
        console.error('Error fetching models:', error);
    }
}

listModels();
