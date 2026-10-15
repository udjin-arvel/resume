#!/bin/bash

# Send the latest database backup
file_location="/root/server/math-help-ai-v2/db_backups/latest.sql"
/usr/bin/python3 /root/server/math-help-ai-v2/send_tg.py  "$file_location" "DB dump"

# Send the latest log file
lname=$(ls /root/server/math-help-ai-v2/logs -Art | tail -n 1)
file_location="/root/server/math-help-ai-v2/logs/${lname}"
/usr/bin/python3 /root/server/math-help-ai-v2/send_tg.py  "$file_location" "Latest logs"
