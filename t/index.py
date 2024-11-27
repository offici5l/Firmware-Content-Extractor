import json

async def handle_request(request):
    url = "https://api.github.com/repos/offici5l/Firmware-Content-Extractor/actions/workflows/FCE.yml/runs"
    
    response = await fetch(url)
    
    if response.status == 200:
        data = await response.json()
        return json.dumps(data)
    else:
        return "Error: Unable to fetch data"

async def main(request):
    return await handle_request(request)