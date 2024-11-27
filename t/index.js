export default {
  async fetch(req, env) {
    const requestBody = await req.text();
    const JOB_NAME = requestBody.trim();

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
      const jobUrl = data.workflow_runs
        .map(run => run.url + "/jobs")
        .find(url => url.includes(JOB_NAME));

      if (!jobUrl) {
        return new Response("Job not found", { status: 404 });
      }

      const jobResponse = await fetch(jobUrl, {
        method: "GET",
        headers: {
          "Authorization": AUTH_HEADER,
          "Accept": ACCEPT_HEADER,
          "User-Agent": "Cloudflare Worker"
        }
      });

      if (!jobResponse.ok) {
        return new Response("Unable to fetch job details", { status: 403 });
      }

      const jobData = await jobResponse.json();
      const jobConclusion = jobData.jobs
        .find(job => job.name === JOB_NAME)?.conclusion;

      if (jobConclusion === "null" || !jobConclusion) {
        return new Response("In progress...", { status: 200 });
      }

      return new Response(jobConclusion, { status: 200 });
    } catch (error) {
      return new Response("An error occurred", { status: 500 });
    }
  }
};