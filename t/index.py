from js import Response

aname = "gg7"

async def check_workflows():
    while True:
        response = await fetch("https://api.github.com/repos/offici5l/Firmware-Content-Extractor/actions/workflows/FCE.yml/runs")
        workflow_runs = await response.json()

        for workflow_run in workflow_runs["workflow_runs"]:
            job_url = workflow_run["url"] + "/jobs"
            job_response = await fetch(job_url)
            jobs = await job_response.json()

            for job in jobs["jobs"]:
                name = job["name"]
                if name == aname:
                    while True:
                        upload = None
                        for step in job["steps"]:
                            if step["name"] == "upload":
                                upload = step
                                break
                        
                        if upload:
                            status = upload["status"]
                            console.log(f"{status}")

                            if status == "completed":
                                conclusion = upload["conclusion"]
                                console.log(f"{status}")
                                
                                if conclusion == "success":
                                    console.log(f"{conclusion}")
                                    return Response.new("success!")
                                else:
                                    console.log("failed")
                                    return Response.new("failed!")
        await sleep(1)

async def on_fetch(request, env):
    return await check_workflows()