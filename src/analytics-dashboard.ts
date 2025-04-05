import * as express from 'express';
import * as http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { PerformanceMetrics } from './performance-metrics';
import { AnalyticsDashboard, PerformanceMetric } from './types';
import * as os from 'os';

/**
 * Analytics dashboard implementation
 */
export class AnalyticsDashboardImpl implements AnalyticsDashboard {
  private metrics: PerformanceMetrics;
  private app: express.Express;
  private server: http.Server;
  private io: SocketIOServer;
  private port: number;
  private resourceMonitorInterval: NodeJS.Timeout | null = null;

  /**
   * Creates a new AnalyticsDashboardImpl
   * @param metrics Performance metrics
   * @param port Port to run the dashboard on
   */
  constructor(metrics: PerformanceMetrics, port: number = 3000) {
    this.metrics = metrics;
    this.port = port;
    
    // Create Express app
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIOServer(this.server);
    
    this.setupRoutes();
    this.setupSocketIO();
  }

  /**
   * Gets metrics matching a filter
   * @param filter Filter criteria
   * @returns Array of metrics
   */
  async getMetrics(filter?: any): Promise<PerformanceMetric[]> {
    return this.metrics.getMetrics(filter);
  }

  /**
   * Adds a new metric
   * @param metric Metric to add
   * @returns The added metric
   */
  async addMetric(metric: Omit<PerformanceMetric, 'timestamp'>): Promise<PerformanceMetric> {
    const newMetric = await this.metrics.addMetric(metric);
    
    // Emit the new metric to connected clients
    this.io.emit('newMetric', newMetric);
    
    return newMetric;
  }

  /**
   * Gets the success rate
   * @param timeRange Optional time range
   * @returns Success rate as a percentage
   */
  async getSuccessRate(timeRange?: { start: number; end: number }): Promise<number> {
    return this.metrics.getSuccessRate(timeRange);
  }

  /**
   * Gets resource utilization metrics
   * @returns Resource utilization data
   */
  async getResourceUtilization(): Promise<any> {
    return this.metrics.getResourceUtilization();
  }

  /**
   * Starts the dashboard
   */
  start(): void {
    this.server.listen(this.port, () => {
      console.log(`Analytics dashboard running at http://localhost:${this.port}`);
    });
    
    // Start monitoring system resources
    this.startResourceMonitoring();
  }

  /**
   * Stops the dashboard
   */
  stop(): void {
    if (this.server) {
      this.server.close();
    }
    
    if (this.resourceMonitorInterval) {
      clearInterval(this.resourceMonitorInterval);
      this.resourceMonitorInterval = null;
    }
  }

  /**
   * Sets up Express routes
   * @private
   */
  private setupRoutes(): void {
    // Serve static files
    this.app.use(express.static(__dirname + '/public'));
    this.app.use(express.json());
    
    // API routes
    this.app.get('/api/metrics', async (req, res) => {
      try {
        const metrics = await this.getMetrics(req.query);
        res.json(metrics);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get metrics' });
      }
    });
    
    this.app.post('/api/metrics', async (req, res) => {
      try {
        const metric = await this.addMetric(req.body);
        res.json(metric);
      } catch (error) {
        res.status(500).json({ error: 'Failed to add metric' });
      }
    });
    
    this.app.get('/api/success-rate', async (req, res) => {
      try {
        const timeRange = req.query.start && req.query.end
          ? {
              start: parseInt(req.query.start as string),
              end: parseInt(req.query.end as string)
            }
          : undefined;
        
        const successRate = await this.getSuccessRate(timeRange);
        res.json({ successRate });
      } catch (error) {
        res.status(500).json({ error: 'Failed to get success rate' });
      }
    });
    
    this.app.get('/api/resource-utilization', async (req, res) => {
      try {
        const utilization = await this.getResourceUtilization();
        res.json(utilization);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get resource utilization' });
      }
    });
    
    // Main dashboard page
    this.app.get('/', (req, res) => {
      res.send(this.getDashboardHTML());
    });
  }

