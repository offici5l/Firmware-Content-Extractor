### Firmware-Content-Extractor
___
**to extract files from the firmware without needing to download the full firmware (using GitHub Actions).**
___

- get settings_apk

- get boot.img


Usage:
```
curl -d "<get> <url>" fce.offici5l.workers.dev
```

Example:
```
curl -d "boot_img https://example.com/file.zip" fce.offici5l.workers.dev
```