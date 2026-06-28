async function testCompany(name) {
  try {
    const res = await fetch('http://localhost:3000/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName: name })
    });
    const text = await res.text();
    const lines = text.split('\n\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.type === 'result') {
          console.log(`[${name}] Decision: ${data.data.decision} | Confidence: ${data.data.dataSufficiency?.confidenceScore}% | LowConfidence Flag: ${data.data.dataSufficiency?.isLowConfidence}`);
          return;
        }
      }
    }
    console.log(`[${name}] No result found.`);
  } catch (e) {
    console.error(`[${name}] Failed:`, e.message);
  }
}

async function run() {
  console.log("Starting tests...");
  await testCompany('Sprinto');
  await testCompany('KSolves');
  await testCompany('Intellipaat');
  await testCompany('Apple');
}
run();
