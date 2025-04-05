import { PerformanceMetric, StorageProvider } from './types';

/**
 * Manages performance metrics
 */
export class PerformanceMetrics {
  private metrics: PerformanceMetric[] = [];
  private storage: StorageProvider;

  /**
   * Creates a new PerformanceMetrics
   * @param storage Storage provider for persisting metrics
   */
  constructor(storage: StorageProvider) {
    this.storage = storage;
    this.loadMetrics();
  }

  /**
   * Adds a new metric
   * @param metric Metric to add
   * @returns The added metric
   */
  async addMetric(metric: Omit<PerformanceMetric, 'timestamp'>): Promise<PerformanceMetric> {
    const newMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now()
    };
    
    this.metrics.push(newMetric);
    await this.saveMetrics();
    
    return newMetric;
  }

  /**
   * Gets metrics matching a filter
   * @param filter Filter criteria
   * @returns Array of metrics
   */
  getMetrics(filter?: any): PerformanceMetric[] {
    if (!filter) {
      return [...this.metrics];
    }
    
    return this.metrics.filter(metric => {
      let match = true;
      
      if (filter.name && metric.name !== filter.name) {
        match = false;
      }
      
      if (filter.unit && metric.unit !== filter.unit) {
        match = false;
      }
      
      if (filter.minValue !== undefined && metric.value < filter.minValue) {
        match = false;
      }
      
      if (filter.maxValue !== undefined && metric.value > filter.maxValue) {
        match = false;
      }
      
      if (filter.startTime && metric.timestamp < filter.startTime) {
        match = false;
      }
      
      if (filter.endTime && metric.timestamp > filter.endTime) {
        match = false;
      }
      
      return match;
    });
  }

  /**
   * Gets metrics by name
   * @param name Metric name
   * @returns Array of metrics
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  /**
   * Gets the average value of a metric
   * @param name Metric name
   * @param timeRange Optional time range
   * @returns Average value or undefined if no metrics found
   */
  getAverageValue(name: string, timeRange?: { start: number; end: number }): number | undefined {
    const metrics = this.getMetricsByName(name).filter(metric => {
      if (!timeRange) {
        return true;
      }
      
      return metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end;
    });
    
    if (metrics.length === 0) {
      return undefined;
    }
    
    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }

  /**
   * Gets the success rate
   * @param timeRange Optional time range
   * @returns Success rate as a percentage
   */
  getSuccessRate(timeRange?: { start: number; end: number }): number {
    const successMetrics = this.getMetrics({
      name: 'operation_success',
      value: 1,
      ...(timeRange && { startTime: timeRange.start, endTime: timeRange.end })
    });
    
    const failureMetrics = this.getMetrics({
      name: 'operation_success',
      value: 0,
      ...(timeRange && { startTime: timeRange.start, endTime: timeRange.end })
    });
    
    const total = successMetrics.length + failureMetrics.length;
    
    if (total === 0) {
      return 100; // No operations means 100% success rate
    }
    
    return (successMetrics.length / total) * 100;
  }

  /**
   * Gets resource utilization metrics
   * @returns Resource utilization data
   */
  getResourceUtilization(): any {
    const cpuMetrics = this.getMetricsByName('cpu_usage');
    const memoryMetrics = this.getMetricsByName('memory_usage');
    
    // Calculate average CPU and memory usage
    const avgCpu = cpuMetrics.length > 0
      ? cpuMetrics.reduce((acc, metric) => acc + metric.value, 0) / cpuMetrics.length
      : 0;
    
    const avgMemory = memoryMetrics.length > 0
      ? memoryMetrics.reduce((acc, metric) => acc + metric.value, 0) / memoryMetrics.length
      : 0;
    
    // Get the latest metrics
    const latestCpu = cpuMetrics.length > 0
      ? cpuMetrics.sort((a, b) => b.timestamp - a.timestamp)[0]
      : undefined;
    
    const latestMemory = memoryMetrics.length > 0
      ? memoryMetrics.sort((a, b) => b.timestamp - a.timestamp)[0]
      : undefined;
    
    return {
      cpu: {
        average: avgCpu,
        latest: latestCpu?.value,
        unit: latestCpu?.unit || '%'
      },
      memory: {
        average: avgMemory,
        latest: latestMemory?.value,
        unit: latestMemory?.unit || 'MB'
      }
    };
  }

  /**
   * Loads metrics from storage
   * @private
   */
  private async loadMetrics(): Promise<void> {
    try {
      const metrics = await this.storage.load('performanceMetrics');
      
      if (metrics) {
        this.metrics = metrics;
      }
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
      this.metrics = [];
    }
  }

  /**
   * Saves metrics to storage
   * @private
   */
  private async saveMetrics(): Promise<void> {
    try {
      await this.storage.save('performanceMetrics', this.metrics);
    } catch (error) {
      console.error('Failed to save performance metrics:', error);
    }
  }
}
