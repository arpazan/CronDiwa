import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { Crontab } from "../types/type.js";
import { FastifyBaseLogger } from "fastify";

const execAsync = promisify(exec);

export const CRON_DIR = "/etc/cron.d";
export const LOG_DIR = "/var/log/crontabs";

export async function initCronSystem(logger: FastifyBaseLogger): Promise<void> {
  try {
    // Create log directory if it doesn't exist
    await fs.mkdir(LOG_DIR, { recursive: true });
    // Set appropriate permissions for the log directory
    await execAsync(`chmod 755 ${LOG_DIR}`);
    logger.info("Cron system initialized successfully");
  } catch (error) {
    logger.error(`Failed to initialize cron system: ${error}`);
    throw new Error(`Failed to initialize cron system: ${error}`);
  }
}

export async function writeCrontabFile(
  crontab: Crontab,
  logger: FastifyBaseLogger
): Promise<void> {
  try {
    // Create log file paths
    const stdoutPath = path.join(LOG_DIR, `crontab_${crontab.id}_stdout.log`);
    const stderrPath = path.join(LOG_DIR, `crontab_${crontab.id}_stderr.log`);

    // Format the crontab entry with logging
    // The format includes redirecting stdout and stderr to log files
    const cronContent =
      `# Crontab ${crontab.id}: ${crontab.name}\n` +
      `${crontab.schedule} root ${crontab.command} >> ${stdoutPath} 2>> ${stderrPath}\n` +
      `# End of crontab ${crontab.id}\n`;

    // Write to cron.d file
    const cronPath = path.join(CRON_DIR, `app_crontab_${crontab.id}`);
    await fs.writeFile(cronPath, cronContent);

    // Set proper permissions
    await execAsync(`chmod 644 ${cronPath}`);

    // Create empty log files if they don't exist
    await fs.writeFile(stdoutPath, "", { flag: "a" });
    await fs.writeFile(stderrPath, "", { flag: "a" });

    // Set proper permissions for log files
    await execAsync(`chmod 644 ${stdoutPath} ${stderrPath}`);

    logger.info(`Crontab ${crontab.id} written to ${cronPath}`);
  } catch (error) {
    logger.error(`Failed to write crontab file: ${error}`);
    throw new Error(`Failed to write crontab file: ${error}`);
  }
}

export async function removeCrontabFile(
  id: number,
  logger: FastifyBaseLogger
): Promise<void> {
  try {
    const cronPath = path.join(CRON_DIR, `app_crontab_${id}`);

    // Check if file exists before attempting to remove
    try {
      await fs.access(cronPath);
      await fs.unlink(cronPath);
      logger.info(`Crontab ${id} removed from ${cronPath}`);
    } catch (err) {
      // File doesn't exist, that's fine
      logger.info(`Crontab file for ID ${id} doesn't exist, no need to remove`);
    }
  } catch (error) {
    logger.error(`Failed to remove crontab file: ${error}`);
    throw new Error(`Failed to remove crontab file: ${error}`);
  }
}

export async function readCrontabLogs(
  id: number,
  logger: FastifyBaseLogger
): Promise<{ stdout: string; stderr: string }> {
  try {
    const stdoutPath = path.join(LOG_DIR, `crontab_${id}_stdout.log`);
    const stderrPath = path.join(LOG_DIR, `crontab_${id}_stderr.log`);

    let stdout = "";
    let stderr = "";

    // Read stdout log if it exists
    try {
      stdout = await fs.readFile(stdoutPath, "utf8");
    } catch (err) {
      stdout = "No stdout logs available";
      logger.info(`No stdout log file found for crontab ${id}`);
    }

    // Read stderr log if it exists
    try {
      stderr = await fs.readFile(stderrPath, "utf8");
    } catch (err) {
      stderr = "No stderr logs available";
      logger.info(`No stderr log file found for crontab ${id}`);
    }

    return { stdout, stderr };
  } catch (error) {
    logger.error(`Failed to read crontab logs: ${error}`);
    throw new Error(`Failed to read crontab logs: ${error}`);
  }
}

export async function clearCrontabLogs(id: number, logger: FastifyBaseLogger): Promise<void> {
  try {
    const stdoutPath = path.join(LOG_DIR, `crontab_${id}_stdout.log`);
    const stderrPath = path.join(LOG_DIR, `crontab_${id}_stderr.log`);

    // Clear stdout log if it exists
    try {
      await fs.writeFile(stdoutPath, "");
      logger.info(`Cleared stdout log for crontab ${id}`);
    } catch (err) {
      logger.info(`No stdout log file found for crontab ${id}`);
    }

    // Clear stderr log if it exists
    try {
      await fs.writeFile(stderrPath, "");
      logger.info(`Cleared stderr log for crontab ${id}`);
    } catch (err) {
      logger.info(`No stderr log file found for crontab ${id}`);
    }
  } catch (error) {
    logger.error(`Failed to clear crontab logs: ${error}`);
    throw new Error(`Failed to clear crontab logs: ${error}`);
  }
}
export async function testCrontabCommand(
  command: string,
  logger: FastifyBaseLogger
): Promise<{ success: boolean; output: string }> {
  try {
    const { stdout } = await execAsync(command);
    logger.info(`Command test successful: ${command}`);
    return {
      success: true,
      output: stdout || "Command executed successfully with no output",
    };
  } catch (error) {
    const err = (error as Error)
    logger.error(`Command test failed: ${err}`);
    return {
      success: false,
      output: `Error: ${err.message || "Unknown error"}`,
    };
  }
}
