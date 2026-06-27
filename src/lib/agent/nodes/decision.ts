import { AgentStateType } from "../state";
import { ChatGroq } from "@langchain/groq";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

export async function decisionNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const { companyName, ragContext } = state;
  console.log(`[Decision Node] Making investment decision for ${companyName}...`);

  // Initialize Groq. Llama 3.1 8b or 70b are great for reasoning.
  const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
    temperature: 0.2, // Keep it relatively deterministic
  }).withStructuredOutput(
    {
      type: "object",
      properties: {
        decision: {
          type: "string",
          enum: ["Invest", "Pass"],
          description: "The final decision: Invest or Pass.",
        },
        reasoning: {
          type: "string",
          description: "A detailed paragraph explaining the core reasoning for the decision.",
        },
        pros: {
          type: "array",
          items: { type: "string" },
          description: "A list of supporting points for the company (3-5 points).",
        },
        cons: {
          type: "array",
          items: { type: "string" },
          description: "A list of risk factors or negatives for the company (3-5 points).",
        },
      },
      required: ["decision", "reasoning", "pros", "cons"],
    },
    { name: "investment_decision", method: "jsonMode" }
  );

  const systemPrompt = `You are a strict, top-tier venture capitalist and due diligence agent.
Your job is to analyze the provided condensed research about a company and make a definitive "Invest" or "Pass" decision.
Base your decision ONLY on the context provided.
Be objective, weigh the pros and cons carefully, and provide a grounded reasoning.
You must return the result as a raw JSON object matching EXACTLY this schema:
{
  "decision": "Invest" | "Pass",
  "reasoning": "A detailed paragraph explaining the core reasoning",
  "pros": ["pro1", "pro2", "pro3"],
  "cons": ["con1", "con2", "con3"]
}
Do not include any other fields.`;

  const humanPrompt = `Company: ${companyName}

Condensed Research (RAG Context):
${ragContext}

Please analyze this information and provide your investment decision, reasoning, pros, and cons.`;

  // Invoke the LLM
  // We use the `invoke` method directly since we wrapped it with `withStructuredOutput`
  const result = await llm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(humanPrompt),
  ]);

  console.log(`[Decision Node] Decision for ${companyName}: ${result.decision}`);

  return {
    finalDecision: {
      ...result,
      dataSufficiency: state.dataSufficiency,
    } as any,
  };
}
