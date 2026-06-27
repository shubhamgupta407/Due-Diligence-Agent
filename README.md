# Due Diligence AI (DueDil)

Due Diligence AI is a highly sophisticated, multi-agent AI platform designed to automate and accelerate financial due diligence and competitive research. Built with a stunning, institutional-grade UI, the platform orchestrates a network of specialized AI agents to aggregate live market data, semantically vectorize context, and deterministically synthesize comprehensive investment reports.

## 🚀 Overview — What it does

Traditional due diligence requires hours of manual web scraping, reading SEC filings, and aggregating competitor data. DueDil automates this entire pipeline using a multi-agent framework:
1. **Intake:** Users input a target company or financial query.
2. **Research Agent (Tavily):** Crawls the live web, SEC filings, and news sources to extract real-time financial context.
3. **Reasoning Agent (Groq / Llama-3):** Evaluates the aggregated state schema, applies logical reasoning, and determines risk factors.
4. **Final Synthesis:** Outputs a highly structured, deterministic JSON payload rendered as an interactive, quantitative report featuring confidence scoring, bear/bull cases, and actionable insights.

## 🛠️ How to run it

### Prerequisites
- Node.js 18.x or later
- npm or yarn
- API Keys for backend integration (Groq, Tavily)

### Setup Steps
1. **Clone the repository:**
   ```bash
   git clone https://github.com/shubhamgupta407/due-dilligence-agent.git
   cd due-dilligence-agent
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory based on the provided template:
   ```env
   # .env.local
   GROQ_API_KEY=gsk_your_groq_api_key_here
   TAVILY_API_KEY=tvly_your_tavily_api_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## 🧠 How it works — Approach and Architecture

The application is built using a modern **Next.js (App Router)** frontend paired with a conceptual **LangGraph** backend architecture.

### Frontend Architecture
- **Framework:** React / Next.js with TypeScript for strict type-safety.
- **Styling:** Tailwind CSS for a highly responsive, custom-built, "cyber-institutional" aesthetic (glassmorphism, radial gradients, custom keyframe animations).
- **Icons:** `lucide-react` for clean, consistent UI iconography.

### Backend / Agent Architecture (Conceptualized)
The platform relies on a **Shared State Schema** orchestrated by LangGraph:
- **State Schema:** A shared JSON matrix passed between agents containing the ongoing analysis, risk flags, and raw data chunks.
- **Research Node:** Powered by the Tavily Search API. It acts as the "eyes," aggressively scraping broad context and filtering out noise.
- **Vector Node:** Data is passed through a local `all-MiniLM-L6-v2` embedding model for fast, zero-latency semantic chunking and retrieval.
- **Synthesis Node:** Powered by Groq (Llama-3-70b-8192). It acts as the "brain," strictly enforcing a `temperature=0` deterministic mode to prevent hallucinations and generate the final Invest/Pass matrix.

## ⚖️ Key decisions & trade-offs

- **Groq over OpenAI:** Chose Groq (Llama-3) for the Synthesis Agent instead of OpenAI (GPT-4o). **Why:** Groq provides ultra-low latency token generation which is critical for real-time agentic reasoning pipelines, while remaining highly capable and open-source friendly.
- **LangGraph over AutoGPT/BabyAGI:** Selected LangGraph for orchestration. **Why:** Financial due diligence requires strictly deterministic workflows. LangGraph's cyclical, state-machine approach allows us to define rigid boundaries and validation loops, whereas traditional autonomous agents are too unpredictable for institutional finance.
- **Custom CSS Animations over Framer Motion:** Used pure CSS keyframes (`@keyframes flow-dash`) and SVG paths for the Agent Network live topology diagram. **Why:** To keep the bundle size extremely lightweight and maintain 60fps performance without relying on heavy third-party animation libraries.
- **Mocked UI vs Full Backend:** Currently, the UI simulates the latency and output of the LangGraph backend using timeouts and static state. **Trade-off:** Allows for rapid UI/UX iteration and architectural visualization without incurring massive API costs during the initial design phase.

## 📊 Example Runs

[To be populated with actual run details once screenshots are provided]

## 🔮 What I would improve with more time

If given more time, I would focus on extending the platform's robustness and analytical depth:
1. **Live WebSocket Integration:** Replace the mocked polling states with real-time WebSockets to stream the LangGraph execution trace directly to the UI, allowing the user to watch the agents "think" in real-time.
2. **RAG Knowledge Base:** Implement a persistent vector database (like Pinecone or Qdrant) so the Research Agent can query historical due diligence reports and cross-reference previous analyses.
3. **PDF Generation / Export:** Add a feature to compile the dynamic React report view into a branded, downloadable PDF for sharing with investment committees.
4. **Human-in-the-Loop (HITL) Interruption:** Allow the user to pause the LangGraph pipeline halfway through execution if the Research Agent flags a massive risk, enabling the user to pivot the research direction manually before burning LLM tokens on the final synthesis.

---
*Designed & Built by [Shubham Gupta](https://github.com/shubhamgupta407)*
