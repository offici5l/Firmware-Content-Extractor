from js import Response
from time import sleep

aname = "gg7"

async def check_workflows():
    while True:
        response = await fetch("https://api.github.com/repos/offici5l/Firmware-Content-Extractor/actions/workflows/FCE.yml/runs")
        workflow_runs = await response.json()

        if not workflow_runs.get("workflow_runs"):
            print("No workflow runs found.")
            await sleep(1)
            continue

        for workflow_run in workflow_runs["workflow_runs"]:
            job_url = workflow_run["url"] + "/jobs"
            job_response = await fetch(job_url)
            jobs = await job_response.json()

            if not jobs.get("jobs"):
                print("No jobs found for this workflow.")
                continue

            for job in jobs["jobs"]:
                name = job["name"]
                if name == aname:
                    upload = None
                    for step in job["steps"]:
                        if step["name"] == "upload":
                            upload = step
                            break
                    
                    if upload:
                        status = upload["status"]
                        print(f"Status: {status}")

                        if status == "completed":
                            conclusion = upload["conclusion"]
                            print(f"Conclusion: {conclusion}")
                            
                            if conclusion == "success":
                                print("Upload completed successfully!")
                                return Response.new("success!")
                            else:
                                print("Upload failed.")
                                return Response.new("failed!")
        await sleep(1)

async def on_fetch(request, env):
    return await check_workflows()