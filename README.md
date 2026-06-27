# Due Diligence Agent

An AI agent that takes a company name, researches it across multiple dimensions, and returns an Invest/Pass decision with reasoning grounded in the evidence it actually retrieved — not just a single LLM call guessing from its own training data.

## Overview — what it does

You give it a company name. It runs four parallel web searches (business overview, recent news, competitor landscape, risk factors), filters that raw evidence down through a RAG pipeline so only the relevant signal reaches the model, and then has an LLM produce a structured decision: Invest or Pass, with reasoning, supporting points, and risk factors — all traceable back to the evidence that was actually retrieved.

The product also includes a full platform around the agent — a dashboard with saved reports, recent activity, a live agent network view showing how the LangGraph state schema flows between agents, and a settings page for configuring the underlying models.

## How to run it

### Prerequisites
- Node.js 18.x or later
- npm or yarn
- A Groq API key ([console.groq.com](https://console.groq.com))
- A Tavily API key ([tavily.com](https://tavily.com))

### Setup

1. **Clone the repository:**
```bash
   git clone https://github.com/shubhamgupta407/due-diligence-agent.git
   cd due-diligence-agent
```

2. **Install dependencies:**
```bash
   npm install
```

3. **Set up environment variables** — create a `.env.local` file in the root:
```env
   GROQ_API_KEY=gsk_your_groq_api_key_here
   TAVILY_API_KEY=tvly_your_tavily_api_key_here
```

4. **Run the dev server:**
```bash
   npm run dev
```
   Open [http://localhost:3000](http://localhost:3000) — this is the marketing/landing page. Click through to `/platform` to use the actual tool.

## How it works — approach and architecture

The agent is orchestrated with **LangGraph.js** as a state graph with three nodes sharing a single `AgentState` object:

**1. Research Node** — Runs four parallel calls to the Tavily Search API for a given company: business overview, recent news, competitor landscape, and risk factors (lawsuits, leadership changes, financial red flags). This is the only node that touches the live web.

**2. RAG Node** — This exists because the raw output from four separate searches is too long and too noisy to hand directly to an LLM — you'd hit token limits and dilute the signal with irrelevant text. So each category's raw text is chunked using LangChain.js's `RecursiveCharacterTextSplitter` (~250 words per chunk), embedded locally using **Xenova Transformers.js** (`all-MiniLM-L6-v2` — the same model family as `sentence-transformers`, just running in JS instead of Python), and stored in an in-memory vector store. The top 3-5 most relevant chunks per category are retrieved using a query targeted at investment-relevant signals, and that's what actually reaches the LLM.

**3. Decision Node** — Takes the condensed, RAG-filtered evidence across all four categories and prompts Groq (Llama 3.3 70B) to produce a structured decision: Invest or Pass, reasoning, a list of supporting points, and a list of risk factors — all in strict JSON, with temperature set to 0.

There's also a lightweight pre-flight check before any of this runs: a fast, low-temperature Groq call checks whether the input is actually a plausible company name before it reaches Tavily. If you type random characters, it's rejected immediately with a clear error instead of producing a hallucinated result for a company that doesn't exist.

**Frontend:** Next.js (App Router) for both the UI and the API routes, TypeScript throughout, Tailwind CSS for styling. The backend streams the actual LangGraph node execution to the frontend via Server-Sent Events, so the UI shows real progress (which node is currently running) rather than a generic spinner.

## Key decisions & trade-offs

- **Xenova Transformers.js over OpenAI embeddings** — Needed local, free embeddings rather than an external API call for every chunk. `all-MiniLM-L6-v2` via Xenova runs entirely in Node, no extra API cost or latency, and is the same model family I'd used with `sentence-transformers` in a previous Python project.

- **Groq over OpenAI for synthesis** — Groq's inference speed meant the decision step added only a couple of seconds on top of the search latency, which matters a lot when the user is already waiting through four web searches plus embedding/retrieval. The trade-off is somewhat less polished reasoning than GPT-4-class models, partially offset by moving to the 70B model after the 8B model was inconsistent with strict JSON output (see below).

- **`jsonMode` over tool-calling for structured output** — Initially used Groq's native tool-calling to force structured JSON output, but it intermittently broke on certain companies (Groq's tool-calling endpoint would inject a `<function=extract>` prefix that broke JSON parsing). Switched to `jsonMode` with the schema hardcoded into the system prompt directly, which has been reliable across every company tested.

- **In-memory vector store, not a persistent vector DB** — Each research session is self-contained; there's no need to persist embeddings across users or sessions for this use case, so a persistent vector database (Pinecone, Weaviate) would be unnecessary infrastructure for what this actually needs to do.

- **A pre-flight validity check before the main pipeline** — Without this, a nonsense input would still produce a confident-sounding Invest/Pass decision based on whatever noise Tavily returned. A small, fast classification call up front (rather than trying to catch this after the fact) prevented this cleanly.

- **What I left out:** There's no persistent storage of past research sessions across browser sessions (Saved Reports / Recent Activity currently use `localStorage`, not a database) — this was a deliberate scope cut given the 7-day window, not an oversight.

## Example runs

**Qualcomm — Invest (94.2% confidence)**
The agent identified Qualcomm's IP licensing model, diversified revenue streams, and semiconductor industry positioning as supporting points, while flagging trade policy/tariff exposure and industry cyclicality as risks.

**Salesforce — Invest**
Reasoning grounded in retrieved evidence around enterprise SaaS positioning and recurring revenue strength, balanced against competitive risk factors.

**Paytm — Pass**
The risk factors retrieved (regulatory and financial red flags specific to Paytm) outweighed the supporting evidence, resulting in a Pass decision.

*(Additional run logs are available in `chat_logs.md`, which documents the actual build process including the debugging of edge cases like this.)*

## What I would improve with more time

1. **Persist reports to an actual database** instead of `localStorage`, so Saved Reports and Recent Activity survive across devices/sessions, not just the current browser.
2. **Surface source citations** — right now the RAG-retrieved chunks inform the reasoning but aren't shown to the user directly; exposing which specific search result backed which claim would make the output more auditable.
3. **Add a confidence calibration step** — the current confidence score comes directly from the LLM's own self-assessment, which isn't necessarily well-calibrated. A separate verification pass (or comparing against a held-out set of known outcomes) would make that number more trustworthy.
4. **Handle Tavily rate limits / failures more gracefully** — currently a failed search call fails the whole pipeline rather than degrading gracefully with partial information.

---

*Built by [Shubham Gupta](https://github.com/shubhamgupta407) · [LinkedIn](https://www.linkedin.com/in/shubhamgupta407)*
