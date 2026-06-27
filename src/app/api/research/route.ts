import { NextResponse } from "next/server";
import { agentApp } from "@/lib/agent/graph";

export async function POST(req: Request) {
  try {
    const { companyName } = await req.json();

    if (!companyName) {
      return NextResponse.json({ error: "Company name is required." }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          //Initial trace triggeringg
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "trace", message: "Initializing agent workflow..." })}\n\n`));
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "trace", message: "Validating company entity..." })}\n\n`));

          // Fast LLM validation to catch keyboard smashes/bluff inputs
          const { ChatGroq } = await import("@langchain/groq");
          const { HumanMessage } = await import("@langchain/core/messages");
          const llm = new ChatGroq({
            apiKey: process.env.GROQ_API_KEY,
            model: "llama-3.1-8b-instant",
            temperature: 0,
          }).withStructuredOutput({
            type: "object",
            properties: {
              isValid: { type: "boolean", description: "True if this is a plausible company name, brand, ticker, or financial query. False if it is random keyboard smash or nonsense." }
            },
            required: ["isValid"]
          }, { name: "validate" });

          const validationRes = await llm.invoke([
            new HumanMessage(`Is "${companyName}" a valid, recognizable, or plausible company name/ticker? Return false if it is just random keyboard smash (e.g., 'kvkgvc').`)
          ]);

          if (!validationRes.isValid) {
            throw new Error(`Invalid company name: "${companyName}". Please enter a real company or ticker.`);
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "trace", message: "Executing deep market web search for business model, news, competitors, and risks..." })}\n\n`));

          const streamEvents = await agentApp.stream({ companyName });

          for await (const chunk of streamEvents) {
            const nodeName = Object.keys(chunk)[0];

            if (nodeName === "research") {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "trace", message: "Market search complete. Raw data aggregated." })}\n\n`));
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "trace", message: "Vectorizing data into internal semantic store..." })}\n\n`));
            } else if (nodeName === "rag") {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "trace", message: "Semantic search complete. Top signals extracted." })}\n\n`));
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "trace", message: "Synthesizing institutional memo via proprietary NLP model..." })}\n\n`));
            } else if (nodeName === "decision") {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "trace", message: "Memo generated successfully." })}\n\n`));

              //Send the final result
              const finalState = chunk[nodeName];
              if (finalState && finalState.finalDecision) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "result", data: finalState.finalDecision })}\n\n`));
              }
            }
          }
        } catch (error: any) {
          console.error("[API] Stream error:", error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
