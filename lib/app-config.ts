import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { AppConfig, DEFAULT_CONFIG, APP_CONFIG_VERSION } from "@/types/workspace";

const APP_DIR = path.join(os.homedir(), ".boussole");
const CONFIG_PATH = path.join(APP_DIR, "config.json");

async function ensureAppDir(): Promise<void> {
  await fs.mkdir(APP_DIR, { recursive: true });
}

export async function readAppConfig(): Promise<AppConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      configVersion: APP_CONFIG_VERSION,
    };
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { ...DEFAULT_CONFIG };
    }
    return { ...DEFAULT_CONFIG };
  }
}

export async function writeAppConfig(config: AppConfig): Promise<void> {
  await ensureAppDir();
  const tmpPath = `${CONFIG_PATH}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(config, null, 2), "utf-8");
  await fs.rename(tmpPath, CONFIG_PATH);
}

export async function updateAppConfig(
  updater: (current: AppConfig) => AppConfig
): Promise<AppConfig> {
  const current = await readAppConfig();
  const next = updater(current);
  await writeAppConfig(next);
  return next;
}

export function getAppDir(): string {
  return APP_DIR;
}

export function getAppConfigPath(): string {
  return CONFIG_PATH;
}
