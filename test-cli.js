// Simple test script to verify our implementation
const { AgentMonitor } = require('./src/agent-monitor');
const { WorkQueue } = require('./src/work-queue');
const { FileStorageProvider } = require('./src/storage-provider');
const { AugmentController } = require('./src/augment-controller');

// Create instances of our classes
const storageProvider = new FileStorageProvider('./data');
const agentMonitor = new AgentMonitor(5000);
const workQueue = new WorkQueue(storageProvider);
const augmentController = new AugmentController(agentMonitor);

// Test the agent monitor
const agentId = agentMonitor.registerAgent('test-agent');
console.log(`Registered agent: ${agentId}`);

// Test the work queue
workQueue.addItem({
  title: 'Test Task',
  description: 'This is a test task',
  priority: 'medium'
}).then(id => {
  console.log(`Added task with ID: ${id}`);
  
  // Test getting the next item
  return workQueue.getNextItem();
}).then(item => {
  console.log(`Next item: ${item.title}`);
  
  // Test updating the item status
  return workQueue.updateItemStatus(item.id, 'completed', { result: 'Test completed' });
}).then(success => {
  console.log(`Updated item status: ${success}`);
  
  // Test listing items
  const items = workQueue.listItems();
  console.log(`Found ${items.length} items`);
  
  // Test the agent controller
  return augmentController.startAgent(items[0]);
}).then(agentId => {
  console.log(`Started agent with ID: ${agentId}`);
  
  // Wait for a bit to see agent status changes
  setTimeout(() => {
    const status = agentMonitor.getAgentStatus(agentId);
    console.log(`Agent status: ${status.status}`);
    
    // Clean up
    agentMonitor.dispose();
    console.log('Test completed');
  }, 10000);
}).catch(error => {
  console.error('Test failed:', error);
});
