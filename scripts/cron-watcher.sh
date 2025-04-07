#!/bin/sh
# scripts/cron-watcher.sh

echo "Starting cron watcher service..."

# Function to check for changes in the cron file
check_cron_file() {
  # Get current timestamp of the file
  CURRENT_TIMESTAMP=$(stat -c %Y /etc/cron.d/app-crontabs 2>/dev/null || echo "0")
  
  # If we don't have a previous timestamp, set it to current
  if [ -z "$PREV_TIMESTAMP" ]; then
    PREV_TIMESTAMP=$CURRENT_TIMESTAMP
    return 1  # No change detected
  fi
  
  # Compare timestamps
  if [ "$CURRENT_TIMESTAMP" != "$PREV_TIMESTAMP" ]; then
    PREV_TIMESTAMP=$CURRENT_TIMESTAMP
    return 0  # Change detected
  fi
  
  return 1  # No change detected
}

# Initialize variable
PREV_TIMESTAMP=""

# Main loop
while true; do
  # Check if the cron file exists
  if [ -f /etc/cron.d/app-crontabs ]; then
    # Check if the file has changed
    if check_cron_file; then
      echo "Change detected in cron file at $(date)"
      /app/scripts/reload-cron.sh
    fi
  else
    echo "Cron file does not exist, waiting..."
  fi
  
  # Sleep for a few seconds
  sleep 5
done