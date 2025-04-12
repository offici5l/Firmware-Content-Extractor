export default {
  async fetch(req, env) {

    return new Response(`service is currently suspended.`, { status: 500 });

    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    let url = urlParams.get('url');


    const domains = [
        "ultimateota.d.miui.com", 
        "superota.d.miui.com", 
        "bigota.d.miui.com", 
        "cdnorg.d.miui.com", 
        "bn.d.miui.com", 
        "hugeota.d.miui.com",
        "cdn-ota.azureedge.net",
        "airtel.bigota.d.miui.com"
    ];

    if (url) { 
      if (url && url.includes(".zip")) {
        url = url.split(".zip")[0] + ".zip";
      } else {
        return new Response("\nOnly .zip URLs are supported.\n", { status: 400 });
      }
      for (const domain of domains) {
        if (url.includes(domain)) {
          url = url.replace(domain, "bkt-sgp-miui-ota-update-alisgp.oss-ap-southeast-1.aliyuncs.com");
          break;
        }
      }
    } else {
      return new Response("\nMissing parameters!\n\nUsage: \ncurl fce.offici5l.workers.dev?url=<url>\n\nExample:\n curl fce.offici5l.workers.dev?url=https://example.com/rom.zip\n\n", { status: 400 });
    }

    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      return new Response("\nThe provided URL is not accessible.\n", { status: 400 });
    }

    const fileName = url.split('/').pop();
    const combinedBasename = `${get}_${fileName}`;
    const finalUrl = `https://github.com/offici5l/Firmware-Content-Extractor/releases/download/${get}/${combinedBasename}`;

    const headers = {
      "Authorization": `token ${env.GTKK}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": "Cloudflare Worker"
    };

    const BaseUrl = "https://api.github.com/repos/offici5l/Firmware-Content-Extractor/actions/workflows/FCE.yml";

    const githubDispatchUrl = `${BaseUrl}/dispatches`;
    const TRACK_URL = `${BaseUrl}/runs`;

    try {
      const finalUrlResponse = await fetch(finalUrl, { method: 'HEAD' });
      if (finalUrlResponse.ok) {
        return new Response(`\nresult: available\nlink: ${finalUrl}\n`, { status: 200 });
      }

      const track = Date.now().toString();
      const data = { ref: "main", inputs: { get, url, track } };

      const githubResponse = await fetch(githubDispatchUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data)
      });

      if (githubResponse.ok) {
        while (true) {
          const trackResponse = await fetch(TRACK_URL, { method: "GET", headers });
          if (trackResponse.ok) {
            const workflowRuns = await trackResponse.json();
            for (const jobUrl of workflowRuns.workflow_runs.map(run => run.url + "/jobs")) {
              const jobResponse = await fetch(jobUrl, { method: "GET", headers });
              if (jobResponse.ok) {
                const jobData = await jobResponse.json();
                const job = jobData.jobs.find(job => job.name === track);
                if (job) {
                  return new Response(`\n\nIt will be available at this link: ${finalUrl}\n\nTrack progress: ${job.html_url}\n\n`, { status: 200 });
                }
              }
            }
          }
        }
      } else {
        const githubResponseText = await githubResponse.text();        
        return new Response(`GitHub Response Error: ${githubResponseText}`, { status: 500 });
      }
    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  }
};

