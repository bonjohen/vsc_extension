import axios from 'axios';
import { CICDIntegration, Pipeline } from './types';

/**
 * Integration with Jenkins
 */
export class JenkinsIntegration implements CICDIntegration {
  private baseUrl: string;
  private username: string;
  private apiToken: string;

  /**
   * Creates a new JenkinsIntegration
   * @param baseUrl Jenkins instance URL
   * @param username Jenkins username
   * @param apiToken Jenkins API token
   */
  constructor(baseUrl: string, username: string, apiToken: string) {
    this.baseUrl = baseUrl;
    this.username = username;
    this.apiToken = apiToken;
  }

  /**
   * Gets a list of pipelines (jobs)
   * @returns Array of pipelines
   */
  async getPipelines(): Promise<Pipeline[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/json`,
        {
          auth: {
            username: this.username,
            password: this.apiToken
          },
          params: {
            tree: 'jobs[name,url,lastBuild[id,url,timestamp,result,building]]'
          }
        }
      );
      
      return response.data.jobs.map((job: any) => this.mapJenkinsJobToPipeline(job));
    } catch (error) {
      console.error('Failed to get Jenkins jobs:', error);
      throw error;
    }
  }

  /**
   * Gets a specific pipeline
   * @param id Pipeline ID (job name)
   * @returns The pipeline
   */
  async getPipeline(id: string): Promise<Pipeline> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/job/${encodeURIComponent(id)}/api/json`,
        {
          auth: {
            username: this.username,
            password: this.apiToken
          },
          params: {
            tree: 'name,url,lastBuild[id,url,timestamp,result,building]'
          }
        }
      );
      
      return this.mapJenkinsJobToPipeline(response.data);
    } catch (error) {
      console.error(`Failed to get Jenkins job ${id}:`, error);
      throw error;
    }
  }

  /**
   * Triggers a pipeline
   * @param name Pipeline name (job name)
   * @param params Parameters for the pipeline
   * @returns The triggered pipeline
   */
  async triggerPipeline(name: string, params?: any): Promise<Pipeline> {
    try {
      let url = `${this.baseUrl}/job/${encodeURIComponent(name)}/build`;
      
      // If parameters are provided, use the buildWithParameters endpoint
      if (params) {
        url = `${this.baseUrl}/job/${encodeURIComponent(name)}/buildWithParameters`;
      }
      
      await axios.post(
        url,
        params,
        {
          auth: {
            username: this.username,
            password: this.apiToken
          }
        }
      );
      
      // Wait a bit for the build to start
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get the updated pipeline
      return this.getPipeline(name);
    } catch (error) {
      console.error(`Failed to trigger Jenkins job ${name}:`, error);
      throw error;
    }
  }

  /**
   * Cancels a pipeline
   * @param id Pipeline ID (job name)
   */
  async cancelPipeline(id: string): Promise<void> {
    try {
      // Get the current build number
      const pipeline = await this.getPipeline(id);
      
      if (pipeline.status === 'running') {
        // Extract the build number from the URL
        const buildUrl = pipeline.url;
        const buildNumber = buildUrl.split('/').filter(Boolean).pop();
        
        // Stop the build
        await axios.post(
          `${this.baseUrl}/job/${encodeURIComponent(id)}/${buildNumber}/stop`,
          {},
          {
            auth: {
              username: this.username,
              password: this.apiToken
            }
          }
        );
      } else {
        console.warn(`Jenkins job ${id} is not running, cannot cancel`);
      }
    } catch (error) {
      console.error(`Failed to cancel Jenkins job ${id}:`, error);
      throw error;
    }
  }

  /**
   * Maps a Jenkins job to our Pipeline interface
   * @param jenkinsJob Jenkins job object
   * @returns Mapped Pipeline object
   * @private
   */
  private mapJenkinsJobToPipeline(jenkinsJob: any): Pipeline {
    const lastBuild = jenkinsJob.lastBuild;
    
    if (!lastBuild) {
      return {
        id: jenkinsJob.name,
        name: jenkinsJob.name,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        url: jenkinsJob.url
      };
    }
    
    let status: Pipeline['status'] = 'pending';
    
    if (lastBuild.building) {
      status = 'running';
    } else if (lastBuild.result === 'SUCCESS') {
      status = 'success';
    } else if (lastBuild.result === 'FAILURE' || lastBuild.result === 'ABORTED') {
      status = 'failed';
    }
    
    return {
      id: jenkinsJob.name,
      name: jenkinsJob.name,
      status,
      createdAt: lastBuild.timestamp,
      updatedAt: lastBuild.timestamp, // Jenkins doesn't provide an updated timestamp
      url: lastBuild.url
    };
  }
}
