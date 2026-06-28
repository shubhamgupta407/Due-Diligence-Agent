# Development Session Log — Due Diligence Agent

*This is the development log from building this project with AI assistance. It's lightly cleaned up for readability but I've kept it close to how the actual conversation went, including the parts where the first attempt wasn't good enough and needed a few rounds before it actually worked.*

---

## Phase 1 — Architecture & Backend

**Me:** ok heres what i need to build. an agent that takes a company name, researches it, and gives an invest/pass decision with reasoning behind it.

architecture:
1. Research Agent — 4 tavily searches (overview/business model, recent news last 6-12 months, competitor landscape, risk factors like lawsuits/leadership changes)
2. RAG pipeline — important, dont skip this. chunk the raw results with langchain's RecursiveCharacterTextSplitter, embed using Xenova Transformers.js with all-MiniLM-L6-v2, NOT openai embeddings, has to be local. store in memory vector store, retrieve top relevant chunks per category. reason this exists is bc dumping raw results from 4 categories straight into the llm would blow past token limits and dilute the signal with noise
3. Decision Agent — takes the condensed evidence, uses groq (llama) to give decision + reasoning + pros/cons grounded in the evidence
4. orchestration thru langgraph.js, shared AgentState flowing thru Research -> RAG -> Decision

stack: nextjs app router both ends, langgraph.js, groq, tavily, xenova, langchain for splitter + vector store

imp thing — this is getting manually reviewed so write it like an actual engineer under a deadline would, not textbook one-shot code. natural var names, comments like "fix this later" where thats genuinely the case

scaffold step by step, nextjs setup first then state then nodes one at a time

**AI:** I've put together an implementation plan covering the four phases — setup, the LangGraph state structure, each node, then orchestration and the frontend. Take a look and let me know if you're good to proceed.

**Me:** yea typescript and tailwind both fine. ui needs to actually look production level tho, not a bare input box with text dumped below. card based result view, clear hierarchy for decision/pros/cons/reasoning

**AI:** Understood — scaffolding the Next.js project now, will work through the LangGraph state and each node next.

**AI:** Built out all the phases — Next.js + Tailwind setup, the AgentState type, the Research node (4 parallel Tavily calls), the RAG node (chunking + Xenova embeddings + retrieval from the MemoryVectorStore), and the Decision node (Groq, structured JSON output). The frontend has the card-based result view you asked for.

---

## Phase 2 — Wiring Up Keys & First Run

**Me:** [pasted tavily key snippet] fetch from this, put it in the env placeholder

**AI:** Added both keys to `.env.local`. Restart the dev server so it picks up the new environment variables.

**Me:** [screenshot — salesforce and nvidia throwing 500]

**AI:** Found it — `llama-3.1-8b-instant` was occasionally failing to follow the JSON schema strictly when there were a lot of pros/cons to extract, which made Groq reject the tool call. Switched to `llama-3.3-70b-versatile`, handles structured output more reliably.

**Me:** still breaking on salesforce tho

**AI:** Different issue this time — Groq's tool-calling was injecting a `<function=extract>` prefix into the output, breaking the JSON parser. Bypassed tool calling entirely, switched to strict `jsonMode` with the schema hardcoded into the system prompt. Clean JSON on Salesforce now.

**Me:** yeah fixed

---

## Phase 3 — Getting the UI Right

**Me:** ui right now is just looking like a generic dashboard, need it to look like an actual professional product not smth ai generated. also what r the actual metrics this is being judged on for a company

**AI:** Drafted a plan for a proper landing page structure with a "How We Evaluate" section breaking down four real metrics, and explicit definitions of what Invest vs Pass actually means.

**Me:** still feels like a template ngl, the gradients and buzzwordy text

**AI:** Stripped the gradients, moved to flat dark background with thin borders, shifted hierarchy from color to typography. Also rebuilt the layout itself — a centered search box on a dark page is the generic "AI wrapper" pattern. Real tools like Pitchbook or a Stripe dashboard are dense applications — sidebar, proper nav. Rebuilt it as an actual dashboard shell instead.

**Me:** this is ok but there shld be a homepage that links into the platform, and it shld show the actual steps happening, not a vague spinner

**AI:** Split into two — moved the dashboard to `/platform`, built a separate marketing page at `/`. Also switched the backend from `.invoke()` to `.stream()` so the actual LangGraph node execution streams to the frontend as a live trace.

**Me:** none of the sidebar stuff is functional, also dont show vendor names like tavily in the ui, its llama not generic "llm"

