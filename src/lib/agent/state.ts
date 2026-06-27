import { Annotation } from "@langchain/langgraph";

// We use LangGraph's Annotation to define the shape of our state.
// This state will be passed along through our nodes: Research -> RAG -> Decision
export const AgentState = Annotation.Root({
  companyName: Annotation<string>(),

  // The raw search results from Tavily, categorized.
  rawSearchResults: Annotation<{
    overview: string;
    news: string;
    competitors: string;
    risks: string;
  }>({
    reducer: (curr, next) => ({ ...curr, ...next }),
    default: () => ({ overview: "", news: "", competitors: "", risks: "" }),
  }),

  // The condensed chunks retrieved from the RAG pipeline.
  ragContext: Annotation<string>(),

  // Data sufficiency signal calculated during RAG
  dataSufficiency: Annotation<{
    isLowConfidence: boolean;
    weakCategories: string[];
  }>({
    reducer: (curr, next) => ({ ...curr, ...next }),
    default: () => ({ isLowConfidence: false, weakCategories: [] }),
  }),

  // The final structured decision from the LLM.
  finalDecision: Annotation<{
    decision: "Invest" | "Pass" | null;
    reasoning: string;
    pros: string[];
    cons: string[];
    dataSufficiency?: {
      isLowConfidence: boolean;
      weakCategories: string[];
    };
  }>({
    reducer: (curr, next) => ({ ...curr, ...next }),
    default: () => ({ decision: null, reasoning: "", pros: [], cons: [] }),
  }),
});

export type AgentStateType = typeof AgentState.State;
