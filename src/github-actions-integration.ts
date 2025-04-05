import axios from 'axios';
import { CICDIntegration, Pipeline } from './types';

/**
 * Integration with GitHub Actions
 */
export class GitHubActionsIntegration implements CICDIntegration {
  private baseUrl: string;
  private token: string;
  private owner: string;
  private repo: string;

  /**
   * Creates a new GitHubActionsIntegration
   * @param owner GitHub repository owner
   * @param repo GitHub repository name
   * @param token GitHub personal access token
   */
  constructor(owner: string, repo: string, token: string) {
    this.baseUrl = 'https://api.github.com';
    this.token = token;
    this.owner = owner;
    this.repo = repo;
  }

  /**
   * Gets a list of pipelines (workflows)
   * @returns Array of pipelines
   */
  async getPipelines(): Promise<Pipeline[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/actions/workflows`,
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );
      
      const workflows = response.data.workflows;
      const pipelines: Pipeline[] = [];
      
      // For each workflow, get the latest run
      for (const workflow of workflows) {
        const runsResponse = await axios.get(
          `${this.baseUrl}/repos/${this.owner}/${this.repo}/actions/workflows/${workflow.id}/runs`,
          {
            headers: {
              Authorization: `token ${this.token}`,
              Accept: 'application/vnd.github.v3+json'
            },
            params: {
              per_page: 1
            }
          }
        );
        
        if (runsResponse.data.total_count > 0) {
          const latestRun = runsResponse.data.workflow_runs[0];
          
          pipelines.push({
            id: workflow.id.toString(),
            name: workflow.name,
            status: this.mapGitHubStatusToPipelineStatus(latestRun.status, latestRun.conclusion),
            createdAt: new Date(latestRun.created_at).getTime(),
            updatedAt: new Date(latestRun.updated_at).getTime(),
            url: latestRun.html_url
          });
        } else {
          pipelines.push({
            id: workflow.id.toString(),
            name: workflow.name,
            status: 'pending',
            createdAt: new Date(workflow.created_at).getTime(),
            updatedAt: new Date(workflow.updated_at).getTime(),
            url: workflow.html_url
          });
        }
      }
      
      return pipelines;
    } catch (error) {
      console.error('Failed to get GitHub Actions workflows:', error);
      throw error;
    }
  }

  /**
   * Gets a specific pipeline
   * @param id Pipeline ID
   * @returns The pipeline
   */
  async getPipeline(id: string): Promise<Pipeline> {
    try {
      const workflowResponse = await axios.get(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/actions/workflows/${id}`,
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );
      
      const workflow = workflowResponse.data;
      
      const runsResponse = await axios.get(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/actions/workflows/${id}/runs`,
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json'
          },
          params: {
            per_page: 1
          }
        }
      );
      
      if (runsResponse.data.total_count > 0) {
        const latestRun = runsResponse.data.workflow_runs[0];
        
        return {
          id: workflow.id.toString(),
          name: workflow.name,
          status: this.mapGitHubStatusToPipelineStatus(latestRun.status, latestRun.conclusion),
          createdAt: new Date(latestRun.created_at).getTime(),
          updatedAt: new Date(latestRun.updated_at).getTime(),
          url: latestRun.html_url
        };
      } else {
        return {
          id: workflow.id.toString(),
          name: workflow.name,
          status: 'pending',
          createdAt: new Date(workflow.created_at).getTime(),
          updatedAt: new Date(workflow.updated_at).getTime(),
          url: workflow.html_url
        };
      }
    } catch (error) {
      console.error(`Failed to get GitHub Actions workflow ${id}:`, error);
      throw error;
    }
  }

  /**
   * Triggers a pipeline
   * @param name Pipeline name
   * @param params Parameters for the pipeline
   * @returns The triggered pipeline
   */
  async triggerPipeline(name: string, params?: any): Promise<Pipeline> {
    try {
      // First, find the workflow by name
      const workflowsResponse = await axios.get(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/actions/workflows`,
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );
      
      const workflow = workflowsResponse.data.workflows.find(
        (w: any) => w.name === name
      );
      
      if (!workflow) {
        throw new Error(`Workflow "${name}" not found`);
      }
      
      // Trigger the workflow
      const response = await axios.post(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/actions/workflows/${workflow.id}/dispatches`,
        {
          ref: 'main', // You might want to make this configurable
          inputs: params
        },
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );
      
      // GitHub doesn't return the run ID in the response, so we need to get the latest run
      // Wait a bit for the run to be created
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const runsResponse = await axios.get(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/actions/workflows/${workflow.id}/runs`,
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json'
          },
          params: {
            per_page: 1
          }
        }
      );
      
      if (runsResponse.data.total_count > 0) {
        const latestRun = runsResponse.data.workflow_runs[0];
        
        return {
          id: workflow.id.toString(),
          name: workflow.name,
          status: this.mapGitHubStatusToPipelineStatus(latestRun.status, latestRun.conclusion),
          createdAt: new Date(latestRun.created_at).getTime(),
          updatedAt: new Date(latestRun.updated_at).getTime(),
          url: latestRun.html_url
        };
      } else {
        return {
          id: workflow.id.toString(),
          name: workflow.name,
          status: 'pending',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          url: workflow.html_url
        };
      }
    } catch (error) {
      console.error(`Failed to trigger GitHub Actions workflow "${name}":`, error);
      throw error;
    }
  }

  /**
   * Cancels a pipeline
   * @param id Pipeline ID
   */
  async cancelPipeline(id: string): Promise<void> {
    try {
      // Get the latest run for the workflow
      const runsResponse = await axios.get(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/actions/workflows/${id}/runs`,
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json'
          },
          params: {
            per_page: 1
          }
        }
      );
      
      if (runsResponse.data.total_count > 0) {
        const latestRun = runsResponse.data.workflow_runs[0];
        
        // Cancel the run
        await axios.post(
          `${this.baseUrl}/repos/${this.owner}/${this.repo}/actions/runs/${latestRun.id}/cancel`,
          {},
          {
            headers: {
              Authorization: `token ${this.token}`,
              Accept: 'application/vnd.github.v3+json'
            }
          }
        );
      } else {
        throw new Error(`No runs found for workflow ${id}`);
      }
    } catch (error) {
      console.error(`Failed to cancel GitHub Actions workflow ${id}:`, error);
      throw error;
    }
  }

  /**
   * Maps GitHub status and conclusion to pipeline status
   * @param status GitHub workflow run status
   * @param conclusion GitHub workflow run conclusion
   * @returns Pipeline status
   * @private
   */
  private mapGitHubStatusToPipelineStatus(
    status: string,
    conclusion: string | null
  ): Pipeline['status'] {
    if (status === 'queued' || status === 'waiting') {
      return 'pending';
    } else if (status === 'in_progress') {
      return 'running';
    } else if (conclusion === 'success') {
      return 'success';
    } else if (conclusion === 'failure' || conclusion === 'cancelled' || conclusion === 'timed_out') {
      return 'failed';
    } else {
      return 'pending';
    }
  }
}