  /**
   * Sets up Socket.IO
   * @private
   */
  private setupSocketIO(): void {
    this.io.on('connection', (socket) => {
      console.log('Client connected to analytics dashboard');
      
      socket.on('disconnect', () => {
        console.log('Client disconnected from analytics dashboard');
      });
    });
  }

  /**
   * Starts monitoring system resources
   * @private
   */
  private startResourceMonitoring(): void {
    this.resourceMonitorInterval = setInterval(async () => {
      try {
        // Get CPU usage
        const cpuUsage = os.loadavg()[0] * 100 / os.cpus().length;
        
        // Get memory usage
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsage = (usedMemory / totalMemory) * 100;
        
        // Add metrics
        await this.addMetric({
          name: 'cpu_usage',
          value: cpuUsage,
          unit: '%'
        });
        
        await this.addMetric({
          name: 'memory_usage',
          value: memoryUsage,
          unit: '%'
        });
      } catch (error) {
        console.error('Failed to monitor system resources:', error);
      }
    }, 60000); // Every minute
  }

  /**
   * Gets the HTML for the dashboard
   * @returns Dashboard HTML
   * @private
   */
  private getDashboardHTML(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Augment CLI Analytics Dashboard</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
          }
          
          h1, h2 {
            color: #333;
          }
          
