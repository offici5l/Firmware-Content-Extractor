async function checkUrlAccessibility(url) {
  const response = await fetch(url, { method: 'HEAD' });
  if (!response.ok) {
    throw new Error('URL is not accessible');
  }
}

async function handleRequest(request) {
  const requestBody = await request.text();
  const parts = requestBody.split(" ");

  if (parts.length < 2) {
    return new Response("\nMissing parameters. Usage: \ncurl -d \"<get> <url>\" <worker-url>\nExample: curl -d \"boot_img https://example.com/file.zip\" fce.offici5l.workers.dev\n", { status: 400 });
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
    const data = { ref: "main", inputs: { get, url } };

    try {
      const githubResponse = await fetch(GITHUB_ACTIONS_URL, {
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
        return new Response(`\nresult: success\nlink will be available at: ${finalUrl}\n`, { status: 200 });
      } else {
        const errorText = await githubResponse.text();
        return new Response(`Error from GitHub: ${errorText}`, { status: 500 });
      }
    } catch (error) {
      return new Response("Error while sending request to GitHub Actions.", { status: 500 });
    }
  }
}

addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));