# CronDiwa - Modern Crontab Management System

## 🚀 Overview

CronDiwa is a user-friendly web interface for managing cron jobs in Linux systems. It simplifies the process of creating, editing, and monitoring scheduled tasks through an intuitive UI, eliminating the need to manually edit crontab files.


## ✨ Features

- **Intuitive Web Interface**: Manage your scheduled tasks with a clean, modern UI
- **Cron Expression Builder**: Create cron schedules easily with a visual builder
- **Common Templates**: Quick access to frequently used cron patterns
- **Real-time Validation**: Instant feedback on cron expression syntax
- **Task Monitoring**: View execution status and logs for each cron job
- **Run On-demand**: Execute tasks immediately without waiting for scheduled time
- **Detailed Logs**: Access stdout and stderr logs for troubleshooting
- **Multi-user Support**: Manage crontabs for different users (admin only)
- **System Integration**: Apply changes directly to the system's crontab

## 📋 Requirements

Node.js 20.x
Docker (for containerized deployment)
Linux-based system with cron installed
Modern web browser

## 🛠️ Installation

Using Docker (Recommended)

```base
# Pull the Docker image

docker pull paddlepop1/crondiwa:latest

# Run the container
docker run -d \
  --name crondiwa \
  -p 8000:8000 \
  --restart unless-stopped \
  crondiwa/crondiwa:latest
```

# Server configuration

```base
PORT=8000
```

# Cron configuration

```base
CRON_DIR=/etc/cron.d
LOG_DIR=/var/log/crontabs
```

# Authentication (optional)

```base
AUTH_USERNAME=admin
AUTH_PASSWORD=your-secure-password
```

## 📖 Usage

### Creating a New Cron Job

1. Navigate to the CronDiwa web interface (default: http://localhost:8000)
2. Click the "Add Crontab" button
3. Enter a name for your cron job
4. Set the schedule using either:
   - Direct cron expression input (e.g., 0 0 \* \* \*)
   - Visual cron expression builder
   - Pre-defined templates
5. Enter the command to execute
6. Click "Add" to create the cron job

### Managing Existing Cron Jobs

- View Details: Click on a cron job to view its details
- Edit: Click the pencil icon to modify a cron job
- Run Now: Click the play button to execute a job immediately
- View Logs: Click the document icon to see execution logs
- Delete: Click the trash icon to remove a cron job

## 🔒 Security

- CronDiwa requires appropriate permissions to read - and write crontab files
- When running in Docker, the container needs access to cron-related directories
- Enable authentication for production environments
  Use HTTPS when exposing the service to the internet

## 🙏 Acknowledgements

- Cron Parser - For cron expression parsing
- Cronstrue - For human-readable descriptions of cron expressions
- Fastify - Web framework
- VueJS - Frontend library
- SQLite - SQL database engine

CronDiwa © 2025
