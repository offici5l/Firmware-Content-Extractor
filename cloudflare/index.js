export default {
  async fetch(req, env) {
    // return new Response("\n Service under maintenance\n", { status: 400 });

    return new Response(
      "\nThe current service has been discontinued.\nPlease use the new service directly at:\nhttps://fce-app.onrender.com\n",
      { status: 200 }
    );

    const urlParams = new URLSearchParams(req.url.split("?")[1]);
    let url = urlParams.get("url");

    const domains = [
      "ultimateota.d.miui.com",
      "superota.d.miui.com",
      "bigota.d.miui.com",
      "cdnorg.d.miui.com",
      "bn.d.miui.com",
      "hugeota.d.miui.com",
      "cdn-ota.azureedge.net",
      "airtel.bigota.d.miui.com",
    ];

    if (url) {
      if (url.includes(".zip")) {
        url = url.split(".zip")[0] + ".zip";
      } else {
        return new Response("\nOnly .zip URLs are supported.\n", { status: 400 });
      }
      for (const domain of domains) {
        if (url.includes(domain)) {
          url = url.replace(
            domain,
            "bkt-sgp-miui-ota-update-alisgp.oss-ap-southeast-1.aliyuncs.com"
          );
          break;
        }
      }
    } else {
      return new Response(
        "\nMissing parameters!\n\nUsage: \ncurl fce.offici5l.workers.dev?url=<url>\n\nExample:\n curl fce.offici5l.workers.dev?url=https://example.com/rom.zip\n\n",
        { status: 400 }
      );
    }

    const response = await fetch(url, { method: "HEAD" });
    if (!response.ok) {
      return new Response("\nThe provided URL is not accessible.\n", { status: 400 });
    }

    const fileName = url.split("/").pop();

    try {
      const Name = url.split("/").pop().split(".zip")[0];
      const vJsonResponse = await fetch(
        "https://raw.githubusercontent.com/offici5l/Firmware-Content-Extractor/main/v.json"
      );
      if (vJsonResponse.ok) {
        const data = await vJsonResponse.json();
        let foundKey = null;
        for (const key in data) {
          if (key.startsWith(Name)) {
            foundKey = key;
            const values = data[foundKey];
            let telegramLinks = [];
            for (const [k, v] of Object.entries(values)) {
              if (v === "true") {
                telegramLinks.push(`Available in: t.me/${k}`);
              }
            }
            if (telegramLinks.length > 0) {
              return new Response(`\n${telegramLinks.join("\n")}\n\n`, { status: 200 });
            } else {
              return new Response(`\nNo Telegram links found for ${Name}\n`, { status: 200 });
            }
          }
        }
      }
    } catch (error) {
      return new Response(`Error: ${error}`, { status: 500 });
    }

    const headers = {
      Authorization: `token ${env.GTKK}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": "Cloudflare Worker",
    };

    const BaseUrl =
      "https://api.github.com/repos/offici5l/Firmware-Content-Extractor/actions/workflows/FCE.yml";
    const githubDispatchUrl = `${BaseUrl}/dispatches`;
    const TRACK_URL = `${BaseUrl}/runs`;

    const track = Date.now().toString();
    const data = { ref: "main", inputs: { url, track } };

    try {
      const githubResponse = await fetch(githubDispatchUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data),
      });

      if (githubResponse.ok) {
        while (true) {
          const trackResponse = await fetch(TRACK_URL, { method: "GET", headers });
          if (trackResponse.ok) {
            const workflowRuns = await trackResponse.json();
            for (const jobUrl of workflowRuns.workflow_runs.map(
              (run) => run.url + "/jobs"
            )) {
              const jobResponse = await fetch(jobUrl, { method: "GET", headers });
              if (jobResponse.ok) {
                const jobData = await jobResponse.json();
                const job = jobData.jobs.find((job) => job.name === track);
                if (job) {
                  return new Response(`\n\nTrack progress: ${job.html_url}\n>(End of process)\n\n`, {
                    status: 200,
                  });
                }
              }
            }
          }
        }
      } else {
        const githubResponseText = await githubResponse.text();
        return new Response(`GitHub Response Error: ${githubResponseText}`, {
          status: 500,
        });
      }
    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  },
};