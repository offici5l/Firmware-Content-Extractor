#!/bin/bash

API_URL="https://fce-api.onrender.com"

echo -e "\n=============================="
echo    "  Firmware Extractor CLI"
echo    "=============================="
echo -e "\nExtract files instantly from any ROM zip."
echo -e "\n- Supported: boot.img (more coming soon)"
echo -e "- All boot.img files are also archived at:"
echo -e "    https://t.me/boot_img_zip"
echo -e "\nYou can also use the website interface:"
echo -e "    https://fce-app.onrender.com"
echo -e "------------------------------\n"

read -p "Enter the firmware (.zip) URL: " ZIP_URL
IMAGE="boot.img"

RESPONSE=$(curl -s -X POST "$API_URL/extract" -H "Content-Type: application/json" -d "{\"url\":\"$ZIP_URL\", \"images\":\"$IMAGE\"}")

TASK_ID=$(echo "$RESPONSE" | grep -o '"task_id":"[^"]*' | cut -d':' -f2 | tr -d '"')
STATUS_URL=$(echo "$RESPONSE" | grep -o '"status_url":"[^"]*' | cut -d':' -f2- | tr -d '"')

if [[ -z "$TASK_ID" || -z "$STATUS_URL" ]]; then
    echo "Failed to start extraction: $RESPONSE"
    exit 1
fi

echo "Task started (Task ID: $TASK_ID)"
echo -n "Progress: "

LAST_STEP=""
while true; do
    curl -s -X POST "$API_URL/heartbeat/$TASK_ID" > /dev/null

    STATUS_JSON=$(curl -s "$STATUS_URL")
    STATUS=$(echo "$STATUS_JSON" | grep -o '"status":"[^"]*' | cut -d':' -f2 | tr -d '"')
    MESSAGE=$(echo "$STATUS_JSON" | grep -o '"message":"[^"]*' | sed 's/"message":"//;s/"$//')
    DL_URL=$(echo "$STATUS_JSON" | grep -o '"download_url":"[^"]*' | sed 's/"download_url":"//;s/"$//')

    STEP=$(echo "$MESSAGE" | grep -o 'Step [0-9]\+/[0-9]\+' || echo "$MESSAGE")
    [[ "$STEP" == "" ]] && STEP="$MESSAGE"

    if [[ "$STEP" != "$LAST_STEP" || "$STATUS" == "completed" || "$STATUS" == "failed" ]]; then
        printf "\rProgress: %-25s" "$STEP"
        LAST_STEP="$STEP"
    fi

    if [[ "$STATUS" == "completed" ]]; then
        echo -e "\rProgress: Completed!                "
        if [[ -n "$DL_URL" ]]; then
            echo "Done! Download link: $DL_URL"
        else
            echo "Extraction complete, but no download link found!"
        fi
        break
    elif [[ "$STATUS" == "failed" ]]; then
        echo -e "\rProgress: Failed!                   "
        echo "An error occurred during extraction!"
        break
    fi

    sleep 2
done