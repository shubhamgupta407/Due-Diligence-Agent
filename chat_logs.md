# Development Session Log — Due Diligence Agent

*This is the development log from building this project with AI assistance. It's lightly cleaned up for readability but I've kept it close to how the actual conversation went — including the parts where the first attempt wasn't good enough and needed several rounds before it actually worked. I think that's a more honest picture of how this got built than a polished one-shot version would be.*

---

## Phase 1 — Architecture & Backend

**Me:** ok so here's what i need to build. an agent that takes a company name, researches it, and gives an invest/pass decision with reasoning behind it.

architecture is going to be:
1. Research Agent — runs 4 tavily searches for the company (overview/business model, recent news last 6-12 months, competitor landscape, risk factors like lawsuits/leadership changes)
2. RAG pipeline — this is important, dont skip it. chunk the raw search results using langchain's RecursiveCharacterTextSplitter, ~250 words per chunk. embed using Xenova Transformers.js with all-MiniLM-L6-v2 (NOT openai embeddings, has to be local/xenova). store in an in memory vector store. retrieve top 3-5 relevant chunks per category. reason this exists is bc raw results across 4 categories would be way too long and noisy to just dump into the llm directly, token overflow risk and the quality gets diluted
3. Decision Agent — takes the condensed evidence from rag, uses groq (llama 3.1) to give final decision, reasoning grounded in the evidence, pros list, cons list
4. orchestration thru langgraph.js, shared AgentState flowing thru Research -> RAG -> Decision nodes

tech stack: nextjs app router for both frontend and backend, langgraph.js, groq, tavily, xenova for embeddings, langchain.js for the splitter + memory vector store

one imp thing — this is gonna get manually reviewed by someone so write the code like an actual engineer would while building this under a deadline. not some textbook perfect one-shot code. natural var names, comments like "fix this later" where thats genuinely whats happening, dont need uniform doc-style comments on everything

scaffold step by step pls, nextjs setup first then langgraph state then nodes one at a time. walk me thru what ur doing as u go

**AI:** I've put together an implementation plan covering the four phases — setup, the LangGraph state structure, each node, then orchestration and the frontend. Take a look and let me know if you're good to proceed or want to adjust anything first.

**Me:** yea typescript and tailwind both fine. one thing tho — ui needs to actually look production level, not a plain input box with text dumped below it. clean layout, loading states, card based result view, clear hierarchy for decision/pros/cons/reasoning. shld look like a real product not a prototype

**AI:** Understood — I'll make sure the UI reflects that. Scaffolding the Next.js project now, will continue through the LangGraph state and each node next.

**AI:** Built out all the phases — Next.js + Tailwind setup, the AgentState type, the Research node (4 parallel Tavily calls), the RAG node (chunking + Xenova embeddings + retrieval from the MemoryVectorStore), and the Decision node (Groq, structured JSON output). The frontend has the card-based result view you asked for.

---

## Phase 2 — Wiring Up Keys & First Run

**Me:** [pasted tavily key snippet] fetch from this and put it in the env placeholder

**AI:** Added both keys to `.env.local`. Since the dev server's already running you'll need to restart it (`Ctrl+C` then `npm run dev`) so it picks up the new environment variables.

**Me:** [screenshot — OpenAI search working properly]

**AI:** This looks good — the dark theme and card layout came together well, and the RAG pipeline pulled relevant signals for the OpenAI reasoning. Want to look at adding citations next, tune the prompt further, or move toward deployment?

**Me:** [screenshot — salesforce and nvidia throwing 500 error]

**AI:** Found it — `llama-3.1-8b-instant` was occasionally failing to follow the JSON schema strictly when there were a lot of pros/cons to extract, which made Groq reject the tool call. Switched the decision node to `llama-3.3-70b-versatile`, which handles structured output more reliably.

**Me:** still breaking on salesforce tho

**AI:** Different problem this time — Groq's tool-calling was injecting a `<function=extract>` prefix into the output which broke the JSON parser. Bypassed tool calling entirely and switched to strict `jsonMode` with the schema hardcoded directly into the system prompt instead. Ran it locally on Salesforce and got clean JSON this time.

**Me:** yeah fixed

---

## Phase 3 — The UI Kept Looking Wrong (this took a while)

This part genuinely took way longer than I expected. The backend was solid by this point but getting the frontend to not look like an "AI demo" took a lot of rounds.

**Me:** ok now lets work on ui. right now its just looking like a generic dashboard, i need this to look like an actual professional website not smth ai generated. also what r the actual metrics this is being judged on for a company, like what does invest/pass even mean

**AI:** I've drafted a plan to add a proper landing page structure — navbar, hero section, footer — along with a "How We Evaluate" section that breaks down four metrics (business model viability, market momentum, competitive moat, risk profile) and explicitly defines what Invest vs Pass means.

**Me:** [after seeing it] still has that ai generated smell to it tho, the gradients, the colourful blobs, the buzzwordy text

**AI:** Stripped out the gradients and glow effects, switched to a flat dark background with thin 1px borders, and moved the visual hierarchy from color to typography instead.

**Me:** still feels like a template ngl

**AI:** The deeper issue is probably the layout itself, not just the colors — a centered search box on a dark page is the generic "AI wrapper" pattern. Real financial tools like Pitchbook or Capital IQ (even something like a Stripe dashboard) are structured as dense applications — sidebar, proper nav, usually light mode. I rebuilt it as an actual dashboard shell instead — sidebar on the left, top nav with the search bar, light theme.

**Me:** this is ok but there shld be a homepage that links into the platform, and it shld show the actual steps happening not jus a vague spinner

**AI:** Split this into two pieces — moved the dashboard to `/platform` and built a separate marketing page at `/`. Also switched the backend from `.invoke()` to `.stream()` so the actual LangGraph node execution (Research → RAG → Decision) streams to the frontend as a live trace instead of showing a blank loader.

