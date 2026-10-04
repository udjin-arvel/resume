import requests
import json
import sys

def telegram_bot_send_document(file_location, title):
    bot_token = "0000000000:AA-demo-telegram-token"  # Replace with your actual bot token
    bot_chatId = "@WOjiIs511akZuJ"  # Replace with your actual chat ID

    url = f'https://api.telegram.org/bot{bot_token}/sendDocument'
    data = {
        'chat_id': bot_chatId,
        'caption': title
    }
    files = {'document': open(file_location, 'rb')}

    try:
        response = requests.post(url, data=data, files=files)
        response.raise_for_status()  # Raise an exception for bad status codes
        print("File sent successfully!", response.json())
    except requests.exceptions.RequestException as e:
        print(f"Error sending file: {e}")

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python send_db_dump.py <file_location> <title>")
        sys.exit(1)

    file_location = sys.argv[1]
    title = sys.argv[2]
    telegram_bot_send_document(file_location, title)
