import { AgentStateType } from "../state";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { Embeddings } from "@langchain/core/embeddings";
import { pipeline } from "@xenova/transformers";

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
    
    return results.slice(0, k).map(r => new Document({ pageContent: r.content, metadata: r.metadata }));
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

  // We want to chunk the text to ~250 words. Using characters, ~1000 chars is ~200-250 words.
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200, // Some overlap to retain context across chunks
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

  // Condense the chunks into a single context string for the LLM
  const ragContext = results
    .map((r, i) => `--- Chunk ${i + 1} (${r.metadata.category}) ---\n${r.pageContent}`)
    .join("\n\n");

  return {
    ragContext,
  };
}
