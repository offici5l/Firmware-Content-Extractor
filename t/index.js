export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const JOB_NAME = url.searchParams.get("job_name")?.trim();
    console.log('JOB_NAME:', JOB_NAME);

    const ACCEPT_HEADER = "application/vnd.github.v3+json";
    const AUTH_HEADER = `token ${env.GTKK}`;
    const BASE_URL = "https://api.github.com/repos/offici5l/Firmware-Content-Extractor/actions/workflows/FCE.yml/runs";

    try {
      const response = await fetch(BASE_URL, {
        method: "GET",
        headers: {
          "Authorization": AUTH_HEADER,
          "Accept": ACCEPT_HEADER,
          "User-Agent": "Cloudflare Worker"
        }
      });

      if (!response.ok) {
        return new Response("Unable to fetch workflow runs", { status: 403 });
      }

      const data = await response.json();
      const jobUrls = data.workflow_runs.map(run => run.url + "/jobs");
      if (jobUrls.length === 0) {
        return new Response("No workflows found", { status: 404 });
      }

      for (const jobUrl of jobUrls) {
        console.log('Checking URL:', jobUrl);

        const jobResponse = await fetch(jobUrl, {
          method: "GET",
          headers: {
            "Authorization": AUTH_HEADER,
            "Accept": ACCEPT_HEADER,
            "User-Agent": "Cloudflare Worker"
          }
        });

        if (!jobResponse.ok) {
          console.error(`Failed to fetch job details from ${jobUrl}`);
          continue;
        }

        const jobData = await jobResponse.json();
        const job = jobData.jobs.find(job => job.name === JOB_NAME);
        if (job) {
          return new Response(job.steps.filter(step => ["validate", "download", "boot_img", "settings_apk", "upload"].includes(step.name)).map(step => `Name: ${step.name}\nStatus: ${step.status}\nConclusion: ${step.conclusion}\n`).join('\n'), { status: 200, headers: { 'Content-Type': 'text/plain' } });
          const jobConclusion = job.conclusion || "In progress...";
          return new Response(jobConclusion, { status: 200 });
        }
      }
      return new Response("Job not found", { status: 404 });
    } catch (error) {
      console.error('Error:', error);
      return new Response("An error occurred", { status: 500 });
    }
  }
};