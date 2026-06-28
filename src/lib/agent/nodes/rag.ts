import { AgentStateType } from "../state";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { Embeddings } from "@langchain/core/embeddings";
import { env, pipeline } from "@xenova/transformers";

// Configure transformers for Node.js / Next.js environment
// Prevent it from spawning web workers (which causes the blob:nodedata error)
env.backends.onnx.wasm.numThreads = 1;
// Disable local models to strictly use the remote HuggingFace Hub
env.allowLocalModels = false;

// Custom MemoryVectorStore to resolve module resolution issues
class MemoryVectorStore {
  memoryVectors: { content: string; metadata: any; embedding: number[] }[] = [];
  embeddings: Embeddings;

  constructor(embeddings: Embeddings) {
    this.embeddings = embeddings;
  }

  static async fromDocuments(docs: Document[], embeddings: Embeddings) {
    const store = new MemoryVectorStore(embeddings);
    await store.addDocuments(docs);
    return store;
  }

  async addDocuments(docs: Document[]) {
    const texts = docs.map((d) => d.pageContent);
    const vectors = await this.embeddings.embedDocuments(texts);
    for (let i = 0; i < docs.length; i++) {
      this.memoryVectors.push({
        content: docs[i].pageContent,
        metadata: docs[i].metadata,
        embedding: vectors[i],
      });
    }
  }

  async similaritySearch(query: string, k: number = 4) {
    const queryVector = await this.embeddings.embedQuery(query);
    
    // Simple cosine similarity
    const dotProduct = (a: number[], b: number[]) => a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitude = (v: number[]) => Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
    
    const results = this.memoryVectors.map((doc) => {
      const dp = dotProduct(queryVector, doc.embedding);
      const magA = magnitude(queryVector);
      const magB = magnitude(doc.embedding);
      const score = (magA && magB) ? dp / (magA * magB) : 0;
      return { ...doc, score };
    });

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, k).map(r => {
      const doc = new Document({ pageContent: r.content, metadata: r.metadata });
      (doc as any).score = r.score;
      return doc;
    });
  }
}


// Custom wrapper for Xenova/Transformers.js embeddings
// This ensures we're running embeddings locally as requested.
class XenovaEmbeddings extends Embeddings {
  modelName = "Xenova/all-MiniLM-L6-v2";
  private extractor: any;

  constructor() {
    super({});
  }

  async init() {
    if (!this.extractor) {
      // Lazy load the pipeline
      this.extractor = await pipeline("feature-extraction", this.modelName);
    }
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    await this.init();
    // This could be batched, but Promise.all is fine for a quick implementation
    return Promise.all(documents.map((d) => this.embedQuery(d)));
  }

  async embedQuery(document: string): Promise<number[]> {
    await this.init();
    const output = await this.extractor(document, { pooling: "mean", normalize: true });
    return Array.from(output.data);
  }
}

export async function ragNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const { companyName, rawSearchResults } = state;
  console.log(`[RAG Node] Processing text for ${companyName}...`);

  // We want to chunk the text to ~400-500 words to reduce total chunk count and speed up local embeddings.
  // Using characters, ~2000 chars is ~400-500 words.
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 2000,
    chunkOverlap: 400, // Some overlap to retain context across chunks
  });

  const allChunks: { pageContent: string; metadata: any }[] = [];

  // Split each category and label it with metadata
  for (const [category, text] of Object.entries(rawSearchResults)) {
    if (!text || text.trim() === "") continue;
    const chunks = await textSplitter.createDocuments([text], [{ category }]);
    allChunks.push(...chunks);
  }

  if (allChunks.length === 0) {
    console.log(`[RAG Node] No search results to process for ${companyName}.`);
    return { ragContext: "No information found." };
  }

  console.log(`[RAG Node] Created ${allChunks.length} chunks. Generating embeddings...`);

  // Initialize our local embeddings and in-memory store
  const embeddings = new XenovaEmbeddings();
  const vectorStore = await MemoryVectorStore.fromDocuments(allChunks, embeddings);

  // Retrieve the top 3-5 chunks per category
  // Instead of querying by category, we can just query the whole store for investment signals
  // and take the top 15 chunks overall (roughly 3-4 per category equivalent)
  const query = "key signals relevant to an investment decision, risks, competitors, and overview";
  const results = await vectorStore.similaritySearch(query, 12);

  console.log(`[RAG Node] Retrieved top ${results.length} relevant chunks.`);

  // Debugging: Log the actual chunk counts and similarity scores per category
  const categoryStats: Record<string, { count: number, scores: number[] }> = {
    overview: { count: 0, scores: [] },
    news: { count: 0, scores: [] },
    competitors: { count: 0, scores: [] },
    risks: { count: 0, scores: [] }
  };

  results.forEach(r => {
    const cat = r.metadata.category;
    const score = (r as any).score || 0;
    if (categoryStats[cat]) {
      categoryStats[cat].count++;
      categoryStats[cat].scores.push(score);
    }
  });

  console.log(`[RAG Node] Data Sufficiency Debugging Stats for ${companyName}:`);
  for (const [cat, stats] of Object.entries(categoryStats)) {
    console.log(`  - ${cat}: ${stats.count} chunks, scores: [${stats.scores.map(s => s.toFixed(3)).join(", ")}]`);
  }

  // Condense the chunks into a single context string for the LLM
  const ragContext = results
    .map((r, i) => `--- Chunk ${i + 1} (${r.metadata.category}) ---\n${r.pageContent}`)
    .join("\n\n");

  // Calculate Data Sufficiency
  // We check which categories had chunks that made it into the top results
  // We use a relatively low threshold (0.1) because cosine similarity for dense embeddings 
  // across diverse text can often sit in the 0.2-0.5 range.
  const allCategories = ["overview", "news", "competitors", "risks"];
  const strongCategories = new Set(
    results.filter(r => (r as any).score > 0.1).map(r => r.metadata.category)
  );
  
  const weakCategories = allCategories.filter(c => !strongCategories.has(c));
  const isLowConfidence = weakCategories.length >= 2;

  // Calculate dynamic confidence score using a weighted multi-factor approach
  // 1. Completeness (50% weight): Categories with at least one strong chunk
  const completenessScore = (strongCategories.size / 4) * 50;
  
  // 2. Volume (15% weight): Total chunks retrieved (up to 10 is considered perfect volume)
  const volumeScore = Math.min(1, results.length / 10) * 15;
  
  // 3. Similarity (35% weight): Average similarity normalized (0.2 -> 0%, 0.6 -> 100%)
  const avgSimilarity = results.reduce((sum, r) => sum + ((r as any).score || 0), 0) / (results.length || 1);
  const normalizedSim = Math.max(0, Math.min(1, (avgSimilarity - 0.15) / 0.45));
  const similarityScore = normalizedSim * 35;
  
  let confidence = completenessScore + volumeScore + similarityScore;
  
  // Heavy penalty if flagged as low confidence to ensure UI signals agree
  if (isLowConfidence) {
    confidence = confidence * 0.7; 
  }

  let confidenceScore = parseFloat(Math.min(99.4, confidence).toFixed(1));

  if (isLowConfidence) {
    console.log(`[RAG Node] LOW CONFIDENCE WARNING. Weak categories: ${weakCategories.join(", ")}. Score: ${confidenceScore}%`);
  } else {
    console.log(`[RAG Node] Confidence Score: ${confidenceScore}%`);
  }

  return {
    ragContext,
    dataSufficiency: {
      isLowConfidence,
      weakCategories,
      confidenceScore,
    }
  };
}