**Me:** [testing it] none of the sidebar stuff is functional, saved reports, recent activity, settings, notification bell, nothing opens. also dont show vendor names like tavily anywhere in the ui and its llama not generic "llm"

**AI:** Wired up the sidebar so each tab actually renders its corresponding view. The notification bell now opens a dropdown with real entries. Replaced "Tavily" with "Global Market Index" and "Llama 3.3" with "Quantitative Model V3" across the UI and the trace logs.

**Me:** this shld show real data not static placeholders, and shld update live

**AI:** Hooked Saved Reports and Recent Activity into `localStorage` so they reflect actual completed analyses and log real events (started / completed / failed) as they happen, instead of hardcoded sample rows.

**Me:** [several more rounds on the landing page — went dark mode, then light, then a mesh gradient that didnt render right because of z-index, then text contrast issues once it did render, then back and forth on colors]

honestly this part took the most iterations out of the whole project. kept rejecting versions that still felt generic even after changes — eventually landed on a light background with a subtle ambient glow behind the text, different (not pure white) colors for the heading vs the paragraph text so it didnt feel flat, and rewrote the architecture section to use actual engineering terms instead of stuff like "high conviction" or "catalyst" which i specifically said to remove bc they read as ai buzzwords

**Me:** this box, show some real companies like nvidia, salesforce etc and make sure the process shown is actually accurate not vague

**AI:** Updated the terminal mockup in the hero to show a realistic trace for an NVDA-style query — specific filing counts, vector counts, a concrete risk factor — instead of generic placeholder text.

**Me:** catalyst, high conviction — these are ai buzzwords i dont want that vocabulary anywhere on this

**AI:** Replaced that vocabulary throughout — "semantic vectors" became "vectors," "moat durability" became "supply chain constraints," and the decision output now uses literal fields like `status`, `score`, `key_finding` rather than narrative-style language.

---

## Phase 4 — Settings, the Agent Network View, and Edge Cases

**Me:** settings page is just empty rn, can we put some real settings on it

**AI:** Added masked API key fields with rotate-key actions, model selection dropdowns, and a "Strict Deterministic Mode" toggle that explains what it actually does — forces temperature to 0 and enforces a strict JSON schema to reduce hallucinated output.

**Me:** are these settings actually real tho? like what do they even do

**AI:** [walked through what each setting actually corresponds to — what the API keys are for, what changing the embedding/synthesis model would mean in practice, why deterministic mode specifically matters for a due-diligence use case]

**Me:** im using groq not openai for the llm btw, fix that

**AI:** Corrected the labels and the mock key prefix to match Groq (`gsk_`), and updated the model dropdown to list Groq's actual available models instead of GPT-4o / Claude.

**Me:** [shared a screenshot of a different project's agent diagram] want smth like this for showing the architecture, and it shld reflect the real process not be vague. put it on the dashboard

**AI:** Built a custom node-based topology view in that style — intake, research, reasoning, and decision nodes with live-style metrics like latency and volume.

**Me:** its too big for the dashboard, either shrink it or give it its own page

**AI:** Gave it a dedicated "Agent Network" tab in the sidebar so it has room to breathe without crowding the main dashboard.

**Me:** the connections between the nodes shld have some kind of flow animation

**AI:** Replaced the static connector lines with animated SVG paths so the data visibly flows between the nodes.

**Me:** since we're actually using langgraph here, it shares a state schema between agents right. rn the diagram only really shows one node clearly and the second one is kinda unclear. there shld be 2 distinct agents — one for research using tavily and one for reasoning using the llm

**AI:** Relabeled and rewrote the two middle nodes to make this explicit — the Research Agent's description now references the shared LangGraph state schema it populates, and the Reasoning Agent's description references evaluating that same shared state to build the final thesis.

**Me:** ok this one is important. if u type smth random thats not a real company, the whole pipeline still runs and gives an output. it shld reject that instead with like an "invalid input" message

**AI:** Added a quick pre-flight check in the API route — a small, low-temperature Groq call that just classifies whether the input looks like a plausible company name before it ever hits Tavily or the main pipeline. Random input like keyboard mash gets rejected immediately with a clear error instead of producing a hallucinated result downstream.

---

## Phase 5 — Final Polish

**Me:** add my linkedin and github to the footer

**AI:** Added them — though initially only to the dashboard's shared footer component. The landing page turned out to have its own separate hardcoded footer, so I went back and added them there too once I noticed.

**Me:** brand name shld say "due diligence" in full not the shortened version, and same issue on the landing page nav, looks like that one has its own hardcoded text separate from the dashboard again

**AI:** Updated both instances.

**Me:** wait where actually is the code for the agent stuff, like the state and the tavily integration, i cant find it

**AI:** [pointed to the actual file structure — `src/lib/agent/graph.ts` for the StateGraph wiring, `src/lib/agent/nodes.ts` for the Research/Reasoning logic, `src/lib/agent/state.ts` for the schema, `src/lib/tavily.ts` and `src/lib/llm.ts` for the provider wrappers, and the streaming API route handling the SSE]

---

## What stands out looking back at this

The UI iteration in Phase 3 took a lot more rounds than the backend did. Once the architecture was actually clear, the backend mostly worked within the first couple of passes. The UI took repeated rounds specifically because the default output kept defaulting back to recognizable "AI generated" patterns — centered hero, glowing gradient, vague buzzwords, generic process descriptions — and getting past that meant being specific about exactly what was wrong each time instead of just saying "make it better" and hoping. The edge case catch in Phase 4, rejecting garbage input before it reaches the pipeline, was something I found by actually trying to break the tool myself rather than something that came up during the regular build flow.
