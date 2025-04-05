#!/usr/bin/env node

/**
 * This script updates the package.json files for all three phases
 * of the Augment Extension Orchestration Framework.
 */

const fs = require('fs');
const path = require('path');

// Phase configurations
const phases = [
  {
    dir: 'augment-cli',
    name: 'augment-cli',
    description: 'Core Orchestration',
    dependencies: {
      "commander": "^13.1.0",
      "fs-extra": "^11.3.0"
    }
  },
  {
    dir: 'augment-cli-phase2',
    name: 'augment-cli-phase2',
    description: 'Change Management',
    dependencies: {
      "commander": "^13.1.0",
      "fs-extra": "^11.3.0",
      "chokidar": "^3.5.3",
      "simple-git": "^3.23.0"
    }
  },
  {
    dir: 'augment-cli-phase3',
    name: 'augment-cli-phase3',
    description: 'Advanced Features',
    dependencies: {
      "commander": "^13.1.0",
      "fs-extra": "^11.3.0",
      "axios": "^1.8.4",
      "express": "^5.1.0",
      "socket.io": "^4.8.1",
      "node-notifier": "^10.0.1"
    }
  }
];

// Load the template
const templatePath = path.join(__dirname, '..', 'package-template.json');
const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

// Update each phase
phases.forEach(phase => {
  const packagePath = path.join(__dirname, '..', phase.dir, 'package.json');
  
  // Check if the package.json exists
  if (!fs.existsSync(packagePath)) {
    console.log(`Creating package.json for ${phase.dir}...`);
    
    // Create the directory if it doesn't exist
    const dir = path.join(__dirname, '..', phase.dir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } else {
    console.log(`Updating package.json for ${phase.dir}...`);
  }
  
  // Create a new package.json based on the template
  const packageJson = { ...template };
  
  // Update phase-specific fields
  packageJson.name = phase.name;
  packageJson.description = packageJson.description.replace('[PHASE_DESCRIPTION]', phase.description);
  packageJson.dependencies = { ...phase.dependencies };
  
  // Write the updated package.json
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2), 'utf8');
  
  console.log(`Updated package.json for ${phase.dir}`);
});

console.log('All package.json files have been updated!');
