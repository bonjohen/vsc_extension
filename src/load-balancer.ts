import { Agent, WorkItem } from './types';
import { MultiAgentOrchestrationImpl } from './multi-agent-orchestration';

/**
 * Balances load across agents
 */
export class LoadBalancer {
  private orchestration: MultiAgentOrchestrationImpl;
  private balanceInterval: NodeJS.Timeout | null = null;

  /**
   * Creates a new LoadBalancer
   * @param orchestration Multi-agent orchestration
   * @param balanceIntervalMs Interval in milliseconds to balance load
   */
  constructor(orchestration: MultiAgentOrchestrationImpl, balanceIntervalMs: number = 60000) {
    this.orchestration = orchestration;
    
    // Start automatic load balancing
    this.startAutoBalancing(balanceIntervalMs);
  }

  /**
   * Starts automatic load balancing
   * @param intervalMs Interval in milliseconds
   */
  startAutoBalancing(intervalMs: number): void {
    if (this.balanceInterval) {
      clearInterval(this.balanceInterval);
    }
    
    this.balanceInterval = setInterval(async () => {
      try {
        await this.balanceLoad();
      } catch (error) {
        console.error('Failed to balance load:', error);
      }
    }, intervalMs);
    
    console.log(`Automatic load balancing started with interval ${intervalMs}ms`);
  }

  /**
   * Stops automatic load balancing
   */
  stopAutoBalancing(): void {
    if (this.balanceInterval) {
      clearInterval(this.balanceInterval);
      this.balanceInterval = null;
      console.log('Automatic load balancing stopped');
    }
  }

  /**
   * Balances load across agents
   */
  async balanceLoad(): Promise<void> {
    console.log('Balancing load across agents...');
    await this.orchestration.balanceLoad();
  }

  /**
   * Assigns a task to the best agent
   * @param task Task to assign
   * @returns The agent the task was assigned to
   */
  async assignTask(task: WorkItem): Promise<Agent> {
    return this.orchestration.assignTask(task.id);
  }

  /**
   * Gets the current load distribution
   * @returns Load distribution data
   */
  async getLoadDistribution(): Promise<any> {
    const agents = await this.orchestration.getAgents();
    
    // Calculate total capacity and load
    const totalCapacity = agents.reduce((sum, agent) => sum + agent.capacity, 0);
    const totalLoad = agents.reduce((sum, agent) => sum + agent.currentLoad, 0);
    
    // Calculate load percentage for each agent
    const agentLoads = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      specialization: agent.specialization,
      capacity: agent.capacity,
      currentLoad: agent.currentLoad,
      loadPercentage: (agent.currentLoad / agent.capacity) * 100
    }));
    
    // Sort by load percentage (highest first)
    agentLoads.sort((a, b) => b.loadPercentage - a.loadPercentage);
    
    return {
      totalCapacity,
      totalLoad,
      loadPercentage: (totalLoad / totalCapacity) * 100,
      agents: agentLoads
    };
  }

  /**
   * Checks if load balancing is needed
   * @returns True if load balancing is needed, false otherwise
   */
  async isLoadBalancingNeeded(): Promise<boolean> {
    const agents = await this.orchestration.getAgents();
    
    // Check if any agent is overloaded
    const overloadedAgents = agents.filter(a => a.currentLoad > a.capacity);
    
    if (overloadedAgents.length > 0) {
      return true;
    }
    
    // Check if the load is unevenly distributed
    const loadPercentages = agents
      .filter(a => a.status === 'RUNNING')
      .map(a => a.currentLoad / a.capacity);
    
    if (loadPercentages.length <= 1) {
      return false;
    }
    
    // Calculate the standard deviation of load percentages
    const mean = loadPercentages.reduce((sum, val) => sum + val, 0) / loadPercentages.length;
    const variance = loadPercentages.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / loadPercentages.length;
    const stdDev = Math.sqrt(variance);
    
    // If the standard deviation is greater than 0.2 (20%), load balancing is needed
    return stdDev > 0.2;
  }
}
