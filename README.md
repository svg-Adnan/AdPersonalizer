# AdPersonalizer

AI-powered multimodal landing page personalization platform that analyzes ad creatives, landing pages, and visual branding to generate semantically aligned marketing copy, adaptive UI themes, and optimized landing page experiences for higher conversion rates.

![AdPersonalizer Landing Page](./images/landing-page.png)<img width="2241" height="1242" alt="image" src="https://github.com/user-attachments/assets/f1338b27-2968-492d-a40b-3e02ca5e5cda" />

## Features

- Multimodal AI analysis using text + image understanding
- Landing page scraping and semantic analysis
- AI-generated personalized marketing copy
- Dynamic UI theme generation based on ad creatives
- Side-by-side comparison of original vs personalized content
- AI quality scoring and evaluation metrics
- Modular AI pipeline architecture
- Local history storage using SQLite
- Lightweight and CPU-friendly architecture
- Structured TypeScript backend with schema validation

  ## AI Pipeline

The application processes personalization through a modular AI workflow:

1. Scraping Landing Page
2. Analyzing Ad Creative
3. Analyzing Landing Page
4. Matching Tone & Messaging
5. Generating Personalized Copy
6. Generating Dynamic Theme
7. Evaluating AI Output Quality

The pipeline is designed to improve semantic alignment between advertisements and landing pages for better conversion optimization.

![AI Pipeline](./images/pipeline.png)<img width="2254" height="1081" alt="image" src="https://github.com/user-attachments/assets/f95c607d-2e56-4a0c-9c44-09dd136c6b99" />

## AI Quality Evaluation

The system includes an AI evaluation layer that scores generated outputs on:

- Tone Match
- CTA Strength
- Emotional Consistency
- Overall Personalization Quality

This creates a more reliable and explainable AI personalization workflow instead of simple text generation.

![AI Quality Scores](./images/benchmarks.png)<img width="2173" height="1029" alt="image" src="https://github.com/user-attachments/assets/d1daaab9-2b4c-44da-960a-fbcc78e8866a" />

## Original vs Personalized Output

AdPersonalizer compares original landing page content with AI-generated personalized content to demonstrate semantic and visual transformation.

The generated page adapts:
- Messaging tone
- Headlines
- CTA strategy
- Branding aesthetics
- Visual hierarchy
- Emotional framing

![Before vs After](./images/output-comparison.png)<img width="1819" height="1239" alt="image" src="https://github.com/user-attachments/assets/0189798e-8093-44c3-8fee-2d71ddaac83d" />

## Personalized Landing Page Preview

Users can open the generated personalized landing page as a standalone live website preview generated dynamically from AI outputs.

![Live Website Preview](./images/live-preview.png)<img width="2254" height="1189" alt="image" src="https://github.com/user-attachments/assets/877ef49c-f014-42a6-bb05-bc37ee65e751" />

## Tech Stack

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript
- Dynamic Theme Rendering

### Backend
- TypeScript
- Node.js
- Express.js

### AI & Processing
- OpenAI / Vision APIs
- Multimodal Prompt Engineering
- Modular AI Pipelines
- Zod Schema Validation

### Web Scraping
- Playwright

### Database
- SQLite

### Additional Tools
- Axios
- Dotenv
- Sharp## Tech Stack

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript
- Dynamic Theme Rendering

### Backend
- TypeScript
- Node.js
- Express.js

### AI & Processing
- OpenAI / Vision APIs
- Multimodal Prompt Engineering
- Modular AI Pipelines
- Zod Schema Validation

### Web Scraping
- Playwright

### Database
- SQLite

### Additional Tools
- Axios
- Dotenv
- Sharp

  ## Installation & Setup

### Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/adpersonalizer.git
cd adpersonalizer


```
### Install Dependencies
npm install

### Setup Environment Variables
Create a .env file:
OPENAI_API_KEY=your_api_key

### Run Development Server
npm run dev

### Open:
The server runs on the port configured in the environment variables or default application configuration.




