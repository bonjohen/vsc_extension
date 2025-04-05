import axios from 'axios';
import { Issue, IssueTrackingIntegration } from './types';

/**
 * Integration with GitHub Issues
 */
export class GitHubIssuesIntegration implements IssueTrackingIntegration {
  private baseUrl: string;
  private token: string;
  private owner: string;
  private repo: string;

  /**
   * Creates a new GitHubIssuesIntegration
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
   * Gets a list of issues
   * @param filter Filter criteria
   * @returns Array of issues
   */
  async getIssues(filter?: any): Promise<Issue[]> {
    try {
      const params = new URLSearchParams();
      
      if (filter) {
        if (filter.state) params.append('state', filter.state);
        if (filter.labels) params.append('labels', filter.labels.join(','));
        if (filter.assignee) params.append('assignee', filter.assignee);
      }
      
      const response = await axios.get(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/issues`,
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json'
          },
          params
        }
      );
      
      return response.data.map(this.mapGitHubIssueToIssue);
    } catch (error) {
      console.error('Failed to get GitHub issues:', error);
      throw error;
    }
  }

  /**
   * Gets a specific issue
   * @param id Issue ID
   * @returns The issue
   */
  async getIssue(id: string): Promise<Issue> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/issues/${id}`,
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );
      
      return this.mapGitHubIssueToIssue(response.data);
    } catch (error) {
      console.error(`Failed to get GitHub issue ${id}:`, error);
      throw error;
    }
  }

  /**
   * Creates a new issue
   * @param issue Issue to create
   * @returns The created issue
   */
  async createIssue(issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>): Promise<Issue> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/issues`,
        {
          title: issue.title,
          body: issue.description,
          labels: issue.labels,
          assignees: issue.assignee ? [issue.assignee] : undefined
        },
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );
      
      return this.mapGitHubIssueToIssue(response.data);
    } catch (error) {
      console.error('Failed to create GitHub issue:', error);
      throw error;
    }
  }

  /**
   * Updates an issue
   * @param id Issue ID
   * @param issue Issue data to update
   * @returns The updated issue
   */
  async updateIssue(id: string, issue: Partial<Issue>): Promise<Issue> {
    try {
      const response = await axios.patch(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/issues/${id}`,
        {
          title: issue.title,
          body: issue.description,
          state: issue.status,
          labels: issue.labels
        },
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );
      
      return this.mapGitHubIssueToIssue(response.data);
    } catch (error) {
      console.error(`Failed to update GitHub issue ${id}:`, error);
      throw error;
    }
  }

  /**
   * Assigns an issue to a user
   * @param id Issue ID
   * @param assignee Username to assign to
   * @returns The updated issue
   */
  async assignIssue(id: string, assignee: string): Promise<Issue> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/issues/${id}/assignees`,
        {
          assignees: [assignee]
        },
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );
      
      return this.mapGitHubIssueToIssue(response.data);
    } catch (error) {
      console.error(`Failed to assign GitHub issue ${id} to ${assignee}:`, error);
      throw error;
    }
  }

  /**
   * Adds a comment to an issue
   * @param id Issue ID
   * @param comment Comment text
   */
  async addComment(id: string, comment: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/issues/${id}/comments`,
        {
          body: comment
        },
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );
    } catch (error) {
      console.error(`Failed to add comment to GitHub issue ${id}:`, error);
      throw error;
    }
  }

  /**
   * Maps a GitHub issue to our Issue interface
   * @param githubIssue GitHub issue object
   * @returns Mapped Issue object
   * @private
   */
  private mapGitHubIssueToIssue(githubIssue: any): Issue {
    return {
      id: githubIssue.number.toString(),
      title: githubIssue.title,
      description: githubIssue.body || '',
      status: githubIssue.state,
      assignee: githubIssue.assignee?.login,
      createdAt: new Date(githubIssue.created_at).getTime(),
      updatedAt: new Date(githubIssue.updated_at).getTime(),
      labels: githubIssue.labels.map((label: any) => label.name),
      url: githubIssue.html_url
    };
  }
}
