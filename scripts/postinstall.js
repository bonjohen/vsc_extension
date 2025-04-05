#!/usr/bin/env node

/**
 * Post-installation script for the Augment CLI
 * This script runs after the package is installed
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Create the configuration directory
const configDir = path.join(os.homedir(), '.augment-cli');
const dataDir = path.join(configDir, 'data');
const logDir = path.join(configDir, 'logs');

// Create directories if they don't exist
try {
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
    console.log(`Created configuration directory: ${configDir}`);
  }
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Created data directory: ${dataDir}`);
  }
  
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
    console.log(`Created logs directory: ${logDir}`);
  }
  
  // Create default configuration if it doesn't exist
  const configPath = path.join(configDir, 'config.json');
  
  if (!fs.existsSync(configPath)) {
    const defaultConfig = {
      dataDir,
      logDir,
      heartbeatFrequency: 5000,
      defaultTimeout: 30 * 60 * 1000, // 30 minutes
      watchPaths: [process.cwd()],
      watchIgnored: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/out/**"],
      gitEnabled: true,
      analyticsPort: 3000,
      notificationEnabled: true,
      maxAgents: 5
    };
    
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
    console.log(`Created default configuration: ${configPath}`);
  }
  
  console.log('Augment CLI installation completed successfully!');
  console.log(`Configuration directory: ${configDir}`);
  console.log('Run "augment-cli --help" to see available commands');
} catch (error) {
  console.error('Error during post-installation:', error);
}
