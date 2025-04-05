import { Agent, AgentSpecialization, MultiAgentOrchestration, StorageProvider, WorkItem } from './types';
import { AgentSpecializationManager } from './agent-specialization';

/**
 * Orchestrates multiple agents
 */
export class MultiAgentOrchestrationImpl implements MultiAgentOrchestration {
  private agents: Agent[] = [];
  private storage: StorageProvider;
  private specializationManager: AgentSpecializationManager;

  /**
   * Creates a new MultiAgentOrchestrationImpl
   * @param storage Storage provider for persisting agent data
   * @param specializationManager Agent specialization manager
   */
  constructor(storage: StorageProvider, specializationManager: AgentSpecializationManager) {
    this.storage = storage;
    this.specializationManager = specializationManager;
    this.loadAgents();
  }

  /**
   * Gets all agents
   * @returns Array of agents
   */
  async getAgents(): Promise<Agent[]> {
    return [...this.agents];
  }

  /**
   * Gets a specific agent
   * @param id Agent ID
   * @returns The agent or undefined if not found
   */
  async getAgent(id: string): Promise<Agent> {
    const agent = this.agents.find(a => a.id === id);
    
    if (!agent) {
      throw new Error(`Agent with ID ${id} not found`);
    }
    
    return agent;
  }