**AI:** Wired up the sidebar so each tab renders its corresponding view. Replaced "Tavily" with "Global Market Index" and "Llama 3.3" with "Quantitative Model V3" across the UI and trace logs.

**Me:** this shld show real data not static placeholders, shld update live

**AI:** Hooked Saved Reports and Recent Activity into `localStorage` so they reflect actual completed analyses and log real events as they happen.

**Me:** catalyst, high conviction — these are ai buzzwords, dont want that vocabulary anywhere

**AI:** Replaced that vocabulary throughout — "semantic vectors" became "vectors," "moat durability" became "supply chain constraints," decision output uses literal fields like `status`, `score`, `key_finding` instead of narrative language.

---

## Phase 4 — Settings, Agent Network, and the Edge Case That Mattered Most

**Me:** settings page is empty rn, put some real settings on it

**AI:** Added masked API key fields, model selection dropdowns, and a "Strict Deterministic Mode" toggle — forces temperature to 0 and enforces a strict JSON schema to reduce hallucinated output.

**Me:** im using groq not openai btw, fix that

**AI:** Corrected the labels and mock key prefix to match Groq, updated the model dropdown to Groq's actual available models.

**Me:** [shared a reference screenshot] want smth like this for the architecture, on the dashboard, and it shld reflect the real process not be vague

**AI:** Built a custom node-based topology view — intake, research, reasoning, decision nodes with live-style metrics.

**Me:** since we're actually using langgraph here it shares a state schema between agents right. there shld be 2 distinct agents — one for research using tavily, one for reasoning using the llm. rn that's not clear in the diagram

**AI:** Relabeled the two middle nodes to make this explicit — the Research Agent's description now references the shared LangGraph state schema it populates, the Reasoning Agent's description references evaluating that same state to build the final thesis.

**Me:** ok this one is important. if u type smth random thats not a real company, the pipeline still runs and gives an output. it shld reject that with an invalid input message instead

**AI:** Added a pre-flight check in the API route — a fast, low-temperature Groq call that classifies whether the input looks like a plausible company name before it reaches Tavily. Random input gets rejected immediately instead of producing a hallucinated result downstream.

---

## Phase 5 — Performance Issues After Deployment

**Me:** [tested several companies, noticed every single one returned the exact same 94.2% confidence score]

this confidence score is hardcoded, every company is showing 94.2% regardless of actual data quality. need this to be a real calculated metric — based on how many categories actually returned data, the similarity scores, and total chunk volume

**AI:** Replaced the static value with a weighted algorithm in the RAG node — data completeness (50%), average similarity (35%), retrieval volume (15%). If the low-confidence flag triggers (2+ categories returning nothing), applies a penalty multiplier so the numeric score and the warning banner can't disagree with each other.

**Me:** [tested Intellipaat — reasoning explicitly said the data was insufficient, but confidence still showed 80%, and the low-confidence banner didn't trigger]

found a gap — the penalty only fires when a category returns *zero* chunks. Intellipaat's case was thin data spread across categories, not categories returning literally nothing, so it slipped through the threshold

**AI:** That's a real distinction worth fixing properly rather than patching around — logged it as a known limitation for now given time constraints, with the exact threshold logic that needs to change documented for the next pass.

**Me:** getting `libonnxruntime.so.1.14.0: cannot open shared object file` on the Vercel deployment, works fine locally

**AI:** Root cause: Xenova Transformers.js depends on native ONNX runtime binaries, and Vercel's serverless bundling strips these out during build, even though they work locally. Moved deployment to Render, which runs a persistent server and doesn't have this serverless-specific bundling constraint — same architecture works without modification.

**Me:** RAG node is generating 55-67 chunks per company at 250 words/chunk, and on Render's free tier that's the clear bottleneck — embeddings are taking 1-2 minutes. can we increase chunk size to cut that roughly in half

**AI:** Increased chunk size to ~2000 characters with 400-character overlap, cutting chunk count by roughly 60% for the same company. Re-tested to confirm retrieval quality and decision reasoning held up at the larger chunk size before committing to it.

---

## What stands out looking back at this

The UI took noticeably more iteration than the backend — once the architecture was clear, the agent logic mostly worked within the first couple of passes, while the frontend kept defaulting back to recognizable "AI generated" patterns until I got specific about exactly what was wrong each time. The more interesting problems ended up being the ones that only showed up after real testing rather than during the build itself — the confidence score being hardcoded, the Vercel binary issue, and the gap in the low-confidence threshold logic were all things I caught by deliberately trying to break the tool, not things that came up naturally while building it.
