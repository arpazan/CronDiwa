import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { Crontab } from "../types/type.js";
import { FastifyBaseLogger } from "fastify";

const execAsync = promisify(exec);

export const CRON_DIR = "/etc/cron.d";
const ROOT_CRON_FILE = path.join(CRON_DIR, "root");
export const LOG_DIR = "/var/log/crontabs";

async function reloadCron(logger: FastifyBaseLogger): Promise<void> {
  try {
    await execAsync(`crontab -c ${CRON_DIR} ${ROOT_CRON_FILE}`);
  } catch (error) {
    logger.warn(
      `Failed to use crontab -c, falling back to direct installation: ${error}`
    );
  }
}

function buildCrontabCommand(crontab: Crontab): string {
  const stdoutPath = path.join(LOG_DIR, `crontab_${crontab.id}_stdout.log`);
  const stderrPath = path.join(LOG_DIR, `crontab_${crontab.id}_stderr.log`);

  let command = crontab.command.trim();

  if (!command.endsWith(";")) {
    command += ";";
  }

  // Wrap command in braces
  let crontabJobString = `{ ${command} }`;

  // Redirect stdout and stderr to log files
  crontabJobString += ` >> ${stdoutPath} 2>> ${stderrPath}`;

  return crontabJobString;
}

export async function addCrontabToRootFile(
  crontab: Crontab,
  logger: FastifyBaseLogger
): Promise<void> {
  try {
    const command = buildCrontabCommand(crontab);

    // Create the cron entry (no user field needed for /etc/cron.d/root)
    const cronEntry = [
      `# Crontab ${crontab.id}: ${crontab.name}`,
      `${crontab.schedule} ${command}`,
      `# End of crontab ${crontab.id}`,
      "",
    ].join("\n");

    // Create empty log files if they don't exist
    const stdoutPath = path.join(LOG_DIR, `crontab_${crontab.id}_stdout.log`);
    const stderrPath = path.join(LOG_DIR, `crontab_${crontab.id}_stderr.log`);

    await fs.writeFile(stdoutPath, "", { flag: "a" });
    await fs.writeFile(stderrPath, "", { flag: "a" });
    await execAsync(`chmod 644 ${stdoutPath} ${stderrPath}`);

    let rootFileContent = await fs.readFile(ROOT_CRON_FILE, "utf8");

    // Check if this crontab ID already exists in the file
    const startMarker = `# Crontab ${crontab.id}: `;
    const endMarker = `# End of crontab ${crontab.id}`;

    let newRootFileContent;

    if (rootFileContent.includes(startMarker)) {
      // Replace the existing entry
      const startIndex = rootFileContent.indexOf(startMarker);
      const endIndex =
        rootFileContent.indexOf(endMarker, startIndex) + endMarker.length;

      // Extract the parts before and after the existing entry
      const beforeEntry = rootFileContent.substring(0, startIndex);
      const afterEntry = rootFileContent.substring(endIndex);

      // Create new content with the updated entry
      newRootFileContent = beforeEntry + cronEntry + afterEntry;
    } else {
      // Append the new entry to the end
      newRootFileContent = rootFileContent + cronEntry;
    }

    // Write the updated content back to the file
    await fs.writeFile(ROOT_CRON_FILE, newRootFileContent);

    await reloadCron(logger);

    logger.info(`Crontab ${crontab.id} added/updated in root cron file`);
  } catch (error) {
    logger.error(`Failed to add/update crontab in root file: ${error}`);
    throw new Error(`Failed to add/update crontab in root file: ${error}`);
  }
}

export async function removeCrontabFromRootFile(
  id: number,
  logger: FastifyBaseLogger
): Promise<void> {
  try {
    let rootFileContent;
    try {
      rootFileContent = await fs.readFile(ROOT_CRON_FILE, "utf8");
    } catch (error) {
      logger.info(`Root cron file does not exist, nothing to remove`);
      return;
    }

    // Check if this crontab ID exists in the file
    const startMarker = `# Crontab ${id}: `;
    const endMarker = `# End of crontab ${id}`;

    if (rootFileContent.includes(startMarker)) {
      // Find the start and end of the entry
      const startIndex = rootFileContent.indexOf(startMarker);
      const endIndex =
        rootFileContent.indexOf(endMarker, startIndex) + endMarker.length;

      // Extract the parts before and after the entry
      const beforeEntry = rootFileContent.substring(0, startIndex);
      let afterEntry = rootFileContent.substring(endIndex);

      // If afterEntry starts with a newline and beforeEntry ends with a newline,
      // remove one of the newlines to avoid double newlines
      if (afterEntry.startsWith("\n") && beforeEntry.endsWith("\n")) {
        afterEntry = afterEntry.substring(1);
      }

      // Create new content without the entry
      rootFileContent = beforeEntry + afterEntry;

      // Write the updated content back to the file
      await fs.writeFile(ROOT_CRON_FILE, rootFileContent);

      await reloadCron(logger);

      logger.info(`Crontab ${id} removed from root cron file`);
    } else {
      logger.info(
        `Crontab ${id} not found in root cron file, nothing to remove`
      );
    }
  } catch (error) {
    logger.error(`Failed to remove crontab from root file: ${error}`);
    throw new Error(`Failed to remove crontab from root file: ${error}`);
  }
}

