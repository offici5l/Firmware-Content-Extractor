from telethon.sync import TelegramClient
from telethon.tl.functions.messages import SendMediaRequest
from telethon.tl.types import InputMediaUploadedDocument
from telethon.tl.types import DocumentAttributeFilename
import os, sys

api_id = os.getenv('API_ID')
api_hash = os.getenv('API_HASH')
phone = os.getenv('PHONE')
channel_id = sys.argv[1]
file_path = sys.argv[2]

client = TelegramClient('session_name', api_id, api_hash)

with client:
    client.start(phone=phone)
    file = client.upload_file(file_path)
    client(SendMediaRequest(
        peer=channel_id,
        media=InputMediaUploadedDocument(
            file=file,
            mime_type='application/zip',
            attributes=[DocumentAttributeFilename(os.path.basename(file_path))]
        ),
        message=os.path.splitext(os.path.basename(file_path))[0]
    ))