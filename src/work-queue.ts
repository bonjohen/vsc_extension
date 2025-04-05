import { WorkItem, StorageProvider } from './types';

/**
 * Manages a queue of work items
 */
export class WorkQueue {
  private items: WorkItem[] = [];
  
  /**
   * Creates a new WorkQueue
   * @param storage Storage provider for persisting the queue
   */
  constructor(private storage: StorageProvider) {
    this.loadQueue();
  }
  
  /**
   * Adds a new item to the queue
   * @param item Item to add
   * @returns ID of the added item
   */
  async addItem(item: Omit<WorkItem, 'id' | 'status' | 'createdAt'>): Promise<string> {
    const id = this.generateId();
    
    const newItem: WorkItem = {
      ...item,
      id,
      status: 'pending',
      createdAt: Date.now()
    };
    
    this.items.push(newItem);
    await this.saveQueue();
    
    return id;
  }
  
  /**
   * Gets the next item from the queue
   * @returns The next item or undefined if the queue is empty
   */
  async getNextItem(): Promise<WorkItem | undefined> {
    // Sort by priority and creation date
    this.items.sort((a, b) => {
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      
      const priorityValues = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityValues[b.priority as keyof typeof priorityValues] - 
                          priorityValues[a.priority as keyof typeof priorityValues];
      
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt - b.createdAt;
    });
    
    const nextItem = this.items.find(item => item.status === 'pending');
    
    if (nextItem) {
      nextItem.status = 'in-progress';
      nextItem.startedAt = Date.now();
      await this.saveQueue();
    }
    
    return nextItem;
  }
  
  /**
   * Gets an item by ID
   * @param id ID of the item to get
   * @returns The item or undefined if not found
   */
  getItemById(id: string): WorkItem | undefined {
    return this.items.find(item => item.id === id);
  }
  
  /**
   * Updates the status of an item
   * @param id ID of the item to update
   * @param status New status
   * @param result Optional result data
   * @returns True if the item was updated, false otherwise
   */
  async updateItemStatus(id: string, status: WorkItem['status'], result?: any): Promise<boolean> {
    const item = this.items.find(item => item.id === id);
    
    if (!item) return false;
    
    item.status = status;
    
    if (status === 'completed' || status === 'failed') {
      item.completedAt = Date.now();
      item.result = result;
    }
    
    await this.saveQueue();
    return true;
  }
  
  /**
   * Assigns an item to an agent
   * @param id ID of the item to assign
   * @param agentId ID of the agent to assign to
   * @returns True if the item was assigned, false otherwise
   */
  async assignItem(id: string, agentId: string): Promise<boolean> {
    const item = this.items.find(item => item.id === id);
    
    if (!item) return false;
    
    item.assignedTo = agentId;
    await this.saveQueue();
    
    return true;
  }
  
  /**
   * Lists items in the queue
   * @param status Optional status to filter by
   * @returns Array of items
   */
  listItems(status?: WorkItem['status']): WorkItem[] {
    if (status) {
      return this.items.filter(item => item.status === status);
    }
    
    return [...this.items];
  }
  
  /**
   * Removes an item from the queue
   * @param id ID of the item to remove
   * @returns True if the item was removed, false otherwise
   */
  async removeItem(id: string): Promise<boolean> {
    const initialLength = this.items.length;
    this.items = this.items.filter(item => item.id !== id);
    
    if (this.items.length !== initialLength) {
      await this.saveQueue();
      return true;
    }
    
    return false;
  }
  
  /**
   * Generates a unique ID
   * @private
   * @returns A unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Loads the queue from storage
   * @private
   */
  private async loadQueue(): Promise<void> {
    try {
      const items = await this.storage.load('workQueue');
      
      if (items) {
        this.items = items;
      }
    } catch (error) {
      console.error('Failed to load work queue:', error);
      this.items = [];
    }
  }
  
  /**
   * Saves the queue to storage
   * @private
   */
  private async saveQueue(): Promise<void> {
    try {
      await this.storage.save('workQueue', this.items);
    } catch (error) {
      console.error('Failed to save work queue:', error);
    }
  }
}
