#!/usr/bin/env node

import { Command } from 'commander';
import { AgentMonitor } from './agent-monitor';
import { WorkQueue } from './work-queue';
import { FileStorageProvider } from './storage-provider';
import { AugmentController } from './augment-controller';
import { loadConfig } from './config';

// Load configuration
const config = loadConfig();

// Initialize services
const storageProvider = new FileStorageProvider(config.dataDir);
const agentMonitor = new AgentMonitor(config.heartbeatFrequency);
const workQueue = new WorkQueue(storageProvider);
const augmentController = new AugmentController(agentMonitor);

// Create the CLI program
const program = new Command();

program
  .name('augment-cli')
  .description('CLI for orchestrating Augment operations')
  .version('1.0.0');

// Queue management commands
const queueCommand = program
  .command('queue')
  .description('Work queue management');

queueCommand
  .command('add')
  .description('Add a new task to the queue')
  .requiredOption('--title <title>', 'Task title')
  .option('--description <description>', 'Task description')
  .option('--priority <priority>', 'Task priority (low, medium, high)', 'medium')
  .action(async (options) => {
    try {
      // Validate priority
      if (!['low', 'medium', 'high'].includes(options.priority)) {
        console.error('Invalid priority. Must be one of: low, medium, high');
        return;
      }
      
      const id = await workQueue.addItem({
        title: options.title,
        description: options.description || '',
        priority: options.priority as 'low' | 'medium' | 'high'
      });
      
      console.log(`Task added with ID: ${id}`);
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  });

queueCommand
  .command('list')
  .description('List tasks in the queue')
  .option('--status <status>', 'Filter by status (pending, in-progress, completed, failed)')
  .action(async (options) => {
    try {
      // Validate status if provided
      if (options.status && !['pending', 'in-progress', 'completed', 'failed'].includes(options.status)) {
        console.error('Invalid status. Must be one of: pending, in-progress, completed, failed');
        return;
      }
      
      const tasks = workQueue.listItems(options.status as any);
      
      if (tasks.length === 0) {
        console.log('No tasks found');
        return;
      }
      
      console.log(`Found ${tasks.length} tasks:`);
      
      tasks.forEach(task => {
        console.log(`ID: ${task.id}`);
        console.log(`Title: ${task.title}`);
        console.log(`Description: ${task.description}`);
        console.log(`Priority: ${task.priority}`);
        console.log(`Status: ${task.status}`);
        console.log(`Created: ${new Date(task.createdAt).toLocaleString()}`);
        
        if (task.startedAt) {
          console.log(`Started: ${new Date(task.startedAt).toLocaleString()}`);
        }
        
        if (task.completedAt) {
          console.log(`Completed: ${new Date(task.completedAt).toLocaleString()}`);
        }
        
        if (task.assignedTo) {
          console.log(`Assigned to: ${task.assignedTo}`);
        }
        
        console.log('---');
      });
    } catch (error) {
      console.error('Failed to list tasks:', error);
    }
  });

queueCommand
  .command('next')
  .description('Get the next task from the queue')
  .action(async () => {
    try {
      const task = await workQueue.getNextItem();
      
      if (!task) {
        console.log('No pending tasks in the queue');
        return;
      }
      
      console.log(`Next task:`);
      console.log(`ID: ${task.id}`);
      console.log(`Title: ${task.title}`);
      console.log(`Description: ${task.description}`);
      console.log(`Priority: ${task.priority}`);
      console.log(`Status: ${task.status}`);
    } catch (error) {
      console.error('Failed to get next task:', error);
    }
  });

queueCommand
  .command('update')
  .description('Update the status of a task')
  .requiredOption('--id <id>', 'Task ID')
  .requiredOption('--status <status>', 'New status (pending, in-progress, completed, failed)')
  .action(async (options) => {
    try {
      // Validate status
      if (!['pending', 'in-progress', 'completed', 'failed'].includes(options.status)) {
        console.error('Invalid status. Must be one of: pending, in-progress, completed, failed');
        return;
      }
      
      const success = await workQueue.updateItemStatus(
        options.id,
        options.status as 'pending' | 'in-progress' | 'completed' | 'failed'
      );
      
      if (success) {
        console.log(`Task ${options.id} updated to status: ${options.status}`);
      } else {
        console.error(`Task with ID ${options.id} not found`);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  });

queueCommand
  .command('remove')
  .description('Remove a task from the queue')
  .requiredOption('--id <id>', 'Task ID')
  .action(async (options) => {
    try {
      const success = await workQueue.removeItem(options.id);
      
      if (success) {
        console.log(`Task ${options.id} removed from the queue`);
      } else {
        console.error(`Task with ID ${options.id} not found`);
      }
    } catch (error) {
      console.error('Failed to remove task:', error);
    }
  });

// Agent management commands
const agentCommand = program
  .command('agent')
  .description('Agent management');

agentCommand
  .command('start')
  .description('Start an agent with a task')
  .requiredOption('--task-id <taskId>', 'Task ID to process')
  .option('--timeout <timeout>', 'Timeout in minutes', '30')
  .action(async (options) => {
    try {
      const task = workQueue.getItemById(options.taskId);
      
      if (!task) {
        console.error(`Task with ID ${options.taskId} not found`);
        return;
      }
      
      if (task.status !== 'pending' && task.status !== 'in-progress') {
        console.error(`Task with ID ${options.taskId} is not pending or in-progress`);
        return;
      }
      
      const timeoutMs = parseInt(options.timeout) * 60 * 1000;
      const agentId = await augmentController.startAgent(task, timeoutMs);
      
      // Assign the task to the agent
      await workQueue.assignItem(options.taskId, agentId);
      
      console.log(`Agent started with ID: ${agentId}`);
      console.log(`Processing task: ${task.title}`);
      console.log(`Timeout: ${options.timeout} minutes`);
    } catch (error) {
      console.error('Failed to start agent:', error);
    }
  });

agentCommand
  .command('list')
  .description('List all agents')
  .option('--status <status>', 'Filter by status (STARTING, RUNNING, COMPLETED, FAILED, DISCONNECTED)')
  .action((options) => {
    try {
      let agents;
      
      if (options.status) {
        // Validate status
        if (!['STARTING', 'RUNNING', 'COMPLETED', 'FAILED', 'DISCONNECTED'].includes(options.status)) {
          console.error('Invalid status. Must be one of: STARTING, RUNNING, COMPLETED, FAILED, DISCONNECTED');
          return;
        }
        
        agents = agentMonitor.getAgentsByStatus(options.status as any);
      } else {
        agents = agentMonitor.getAllAgents();
      }
      
      if (agents.length === 0) {
        console.log('No agents found');
        return;
      }
      
      console.log(`Found ${agents.length} agents:`);
      
      agents.forEach(agent => {
        console.log(`ID: ${agent.id}`);
        console.log(`Status: ${agent.status}`);
        console.log(`Last Heartbeat: ${new Date(agent.lastHeartbeat).toLocaleString()}`);
        console.log(`Operations: ${agent.operations.length}`);
        console.log('---');
      });
    } catch (error) {
      console.error('Failed to list agents:', error);
    }
  });

agentCommand
  .command('status')
  .description('Check agent status')
  .requiredOption('--id <id>', 'Agent ID')
  .action((options) => {
    try {
      const agent = agentMonitor.getAgentStatus(options.id);
      
      if (!agent) {
        console.error(`Agent with ID ${options.id} not found`);
        return;
      }
      
      console.log(`Agent Status:`);
      console.log(`ID: ${agent.id}`);
      console.log(`Status: ${agent.status}`);
      console.log(`Last Heartbeat: ${new Date(agent.lastHeartbeat).toLocaleString()}`);
      
      console.log(`\nRecent Operations:`);
      
      const recentOperations = agent.operations.slice(-5).reverse();
      
      if (recentOperations.length === 0) {
        console.log('No operations recorded');
      } else {
        recentOperations.forEach(op => {
          console.log(`- ${new Date(op.timestamp).toLocaleString()}: ${op.type}`);
          
          if (op.details) {
            console.log(`  Details: ${JSON.stringify(op.details)}`);
          }
        });
      }
    } catch (error) {
      console.error('Failed to check agent status:', error);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// If no arguments provided, show help
if (process.argv.length <= 2) {
  program.help();
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  agentMonitor.dispose();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  agentMonitor.dispose();
  process.exit(0);
});