export async function writeCrontabFile(
  crontab: Crontab,
  logger: any
): Promise<void> {
  return addCrontabToRootFile(crontab, logger);
}

export async function removeCrontabFile(
  id: number,
  logger: FastifyBaseLogger
): Promise<void> {
  return removeCrontabFromRootFile(id, logger);
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

    try {
      stdout = await fs.readFile(stdoutPath, "utf8");
    } catch (err) {
      stdout = "No stdout logs available";
      logger.info(`No stdout log file found for crontab ${id}`);
    }

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

export async function clearCrontabLogs(
  id: number,
  logger: FastifyBaseLogger
): Promise<void> {
  try {
    const stdoutPath = path.join(LOG_DIR, `crontab_${id}_stdout.log`);
    const stderrPath = path.join(LOG_DIR, `crontab_${id}_stderr.log`);

    try {
      await fs.writeFile(stdoutPath, "");
      logger.info(`Cleared stdout log for crontab ${id}`);
    } catch (err) {
      logger.info(`No stdout log file found for crontab ${id}`);
    }

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
    const err = error as Error;
    logger.error(`Command test failed: ${err}`);
    return {
      success: false,
      output: `Error: ${err.message || "Unknown error"}`,
    };
  }
}

export async function getAllCrontabsFromRootFile(
  logger: FastifyBaseLogger
): Promise<Crontab[]> {
  try {
    // Check if root file exists
    try {
      await fs.access(ROOT_CRON_FILE);
    } catch (error) {
      logger.info(`Root cron file does not exist yet`);
      return [];
    }

    // Read the root file content
    const content = await fs.readFile(ROOT_CRON_FILE, "utf8");
    const lines = content.split("\n");

    const crontabs: Crontab[] = [];
    let currentCrontab: Partial<Crontab> | null = null;

    // Parse the file line by line
    for (const line of lines) {
      // Check for start of crontab entry
      const startMatch = line.match(/^# Crontab (\d+): (.+)$/);
      if (startMatch) {
        currentCrontab = {
          id: parseInt(startMatch[1], 10),
          name: startMatch[2],
        };
        continue;
      }

      // Check for end of crontab entry
      if (line.match(/^# End of crontab \d+$/) && currentCrontab) {
        if (
          currentCrontab.id !== undefined &&
          currentCrontab.name !== undefined &&
          currentCrontab.schedule !== undefined &&
          currentCrontab.command !== undefined
        ) {
          crontabs.push(currentCrontab as Crontab);
        }
        currentCrontab = null;
        continue;
      }

      // Parse crontab line if we're in a crontab entry
      if (currentCrontab && !line.startsWith("#") && line.trim() !== "") {
        // Extract schedule and command
        // Format: "minute hour day month weekday [user] command"
        const parts = line.trim().split(/\s+/);

        if (parts.length >= 6) {
          // Extract schedule (first 5 parts)
          const schedule = parts.slice(0, 5).join(" ");

          // Check if user field is present
          let commandStart = 6;
          if (parts[5] === "root" || parts[5] === "nobody") {
            // Skip the user field
            commandStart = 6;
          } else {
            // No user field
            commandStart = 5;
          }

          // Extract command (remaining parts)
          let command = parts.slice(commandStart).join(" ");

          // Remove shell wrapper and output redirection
          command = command.replace(/^\/bin\/sh -c '{ (.+); } >> .+$/, "$1");

          currentCrontab.schedule = schedule;
          currentCrontab.command = command;
        }
      }
    }

    return crontabs;
  } catch (error) {
    logger.error(`Failed to get crontabs from root file: ${error}`);
    throw new Error(`Failed to get crontabs from root file: ${error}`);
  }
}
