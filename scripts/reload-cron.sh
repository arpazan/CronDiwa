#!/bin/sh
# scripts/reload-cron.sh

set -e

echo "Ensuring cron file permissions and reloading cron..."

# Ensure the cron file has the correct permissions
chmod 644 /etc/cron.d/app-crontabs

# Find cron process and send SIGHUP to reload
if pgrep crond > /dev/null; then
  pkill -HUP crond
  echo "Sent SIGHUP to cron daemon to reload configuration"
else
  echo "Cron daemon not running, cannot reload"
fi

# Output the current time to indicate when the reload happened
echo "Cron reload triggered at $(date)"