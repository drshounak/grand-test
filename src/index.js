// Subjects list
const SUBJECTS = [
  "Anatomy", "Physiology", "Biochemistry", "Pathology", "Microbiology",
  "Pharmacology", "Forensic Medicine", "Community Medicine", "ENT",
  "Ophthalmology", "Medicine", "Surgery", "Obstetrics & Gynecology",
  "Pediatrics", "Dermatology", "Psychiatry", "Orthopedics", "Anesthesia", "Radiology"
];

// Handle requests
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Serve static HTML pages from the site bucket
  if (path === '/' || path === '/input.html') {
    const html = await fetchAsset('input.html');
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  if (path === '/dashboard' || path === '/dashboard.html') {
    const html = await fetchAsset('dashboard.html');
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  // API endpoints
  if (path === '/api/submit' && request.method === 'POST') {
    return handleSubmit(request);
  }

  if (path === '/api/get-all-data' && request.method === 'GET') {
    return handleGetAllData();
  }

  return new Response('Not Found', { status: 404 });
}

// Fetch static assets (simplified for Workers environment)
async function fetchAsset(path) {
  // In a real Workers environment with a site bucket, this would be handled by the runtime
  // For simplicity, we'll assume the HTML files are served directly via the bucket
  return await fetch(`/${path}`).then(res => res.text());
}

// Handle data submission
async function handleSubmit(request) {
  try {
    const data = await request.json();
    if (!data || !data.test_date) {
      return new Response(JSON.stringify({ error: "Invalid data format" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const testDate = data.test_date;
    const records = [];

    for (const subject of SUBJECTS) {
      const subjectData = data[subject] || {};
      const totalQuestions = parseInt(subjectData.total_questions) || 0;
      const correct = parseInt(subjectData.correct) || 0;
      const incorrect = parseInt(subjectData.incorrect) || 0;
      const skipped = parseInt(subjectData.skipped) || 0;
      const percentile = parseFloat(subjectData.percentile) || 0.0;

      if (totalQuestions > 0 || correct > 0 || incorrect > 0 || skipped > 0 || percentile > 0) {
        const record = {
          id: `${testDate}_${subject}_${Date.now()}`, // Unique ID
          test_date: testDate,
          subject,
          total_questions: totalQuestions,
          correct,
          incorrect,
          skipped,
          percentile
        };
        records.push(record);
        await NEET_PG_TRACKER.put(record.id, JSON.stringify(record));
      }
    }

    return new Response(JSON.stringify({ status: "success", message: "Data saved successfully" }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle data retrieval
async function handleGetAllData() {
  try {
    const list = await NEET_PG_TRACKER.list();
    const results = [];

    for (const key of list.keys) {
      const value = await NEET_PG_TRACKER.get(key.name);
      if (value) {
        results.push(JSON.parse(value));
      }
    }

    // Sort by test_date
    results.sort((a, b) => new Date(a.test_date) - new Date(b.test_date));

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
