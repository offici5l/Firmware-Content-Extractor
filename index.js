async function checkUrlAccessibility(url) {
  const response = await fetch(url, { method: 'HEAD' });
  if (!response.ok) {
    throw new Error('URL is not accessible');
  }
}

const track = "\"" + new Date().toISOString().replace(/[^\w]/g, '') + new Date().getSeconds() + Math.floor(Math.random() * 10000) + Date.now() + "\"";

async function handleRequest(request) {
  const requestBody = await request.text();
  const parts = requestBody.split(" ");

  if (parts.length < 2) {
    return new Response("\nMissing parameters!\n\nUsage: \ncurl -d \"<get> <url>\" <worker-url>\n\nExample:\n curl -d \"boot_img https://example.com/file.zip\" fce.offici5l.workers.dev\n\n", { status: 400 });
  }

  const get = parts[0];
  const url = parts[1];

  if (get !== "boot_img" && get !== "settings_apk") {
    return new Response("\nOnly 'boot_img' and 'settings_apk' are allowed.\n", { status: 400 });
  }

  if (!url.endsWith(".zip")) {
    return new Response("\nOnly .zip URLs are supported.\n", { status: 400 });
  }

  try {
    await checkUrlAccessibility(url);
  } catch (error) {
    return new Response("\nThe provided URL is not accessible.\n", { status: 400 });
  }

  const fileName = url.split('/').pop();
  const combinedBasename = `${get}_${fileName}`;
  const finalUrl = `https://github.com/offici5l/Firmware-Content-Extractor/releases/download/${get}/${combinedBasename}`;

  try {
    await checkUrlAccessibility(finalUrl);
    return new Response(`\nresult: available\nlink: ${finalUrl}\n`, { status: 200 });
  } catch (error) {
    const data = { ref: "main", inputs: { get, url, track } };
    
    try {
      const githubResponse = await fetch(`${GITHUB_ACTIONS_URL}/dispatches`, {
        method: "POST",
        headers: {
          "Authorization": `token ${GITHUB_TOKEN}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "Cloudflare Worker"
        },
        body: JSON.stringify(data)
      });

      if (githubResponse.ok) {
        const RUNS_URL = `${GITHUB_ACTIONS_URL}/runs`;
        const headers = {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
        };

        async function fetchIDs() {
          while (true) {
            try {
              console.log("Fetching runs from GitHub...");
              const response = await fetch(RUNS_URL, { headers });
              const responseBody = await response.json();
              if (responseBody && responseBody.workflow_runs) {
                const ids = responseBody.workflow_runs.map(run => run.id);
                for (const id of ids) {
                  const JOBS_URL = `${RUNS_URL}/runs/${id}/jobs`;
                  const jobsResponse = await fetch(JOBS_URL, { headers });
                  const jobsResponseBody = await jobsResponse.json();
                  const jobName = jobsResponseBody.jobs[0].name;

                  if (jobName === track) {
                    const steps = jobsResponseBody.jobs[0].steps;
                    if (steps.length > 0) {
                      return { steps, JOBS_URL }; 
                    }
                  }
                }
              }
            } catch (error) {
              console.error("Error fetching data: ", error);
            }
            await new Promise(resolve => setTimeout(resolve, 3000)); 
          }
        }

        (async () => {
          const result = await fetchIDs();
          for (const step of result.steps) {
            console.log(`Checking step: ${step.name} ==> status: ${step.status}`);
            while (step.status !== "completed") {
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
            console.log(`Step: ${step.name} ==> conclusion: ${step.conclusion}`);
            if (step.name === "upload") {
              if (step.conclusion === "success") {
                console.log(`\nlink: ${finalUrl}\n`);
                return;
              }
            }
          }
        })();
      } else {
        return new Response(`Error from GitHub: ${errorText}`, { status: 500 });
      }
    } catch (error) {
      console.error("Error during GitHub API request:", error);
      const errorText = await githubResponse.text();
      return new Response(`Error from GitHub: ${errorText}`, { status: 500 });
    }
  }
}

export default {
  async fetch(req) {
    return handleRequest(req);
  }
};