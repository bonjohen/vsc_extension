import { AgentStatus, AgentOperation, OperationResult } from './types';

/**
 * Monitors agent status and detects disconnections
 */
export class AgentMonitor {
  private agents: Map<string, AgentStatus> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  /**
   * Creates a new AgentMonitor
   * @param heartbeatFrequency Frequency of heartbeat checks in milliseconds
   */
  constructor(private heartbeatFrequency: number = 5000) {
    this.startHeartbeatMonitor();
  }
  
  /**
   * Registers a new agent
   * @param agentId Unique identifier for the agent
   * @returns The agent status
   */
  registerAgent(agentId: string): AgentStatus {
    const status: AgentStatus = {
      id: agentId,
      status: 'STARTING',
      lastHeartbeat: Date.now(),
      operations: []
    };
    
    this.agents.set(agentId, status);
    return status;
  }
  
  /**
   * Records a heartbeat from an agent
   * @param agentId Unique identifier for the agent
   * @returns True if the agent exists, false otherwise
   */
  recordHeartbeat(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;
    
    agent.lastHeartbeat = Date.now();
    agent.status = 'RUNNING';
    
    agent.operations.push({
      timestamp: Date.now(),
      type: 'HEARTBEAT'
    });
    
    return true;
  }
  
  /**
   * Records the completion of an agent's operation
   * @param agentId Unique identifier for the agent
   * @param result Result of the operation
   * @returns True if the agent exists, false otherwise
   */
  recordCompletion(agentId: string, result: OperationResult): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;
    
    agent.status = result.success ? 'COMPLETED' : 'FAILED';
    
    agent.operations.push({
      timestamp: Date.now(),
      type: 'COMPLETION',
      details: result
    });
    
    return true;
  }
  
  /**
   * Records an error from an agent
   * @param agentId Unique identifier for the agent
   * @param error Error details
   * @returns True if the agent exists, false otherwise
   */
  recordError(agentId: string, error: any): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;
    
    agent.status = 'FAILED';
    
    agent.operations.push({
      timestamp: Date.now(),
      type: 'ERROR',
      details: error
    });
    
    return true;
  }
  
  /**
   * Gets the status of an agent
   * @param agentId Unique identifier for the agent
   * @returns The agent status or undefined if the agent doesn't exist
   */
  getAgentStatus(agentId: string): AgentStatus | undefined {
    return this.agents.get(agentId);
  }
  
  /**
   * Gets all registered agents
   * @returns Array of agent statuses
   */
  getAllAgents(): AgentStatus[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Gets agents with a specific status
   * @param status Status to filter by
   * @returns Array of agent statuses
   */
  getAgentsByStatus(status: AgentStatus['status']): AgentStatus[] {
    return Array.from(this.agents.values()).filter(agent => agent.status === status);
  }
  
  /**
   * Starts the heartbeat monitor
   * @private
   */
  private startHeartbeatMonitor(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      
      this.agents.forEach((agent, id) => {
        if (agent.status === 'RUNNING' && now - agent.lastHeartbeat > this.heartbeatFrequency * 2) {
          agent.status = 'DISCONNECTED';
          
          agent.operations.push({
            timestamp: now,
            type: 'DISCONNECTION',
            details: { reason: 'Heartbeat timeout' }
          });
          
          console.warn(`Agent ${id} disconnected due to heartbeat timeout`);
        }
      });
    }, this.heartbeatFrequency);
  }
  
  /**
   * Disposes of the agent monitor
   */
  dispose(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}
