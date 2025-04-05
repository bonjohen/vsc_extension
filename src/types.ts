/**
 * Represents the status of an agent
 */
export type AgentStatusType = 'STARTING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'DISCONNECTED';

/**
 * Represents an operation performed by an agent
 */
export interface AgentOperation {
  timestamp: number;
  type: 'HEARTBEAT' | 'COMPLETION' | 'DISCONNECTION' | 'ERROR';
  details?: any;
}

/**
 * Represents the status of an agent
 */
export interface AgentStatus {
  id: string;
  status: AgentStatusType;
  lastHeartbeat: number;
  operations: AgentOperation[];
}

/**
 * Represents the result of an operation
 */
export interface OperationResult {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * Represents a work item in the queue
 */
export interface WorkItem {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  createdAt: number;
  assignedTo?: string;
  startedAt?: number;
  completedAt?: number;
  result?: any;
}

/**
 * Interface for storage providers
 */
export interface StorageProvider {
  load(key: string): Promise<any>;
  save(key: string, data: any): Promise<void>;
}
