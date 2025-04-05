# Installation Guide for Augment Extension Orchestration Framework

This guide provides instructions for installing and setting up the Augment Extension Orchestration Framework.

## Prerequisites

Before installing the framework, ensure you have the following prerequisites:

- **Node.js**: Version 16.x or higher
- **npm**: Version 8.x or higher
- **Git**: For version control (optional)

You can check your current versions with:

```bash
node --version
npm --version
git --version
```

## Installation Options

The framework is divided into three phases, each with its own package. You can install any or all of them based on your needs.

### Option 1: Global Installation (Recommended for CLI Usage)

Global installation makes the CLI commands available system-wide.

#### Phase 1: Core Orchestration

```bash
npm install -g augment-cli
```

#### Phase 2: Change Management

```bash
npm install -g augment-cli-phase2
```

#### Phase 3: Advanced Features

```bash
npm install -g augment-cli-phase3
```

### Option 2: Local Installation (Recommended for Development)

Local installation is suitable when integrating the framework into your project.

```bash
# Create a new project or navigate to your existing project
mkdir my-augment-project
cd my-augment-project
npm init -y

# Install the packages locally
npm install augment-cli
npm install augment-cli-phase2
npm install augment-cli-phase3
```

### Option 3: Clone from Repository

For development or customization, you can clone the repository:

```bash
git clone https://github.com/augmentcode/augment-cli.git
cd augment-cli

# Install dependencies
npm install

# Build the project
npm run build
```

## Verifying Installation

After installation, verify that the CLI is working correctly:

### For Global Installation

```bash
augment-cli --version
```

### For Local Installation

```bash
npx augment-cli --version
```

## Configuration

After installation, you'll need to configure the framework. The default configuration is stored in `~/.augment-cli/config.json`.

You can set up the configuration using the CLI:

```bash
augment-cli config set --key dataDir --value "/path/to/data"
augment-cli config set --key logDir --value "/path/to/logs"
```

See the [Configuration Guide](CONFIG.md) for more details.

## Troubleshooting

### Common Issues

#### Permission Errors During Global Installation

If you encounter permission errors during global installation:

**On Linux/macOS:**
```bash
sudo npm install -g augment-cli
```

**On Windows:**
Run the command prompt or PowerShell as Administrator.

#### Path Issues

If the CLI command is not found after installation:

1. Ensure the npm global bin directory is in your PATH
2. On Windows, you might need to restart your command prompt

#### Dependency Issues

If you encounter dependency-related errors:

```bash
npm cache clean --force
npm install -g augment-cli
```

### Getting Help

If you encounter any issues not covered here:

1. Check the [FAQ](FAQ.md) section
2. Open an issue on the [GitHub repository](https://github.com/augmentcode/augment-cli/issues)

## Next Steps

After installation, refer to the following resources:

- [Getting Started Guide](README.md)
- [Configuration Guide](CONFIG.md)
- [Sample Scripts](samples/README.md)
