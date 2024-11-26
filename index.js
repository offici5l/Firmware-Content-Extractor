async function checkUrlAccessibility(url) {
  const response = await fetch(url, { method: 'HEAD' });
  if (!response.ok) {
    throw new Error('URL is not accessible');
  }
}

async function handleRequest(request) {
  const requestBody = await request.text();
  const [get, url] = requestBody.split(" ");

  if (!get || !url) {
    return new Response("\nMissing parameters!\n\nUsage: \ncurl -d \"<get> <url>\" <worker-url>\n\nExample:\n curl -d \"boot_img https://example.com/file.zip\" fce.offici5l.workers.dev\n\n", { status: 400 });
  }

  if (!["boot_img", "settings_apk"].includes(get)) {
    return new Response("\nOnly 'boot_img' and 'settings_apk' are allowed.\n", { status: 400 });
  }

  if (!url.endsWith(".zip")) {
    return new Response("\nOnly .zip URLs are supported.\n", { status: 400 });
  }

  try {
    await checkUrlAccessibility(url);
  } catch {
    return new Response("\nThe provided URL is not accessible.\n", { status: 400 });
  }

  const fileName = url.split('/').pop();
  const combinedBasename = `${get}_${fileName}`;
  const finalUrl = `https://github.com/offici5l/Firmware-Content-Extractor/releases/download/${get}/${combinedBasename}`;
  const GITHUB_ACTIONS_URL = "https://api.github.com/repos/offici5l/Firmware-Content-Extractor/actions/workflows/FCE.yml";
  const ONE_URL = `${GITHUB_ACTIONS_URL}/dispatches`;
  const track = new Date().toISOString().replace(/[^\w]/g, '') + Date.now();

  try {
    await checkUrlAccessibility(finalUrl);
    return new Response(`\nresult: available\nlink: ${finalUrl}\n`, { status: 200 });
  } catch {
    const data = { ref: "main", inputs: { get, url } };

    try {
      const githubResponse = await fetch(ONE_URL, {
        method: "POST",
        headers: {
          "Authorization": `token ${token}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "Cloudflare Worker"
        },
        body: JSON.stringify(data)
      });

      if (githubResponse.ok) {
        const errorText = await githubResponse.text();
        return new Response(`Error from GitHub: ${errorText}`, { status: 500 });
      }

      async function fetchIDs() {
        const RUNS_URL = `${GITHUB_ACTIONS_URL}/runs`;
        const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };
        while (true) {
          try {
            const response = await fetch(RUNS_URL, { headers });
            const responseBody = await response.json();
            if (responseBody?.workflow_runs) {
              for (const run of responseBody.workflow_runs) {
                const JOBS_URL = `${RUNS_URL}/runs/${run.id}/jobs`;
                const jobsResponse = await fetch(JOBS_URL, { headers });
                const jobsResponseBody = await jobsResponse.json();
                const jobName = jobsResponseBody.jobs[0].name;

                if (jobName === track) {
                  const steps = jobsResponseBody.jobs[0].steps;
                  if (steps.length > 0) return { steps, JOBS_URL };
                }
              }
            }
          } catch (error) {
            console.error("Error fetching data: ", error);
          }
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      const result = await fetchIDs();
      for (const step of result.steps) {
        while (step.status !== "completed") {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        if (step.name === "upload" && step.conclusion === "success") {
          console.log(`\nlink: ${finalUrl}\n`);
          return;
        }
      }
    } catch (error) {
      console.log(error);
      return new Response(`Error from GitHub1`);
    }
  }
}

export default {
  async fetch(req) {
    return handleRequest(req);
  }
};