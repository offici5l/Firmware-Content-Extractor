async function handleRequest(request) {
  const { url, get } = await request.json();

  if (!url || !get) {
    return new Response("Missing URL or 'get' parameter", { status: 400 });
  }

  if (get !== "boot_img" && get !== "settings_apk") {
    return new Response("Only 'boot_img' and 'settings_apk' are allowed for 'get' parameter", { status: 400 });
  }

  if (!url.endsWith(".zip")) {
    return new Response("The provided URL is not supported. Only .zip files are allowed.", { status: 400 });
  }

  try {
    const linkResponse = await fetch(url, { method: "HEAD" });
    if (!linkResponse.ok) {
      return new Response("The provided URL is not accessible.", { status: 400 });
    }
  } catch (error) {
    console.error("Error while checking the URL:", error);  // Log the error details for debugging
    return new Response(`An error occurred while checking the URL accessibility: ${error.message}`, { status: 500 });
  }

  const data = {
    ref: "main", 
    inputs: {
      get: get,
      url: url
    }
  };

  const githubActionsUrl = GITHUB_ACTIONS_URL;
  const githubToken = GITHUB_TOKEN;

  try {
    const githubResponse = await fetch(githubActionsUrl, {
      method: "POST",
      headers: {
        "Authorization": `token ${githubToken}`,
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
      console.error("GitHub API error:", errorText);
      return new Response(`An error occurred while sending the request to GitHub: ${errorText}`, { status: 500 });
    }
  } catch (error) {
    console.error("Error while sending request to GitHub Actions:", error);
    return new Response(`An error occurred while sending the request to GitHub: ${error.message}`, { status: 500 });
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});