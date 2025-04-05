import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs-extra';

/**
 * Configuration for the CLI
 */
export interface Config {
  dataDir: string;
  heartbeatFrequency: number;
  defaultTimeout: number;
}

/**
 * Default configuration
 */
const defaultConfig: Config = {
  dataDir: path.join(os.homedir(), '.augment-cli'),
  heartbeatFrequency: 5000,
  defaultTimeout: 30 * 60 * 1000 // 30 minutes
};

/**
 * Loads the configuration
 * @returns The loaded configuration
 */
export function loadConfig(): Config {
  const configPath = path.join(os.homedir(), '.augment-cli', 'config.json');
  
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      return {
        ...defaultConfig,
        ...config
      };
    }
  } catch (error) {
    console.warn('Failed to load config, using defaults:', error);
  }
  
  return defaultConfig;
}

/**
 * Saves the configuration
 * @param config Configuration to save
 */
export function saveConfig(config: Config): void {
  const configDir = path.join(os.homedir(), '.augment-cli');
  const configPath = path.join(configDir, 'config.json');
  
  try {
    fs.ensureDirSync(configDir);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to save config:', error);
  }
}
