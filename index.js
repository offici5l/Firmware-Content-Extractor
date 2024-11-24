async function handleRequest(request) {
  const { url, get } = await request.json();

  if (!url) {
    return new Response("Missing URL parameter", { status: 400 });
  }

  if (!get) {
    return new Response("Missing 'get' parameter", { status: 400 });
  }

  if (get !== "boot_img" && get !== "settings_apk") {
    return new Response("Invalid 'get' parameter. Only 'boot_img' and 'settings_apk' are allowed.", { status: 400 });
  }

  if (!url.endsWith(".zip")) {
    return new Response("Invalid URL. Only .zip files are supported.", { status: 400 });
  }

  try {
    const linkResponse = await fetch(url, { method: "HEAD" });
    if (!linkResponse.ok) {
      return new Response("The provided URL is not accessible.", { status: 400 });
    }
  } catch (error) {
    return new Response("Error while checking URL accessibility.", { status: 500 });
  }

  const fileName = url.split('/').pop();
  const combinedBasename = `${get}_${fileName}`;
  const finalUrl = `https://github.com/offici5l/Firmware-Content-Extractor/releases/download/${get}/${combinedBasename}`;

  try {
    const newUrlResponse = await fetch(finalUrl, { method: "HEAD" });
    if (newUrlResponse.ok) {
      return new Response(`The new URL is available: ${finalUrl}`, { status: 200 });
    }
  } catch {}

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
      return new Response("Request successfully sent to GitHub Actions!", { status: 200 });
    } else {
      const errorText = await githubResponse.text();
      return new Response(`Error from GitHub: ${errorText}`, { status: 500 });
    }
  } catch (error) {
    return new Response("Error while sending request to GitHub Actions.", { status: 500 });
  }
}

addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));