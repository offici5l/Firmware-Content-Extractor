export default {
  async fetch(req, env) {
    try {
      const requestBody = await req.text();
      const TOKEN = env.GTKK;
      const JOB_NAME = requestBody;

      const BASE_URL = 'https://api.github.com/repos/offici5l/Firmware-Content-Extractor/actions/workflows/FCE.yml/runs';
      const ACCEPT_HEADER = 'application/vnd.github+json';
      const AUTH_HEADER = `token ${TOKEN}`;

      const runsResponse = await fetch(BASE_URL, {
        headers: {
          'Accept': ACCEPT_HEADER,
          'Authorization': AUTH_HEADER
        }
      });

      if (!runsResponse.ok) {
        return new Response(`Error: Unable to fetch workflow runs`, { status: 500 });
      }

      const runsData = await runsResponse.json();
      const jobUrls = runsData.workflow_runs.map(run => `${run.url}/jobs`);

      for (let jobUrl of jobUrls) {
        const jobResponse = await fetch(jobUrl, {
          headers: {
            'Accept': ACCEPT_HEADER,
            'Authorization': AUTH_HEADER
          }
        });

        if (!jobResponse.ok) {
          return new Response(`Error: Unable to fetch job data`, { status: 500 });
        }

        const jobData = await jobResponse.json();
        const job = jobData.jobs.find(j => j.name === JOB_NAME);

        if (job) {
          if (job.conclusion === null) {
            return new Response("In progress...", { status: 200 });
          } else {
            return new Response(`${job.conclusion}`, { status: 200 });
          }
        }
      }

      return new Response("Job not found", { status: 404 });

    } catch (error) {
      return new Response("Error: " + error.message, { status: 500 });
    }
  }
};