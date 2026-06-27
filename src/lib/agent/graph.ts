import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState } from "./state";
import { researchNode } from "./nodes/research";
import { ragNode } from "./nodes/rag";
import { decisionNode } from "./nodes/decision";

// Define the StateGraph with our shared AgentState
const workflow = new StateGraph(AgentState)
  // Add our nodes
  .addNode("research", researchNode)
  .addNode("rag", ragNode)
  .addNode("decision", decisionNode)
  
  // Define the edges (the flow)
  .addEdge(START, "research")
  .addEdge("research", "rag")
  .addEdge("rag", "decision")
  .addEdge("decision", END);

// Compile the graph into an executable app
export const agentApp = workflow.compile();
