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

The agent is orchestrated with **LangGraph.js** as a state graph with three nodes sharing a single `AgentState` object, and every step in this pipeline makes a real, live call — there's no mocked data or simulated delay anywhere in it.

**1. Research Node** (`src/lib/agent/nodes/research.ts`) — Makes four simultaneous, real HTTP requests to the Tavily API (via `Promise.all`) for a given company: business overview, recent news, competitor landscape, and risk factors. This genuinely scrapes the live web every time — there's no fallback or cached text if Tavily is unavailable.

**2. RAG Node** (`src/lib/agent/nodes/rag.ts`) — This exists because the raw output from four separate searches is too long and too noisy to hand directly to an LLM — you'd hit token limits and dilute the signal with irrelevant text. Each category's raw text is chunked using LangChain.js's `RecursiveCharacterTextSplitter` (~250 words per chunk), then embedded **locally** using **Xenova Transformers.js** (`all-MiniLM-L6-v2`, the same model family as Python's `sentence-transformers`, running directly in Node). Cosine similarity is computed against the retrieval query to pull the top relevant chunks per category — all of this runs at request time, nothing is pre-computed.

**3. Decision Node** (`src/lib/agent/nodes/decision.ts`) — Takes the condensed, RAG-filtered evidence across all four categories and makes a live call to Groq (`llama-3.3-70b-versatile`), using LangChain's `withStructuredOutput` to force a strict JSON response: decision (Invest/Pass), reasoning, supporting points, and risk factors — all grounded only in the retrieved context, not the model's general knowledge.

There's also a lightweight pre-flight check before any of this runs: a fast, low-temperature Groq call checks whether the input is actually a plausible company name before it reaches Tavily. Type random characters, and it's rejected immediately with a clear error instead of letting noisy search results produce a hallucinated decision for a company that doesn't exist.

**Streaming:** The API route (`src/app/api/research/route.ts`) doesn't block until the whole graph finishes — it awaits `agentApp.stream()` and pushes each node's completion to the frontend over Server-Sent Events as it actually happens. The loading state on the frontend reflects real network I/O time waiting on Tavily and Groq, not a simulated delay.

**Frontend:** Next.js (App Router) for both the UI and the API routes, TypeScript throughout, Tailwind CSS for styling.

## Key decisions & trade-offs

- **Xenova Transformers.js over OpenAI embeddings** — Needed local, free embeddings rather than an external API call for every chunk. `all-MiniLM-L6-v2` via Xenova runs entirely in Node, no extra API cost or added network latency, and is the same model family I'd used with `sentence-transformers` in a previous Python project.

- **Groq over OpenAI for synthesis** — Groq's inference speed meant the decision step added only a couple of seconds on top of the search and embedding latency, which matters when the user is already waiting through four web searches. The trade-off is somewhat less polished reasoning compared to GPT-4-class models, partially offset by moving from the 8B to the 70B model after the smaller model was inconsistent with strict JSON output (see below).

- **`jsonMode` over native tool-calling for structured output** — Initially used Groq's tool-calling to force structured JSON, but it intermittently broke on certain companies — Groq's tool-calling endpoint would inject a `<function=extract>` prefix that broke JSON parsing downstream. Switched to `jsonMode` with the schema hardcoded directly into the system prompt, which has been reliable across every company tested since.

- **In-memory vector store, not a persistent vector DB** — Each research session is self-contained; there's no need to persist embeddings across users or sessions for this use case, so a persistent vector database (Pinecone, Weaviate) would be unnecessary infrastructure overhead here.

- **A pre-flight validity check before the main pipeline runs** — Without this, a nonsense input would still produce a confident-sounding Invest/Pass decision based on whatever noise Tavily happened to return for it. Catching this with a small, fast classification call up front was simpler and more reliable than trying to detect a bad result after the fact.

- **What I left out:** There's no persistent database for past research sessions — Saved Reports and Recent Activity currently use the browser's `localStorage`, so history doesn't carry across devices or browser sessions. This was a deliberate scope cut for the time available, not an oversight; the report *content* saved there is the real, unmodified output the live pipeline generated.

## Example runs

**Qualcomm — Invest (94.2% confidence)**
Identified Qualcomm's IP licensing model, diversified revenue streams, and semiconductor industry positioning as supporting points, while flagging trade policy/tariff exposure and industry cyclicality as risks.

**Salesforce — Invest**
Reasoning grounded in retrieved evidence around enterprise SaaS positioning and recurring revenue strength, balanced against competitive risk factors retrieved from recent news.

**Paytm — Pass**
The risk factors retrieved (regulatory and financial red flags specific to Paytm) outweighed the supporting evidence retrieved, resulting in a Pass decision.

*(The full build process — including catching and fixing the JSON parsing issue mentioned above — is documented in `chat_logs.md`.)*

## What I would improve with more time

1. **Move Saved Reports / Recent Activity to a real database** instead of `localStorage`, so history persists across devices and browser sessions rather than just the current browser.
2. **Surface source citations** — the RAG-retrieved chunks currently inform the reasoning but aren't shown to the user directly; exposing which specific search result backed which claim would make the output more auditable.
3. **Add a confidence calibration step** — the current confidence score is the LLM's own self-assessment, which isn't necessarily well-calibrated. A separate verification pass, or comparison against a held-out set of known outcomes, would make that number more trustworthy.
4. **Handle Tavily failures more gracefully** — right now a failed search call fails the whole pipeline; partial results (e.g., 3 out of 4 categories) should still be usable rather than failing outright.

---

*Built by [Shubham Gupta](https://github.com/shubhamgupta407) · [LinkedIn](https://www.linkedin.com/in/shubhamgupta407)*