          .dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: 20px;
            margin-top: 20px;
          }
          
          .card {
            background-color: white;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            padding: 20px;
          }
          
          .metric {
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0;
          }
          
          .chart-container {
            height: 300px;
            margin-top: 20px;
          }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="/socket.io/socket.io.js"></script>
      </head>
      <body>
        <h1>Augment CLI Analytics Dashboard</h1>
        
        <div class="dashboard">
          <div class="card">
            <h2>Success Rate</h2>
            <div class="metric" id="success-rate">-</div>
            <div class="chart-container">
              <canvas id="success-rate-chart"></canvas>
            </div>
          </div>
          
          <div class="card">
            <h2>Resource Utilization</h2>
            <div>
              <h3>CPU Usage</h3>
              <div class="metric" id="cpu-usage">-</div>
            </div>
            <div>
              <h3>Memory Usage</h3>
              <div class="metric" id="memory-usage">-</div>
            </div>
            <div class="chart-container">
              <canvas id="resource-chart"></canvas>
            </div>
          </div>
          
          <div class="card">
            <h2>Recent Operations</h2>
            <div id="recent-operations">
              <p>No operations yet</p>
            </div>
          </div>
        </div>
        
        <script>
          // Connect to Socket.IO
          const socket = io();
          
          // Charts
          let successRateChart;
          let resourceChart;
          
          // Initialize dashboard
          async function initDashboard() {
            // Get success rate
            const successRateResponse = await fetch('/api/success-rate');
            const successRateData = await successRateResponse.json();
            document.getElementById('success-rate').textContent = \`\${successRateData.successRate.toFixed(2)}%\`;
            
            // Get resource utilization
            const utilizationResponse = await fetch('/api/resource-utilization');
            const utilizationData = await utilizationResponse.json();
            
            document.getElementById('cpu-usage').textContent = \`\${utilizationData.cpu.latest?.toFixed(2) || '-'}%\`;
            document.getElementById('memory-usage').textContent = \`\${utilizationData.memory.latest?.toFixed(2) || '-'}%\`;
            
            // Get recent metrics
            const metricsResponse = await fetch('/api/metrics');
            const metrics = await metricsResponse.json();
            
            // Initialize charts
            initCharts(metrics);
            
            // Update recent operations
            updateRecentOperations(metrics);
          }
          
          function initCharts(metrics) {
            // Success rate chart
            const successRateCtx = document.getElementById('success-rate-chart').getContext('2d');
            successRateChart = new Chart(successRateCtx, {
              type: 'line',
              data: {
                labels: [],
                datasets: [{
                  label: 'Success Rate',
                  data: [],
                  borderColor: 'rgba(75, 192, 192, 1)',
                  tension: 0.1,
                  fill: false
                }]
              },
              options: {
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100
                  }
                }
              }
            });
            
            // Resource chart
            const resourceCtx = document.getElementById('resource-chart').getContext('2d');
            resourceChart = new Chart(resourceCtx, {
              type: 'line',
              data: {
                labels: [],
                datasets: [
                  {
                    label: 'CPU Usage',
                    data: [],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    tension: 0.1,
                    fill: false
                  },
                  {
                    label: 'Memory Usage',
                    data: [],
                    borderColor: 'rgba(54, 162, 235, 1)',
                    tension: 0.1,
                    fill: false
                  }
                ]
              },
              options: {
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100
                  }
                }
              }
            });
            
            // Populate charts with initial data
            const cpuMetrics = metrics.filter(m => m.name === 'cpu_usage');
            const memoryMetrics = metrics.filter(m => m.name === 'memory_usage');
            
            if (cpuMetrics.length > 0 && memoryMetrics.length > 0) {
              const timestamps = cpuMetrics.map(m => new Date(m.timestamp).toLocaleTimeString());
              const cpuValues = cpuMetrics.map(m => m.value);
              const memoryValues = memoryMetrics.map(m => m.value);
              
              resourceChart.data.labels = timestamps;
              resourceChart.data.datasets[0].data = cpuValues;
              resourceChart.data.datasets[1].data = memoryValues;
              resourceChart.update();
            }
          }
          
          function updateRecentOperations(metrics) {
            const operationsContainer = document.getElementById('recent-operations');
            const successMetrics = metrics.filter(m => m.name === 'operation_success');
            
            if (successMetrics.length === 0) {
              operationsContainer.innerHTML = '<p>No operations yet</p>';
              return;
            }
            
            // Sort by timestamp (newest first)
            successMetrics.sort((a, b) => b.timestamp - a.timestamp);
            
            // Take the 10 most recent
            const recentOperations = successMetrics.slice(0, 10);
            
            operationsContainer.innerHTML = recentOperations.map(op => {
              const success = op.value === 1;
              const time = new Date(op.timestamp).toLocaleString();
              return \`
                <div style="margin-bottom: 10px; padding: 10px; background-color: \${success ? '#e6ffe6' : '#ffe6e6'}; border-radius: 5px;">
                  <div><strong>Status:</strong> \${success ? 'Success' : 'Failure'}</div>
                  <div><strong>Time:</strong> \${time}</div>
                </div>
              \`;
            }).join('');
          }
          
          // Socket.IO event handlers
          socket.on('newMetric', (metric) => {
            // Update UI based on the new metric
            if (metric.name === 'cpu_usage') {
              document.getElementById('cpu-usage').textContent = \`\${metric.value.toFixed(2)}%\`;
              
              // Update chart
              resourceChart.data.labels.push(new Date(metric.timestamp).toLocaleTimeString());
              resourceChart.data.datasets[0].data.push(metric.value);
              
              // Keep only the last 10 points
              if (resourceChart.data.labels.length > 10) {
                resourceChart.data.labels.shift();
                resourceChart.data.datasets[0].data.shift();
              }
              
              resourceChart.update();
            } else if (metric.name === 'memory_usage') {
              document.getElementById('memory-usage').textContent = \`\${metric.value.toFixed(2)}%\`;
              
              // Update chart
              if (resourceChart.data.datasets[1].data.length < resourceChart.data.labels.length) {
                resourceChart.data.datasets[1].data.push(metric.value);
              } else {
                // Keep only the last 10 points
                if (resourceChart.data.datasets[1].data.length > 10) {
                  resourceChart.data.datasets[1].data.shift();
                }
                resourceChart.data.datasets[1].data.push(metric.value);
              }
              
              resourceChart.update();
            } else if (metric.name === 'operation_success') {
              // Refresh success rate
              fetch('/api/success-rate')
                .then(response => response.json())
                .then(data => {
                  document.getElementById('success-rate').textContent = \`\${data.successRate.toFixed(2)}%\`;
                });
              
              // Refresh recent operations
              fetch('/api/metrics')
                .then(response => response.json())
                .then(metrics => {
                  updateRecentOperations(metrics);
                });
            }
          });
          
          // Initialize the dashboard
          initDashboard();
        </script>
      </body>
      </html>
    `;
  }
}