  /**
   * Assigns a task to an agent
   * @param taskId Task ID to assign
   * @param agentId Optional agent ID to assign to (if not provided, the best agent will be selected)
   * @returns The agent the task was assigned to
   */
  async assignTask(taskId: string, agentId?: string): Promise<Agent> {
    if (agentId) {
      // Assign to the specified agent
      const agent = this.agents.find(a => a.id === agentId);
      
      if (!agent) {
        throw new Error(`Agent with ID ${agentId} not found`);
      }
      
      if (agent.currentLoad >= agent.capacity) {
        throw new Error(`Agent ${agentId} is at capacity`);
      }
      
      // Update the agent's load
      agent.currentLoad++;
      await this.saveAgents();
      
      return agent;
    } else {
      // Find the best agent for the task
      const task = await this.storage.load(`task_${taskId}`);
      
      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }
      
      const specialization = this.determineTaskSpecialization(task);
      const agent = this.findBestAgentForTask(specialization);
      
      // Update the agent's load
      agent.currentLoad++;
      await this.saveAgents();
      
      return agent;
    }
  }

  /**
   * Balances the load across agents
   */
  async balanceLoad(): Promise<void> {
    // Sort agents by load percentage (currentLoad / capacity)
    const sortedAgents = [...this.agents].sort((a, b) => {
      const aLoadPercentage = a.currentLoad / a.capacity;
      const bLoadPercentage = b.currentLoad / b.capacity;
      return aLoadPercentage - bLoadPercentage;
    });
    
    // Find overloaded agents
    const overloadedAgents = sortedAgents.filter(a => a.currentLoad > a.capacity);
    
    if (overloadedAgents.length === 0) {
      // No overloaded agents, nothing to balance
      return;
    }
    
    // Find underloaded agents
    const underloadedAgents = sortedAgents.filter(a => a.currentLoad < a.capacity);
    
    if (underloadedAgents.length === 0) {
      // No underloaded agents, can't balance
      console.warn('Cannot balance load: all agents are at or over capacity');
      return;
    }
    
    // For each overloaded agent, move tasks to underloaded agents
    for (const overloadedAgent of overloadedAgents) {
      const excessLoad = overloadedAgent.currentLoad - overloadedAgent.capacity;
      
      for (let i = 0; i < excessLoad; i++) {
        // Find the most underloaded agent
        const mostUnderloadedAgent = underloadedAgents.reduce((prev, curr) => {
          const prevLoadPercentage = prev.currentLoad / prev.capacity;
          const currLoadPercentage = curr.currentLoad / curr.capacity;
          return prevLoadPercentage <= currLoadPercentage ? prev : curr;
        });
        
        // Move a task from the overloaded agent to the underloaded agent
        overloadedAgent.currentLoad--;
        mostUnderloadedAgent.currentLoad++;
        
        // If the agent is now at capacity, remove it from the underloaded list
        if (mostUnderloadedAgent.currentLoad >= mostUnderloadedAgent.capacity) {
          const index = underloadedAgents.indexOf(mostUnderloadedAgent);
          underloadedAgents.splice(index, 1);
          
          if (underloadedAgents.length === 0) {
            // No more underloaded agents, stop balancing
            break;
          }
        }
      }
    }
    
    // Save the updated agents
    await this.saveAgents();
  }

  /**
   * Registers a new agent
   * @param name Agent name
   * @param specialization Agent specialization
   * @param capacity Agent capacity
   * @returns The registered agent
   */
  async registerAgent(name: string, specialization: AgentSpecialization, capacity: number): Promise<Agent> {
    const id = `agent-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    const agent: Agent = {
      id,
      name,
      status: 'STARTING',
      specialization,
      capacity,
      currentLoad: 0
    };
    
    this.agents.push(agent);
    await this.saveAgents();
    
    return agent;
  }

  /**
   * Updates an agent's status
   * @param id Agent ID
   * @param status New status
   * @returns The updated agent
   */
  async updateAgentStatus(id: string, status: Agent['status']): Promise<Agent> {
    const agent = this.agents.find(a => a.id === id);
    
    if (!agent) {
      throw new Error(`Agent with ID ${id} not found`);
    }
    
    agent.status = status;
    await this.saveAgents();
    
    return agent;
  }

  /**
   * Completes a task for an agent
   * @param agentId Agent ID
   * @param taskId Task ID
   * @returns The updated agent
   */
  async completeTask(agentId: string, taskId: string): Promise<Agent> {
    const agent = this.agents.find(a => a.id === agentId);
    
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }
    
    // Decrease the agent's load
    if (agent.currentLoad > 0) {
      agent.currentLoad--;
    }
    
    await this.saveAgents();
    
    return agent;
  }

  /**
   * Determines the specialization for a task
   * @param task Task to determine specialization for
   * @returns The determined specialization
   * @private
   */
  private determineTaskSpecialization(task: WorkItem): AgentSpecialization {
    // Extract files from the task description or result
    const files: string[] = [];
    
    // This is a simplified approach; in a real implementation,
    // you would extract files from the task in a more robust way
    const description = task.description.toLowerCase();
    const fileMatches = description.match(/\b[\w-]+\.[a-z]{2,4}\b/g);
    
    if (fileMatches) {
      files.push(...fileMatches);
    }
    
    return this.specializationManager.determineSpecialization(task.description, files);
  }

  /**
   * Finds the best agent for a task
   * @param specialization Task specialization
   * @returns The best agent for the task
   * @private
   */
  private findBestAgentForTask(specialization: AgentSpecialization): Agent {
    // Filter agents by specialization and availability
    const availableAgents = this.agents.filter(a => 
      (a.specialization === specialization || a.specialization === 'general') &&
      a.currentLoad < a.capacity &&
      a.status === 'RUNNING'
    );
    
    if (availableAgents.length === 0) {
      // If no specialized agents are available, try any available agent
      const anyAvailableAgents = this.agents.filter(a => 
        a.currentLoad < a.capacity &&
        a.status === 'RUNNING'
      );
      
      if (anyAvailableAgents.length === 0) {
        throw new Error(`No available agents for specialization ${specialization}`);
      }
      
      // Sort by load percentage (currentLoad / capacity)
      anyAvailableAgents.sort((a, b) => {
        const aLoadPercentage = a.currentLoad / a.capacity;
        const bLoadPercentage = b.currentLoad / b.capacity;
        return aLoadPercentage - bLoadPercentage;
      });
      
      return anyAvailableAgents[0];
    }
    
    // Sort by specialization match and load percentage
    availableAgents.sort((a, b) => {
      // Prioritize exact specialization match
      if (a.specialization === specialization && b.specialization !== specialization) {
        return -1;
      }
      if (a.specialization !== specialization && b.specialization === specialization) {
        return 1;
      }
      
      // Then sort by load percentage
      const aLoadPercentage = a.currentLoad / a.capacity;
      const bLoadPercentage = b.currentLoad / b.capacity;
      return aLoadPercentage - bLoadPercentage;
    });
    
    return availableAgents[0];
  }

  /**
   * Loads agents from storage
   * @private
   */
  private async loadAgents(): Promise<void> {
    try {
      const agents = await this.storage.load('agents');
      
      if (agents) {
        this.agents = agents;
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
      this.agents = [];
    }
  }

  /**
   * Saves agents to storage
   * @private
   */
  private async saveAgents(): Promise<void> {
    try {
      await this.storage.save('agents', this.agents);
    } catch (error) {
      console.error('Failed to save agents:', error);
    }
  }
}
