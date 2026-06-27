import { AgentStateType } from "../state";
import { tavily } from "@tavily/core";

// Initialize Tavily client. This will throw if the API key isn't in the environment.
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

/**
 * The Research Node runs 4 parallel Tavily searches for the company
 * to gather a broad base of information for the RAG pipeline.
 */
export async function researchNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const { companyName } = state;
  console.log(`[Research Node] Starting research for ${companyName}...`);

  // We define 4 specific queries to ensure we cover the necessary angles.
  // Running these in parallel to save time.
  const [overviewRes, newsRes, competitorsRes, risksRes] = await Promise.all([
    tvly.search(`${companyName} company overview and business model`, {
      searchDepth: "advanced",
      maxResults: 5,
    }),
    tvly.search(`${companyName} recent news last 6-12 months`, {
      searchDepth: "basic", // Basic is usually fine for news
      topic: "news",
      maxResults: 5,
    }),
    tvly.search(`${companyName} competitor landscape and market position`, {
      searchDepth: "advanced",
      maxResults: 5,
    }),
    tvly.search(`${companyName} risk factors, lawsuits, leadership changes, financial red flags`, {
      searchDepth: "advanced",
      maxResults: 5,
    }),
  ]);

  // Combine the content from the results into strings.
  // Using a quick mapper to pull the content out of the result objects.
  const mapResults = (res: any) =>
    res.results.map((r: any) => `Source: ${r.url}\nContent: ${r.content}`).join("\n\n");

  const rawSearchResults = {
    overview: mapResults(overviewRes),
    news: mapResults(newsRes),
    competitors: mapResults(competitorsRes),
    risks: mapResults(risksRes),
  };

  console.log(`[Research Node] Completed research for ${companyName}.`);

  return {
    rawSearchResults,
  };
}
