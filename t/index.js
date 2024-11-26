addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method === "POST") {
    try {
      const requestBody = await request.json();
      const anam = requestBody.anam;

      if (!anam) {
        return new Response("Missing 'anam' parameter", { status: 400 });
      }

      const jobsResponse = await fetch('https://api.github.com/repos/offici5l/Firmware-Content-Extractor/actions/workflows/FCE.yml/runs');
      const jobsData = await jobsResponse.json();
      const jobUrls = jobsData.workflow_runs.map(run => run.url + "/jobs");

      for (const jobUrl of jobUrls) {
        const jobData = await fetch(jobUrl);
        const jobJson = await jobData.json();
        const jobs = jobJson.jobs;

        for (const job of jobs) {
          if (job.name === anam) {
            while (true) {
              const uploadStep = job.steps.find(step => step.name === "upload");
              if (uploadStep) {
                const { status, conclusion } = uploadStep;

                if (status === "completed") {
                  if (conclusion === "success") {
                    return new Response(conclusion, { status: 200 });
                  } else {
                    return new Response("failed", { status: 200 });
                  }
                }
              }
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
      }
    } catch (error) {
      return new Response("Error: " + error.message, { status: 500 });
    }
  } else {
    return new Response("Only POST method is supported", { status: 405 });
  }
}