# Augment CLI Sample Scripts

This directory contains sample scripts that demonstrate how to use the Augment CLI for various workflows.

## Basic Workflow

The basic workflow scripts demonstrate a simple end-to-end workflow using the Augment CLI:

- **augment-workflow.sh** - Shell script for Unix/Linux/macOS
- **augment-workflow.cmd** - Batch script for Windows

This workflow demonstrates:
1. Creating a task
2. Starting an agent to work on the task
3. Monitoring changes
4. Reviewing and approving changes
5. Generating an audit report
6. Sending notifications
7. Adding metrics to the analytics dashboard

## Multi-Agent Orchestration

The multi-agent orchestration scripts demonstrate a more complex workflow with multiple agents:

- **augment-multi-agent.sh** - Shell script for Unix/Linux/macOS
- **augment-multi-agent.cmd** - Batch script for Windows

This workflow demonstrates:
1. Registering specialized agents
2. Creating multiple tasks
3. Assigning tasks to agents based on specialization
4. Monitoring agent load and balancing
5. Waiting for all tasks to complete
6. Reviewing changes
7. Generating a comprehensive audit report
8. Starting the analytics dashboard

## Usage

### Unix/Linux/macOS

Make the scripts executable:

```bash
chmod +x augment-workflow.sh
chmod +x augment-multi-agent.sh
```

Run the scripts:

```bash
./augment-workflow.sh
./augment-multi-agent.sh
```

### Windows

Run the scripts by double-clicking them in File Explorer or from the command prompt:

```cmd
augment-workflow.cmd
augment-multi-agent.cmd
```

## Notes

- These scripts are examples and may need to be modified to fit your specific environment.
- Some commands may require additional configuration, such as setting up webhook URLs for notifications.
- Make sure the Augment CLI is installed and in your PATH before running these scripts.
- The scripts assume that the Augment CLI is installed globally. If it's installed locally, you may need to adjust the commands to use `npx` or the full path to the CLI.
