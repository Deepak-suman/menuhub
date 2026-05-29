async function run() {
  const url = 'http://localhost:3000/r/aaru-restaurants/menu?table=1';
  console.log('Starting 5 consecutive requests to:', url);

  for (let i = 1; i <= 5; i++) {
    console.log(`\n--- Request #${i} ---`);
    const start = Date.now();
    try {
      const res = await fetch(url);
      const text = await res.text();
      console.log(`Request #${i} completed in ${Date.now() - start}ms with status ${res.status} (length: ${text.length})`);
    } catch (e) {
      console.error(`Request #${i} failed:`, e.message);
    }
    // Wait 1.5 seconds between requests
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
}

run();
