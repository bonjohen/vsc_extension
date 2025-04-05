import axios from 'axios';
import { Issue, IssueTrackingIntegration } from './types';

/**
 * Integration with JIRA
 */
export class JiraIntegration implements IssueTrackingIntegration {
  private baseUrl: string;
  private username: string;
  private apiToken: string;
  private project: string;

  /**
   * Creates a new JiraIntegration
   * @param baseUrl JIRA instance URL
   * @param username JIRA username
   * @param apiToken JIRA API token
   * @param project JIRA project key
   */
  constructor(baseUrl: string, username: string, apiToken: string, project: string) {
    this.baseUrl = baseUrl;
    this.username = username;
    this.apiToken = apiToken;
    this.project = project;
  }

  /**
   * Gets a list of issues
   * @param filter Filter criteria
   * @returns Array of issues
   */
  async getIssues(filter?: any): Promise<Issue[]> {
    try {
      let jql = `project = ${this.project}`;
      
      if (filter) {
        if (filter.status) jql += ` AND status = "${filter.status}"`;
        if (filter.assignee) jql += ` AND assignee = "${filter.assignee}"`;
        if (filter.labels) {
          const labelConditions = filter.labels.map((label: string) => `labels = "${label}"`).join(' OR ');
          jql += ` AND (${labelConditions})`;
        }
      }
      
      const response = await axios.get(
        `${this.baseUrl}/rest/api/3/search`,
        {
          auth: {
            username: this.username,
            password: this.apiToken
          },
          params: {
            jql,
            maxResults: 50
          }
        }
      );
      
      return response.data.issues.map(this.mapJiraIssueToIssue);
    } catch (error) {
      console.error('Failed to get JIRA issues:', error);
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
        `${this.baseUrl}/rest/api/3/issue/${id}`,
        {
          auth: {
            username: this.username,
            password: this.apiToken
          }
        }
      );
      
      return this.mapJiraIssueToIssue(response.data);
    } catch (error) {
      console.error(`Failed to get JIRA issue ${id}:`, error);
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
        `${this.baseUrl}/rest/api/3/issue`,
        {
          fields: {
            project: {
              key: this.project
            },
            summary: issue.title,
            description: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: issue.description
                    }
                  ]
                }
              ]
            },
            issuetype: {
              name: 'Task'
            },
            labels: issue.labels,
            assignee: issue.assignee ? { name: issue.assignee } : undefined
          }
        },
        {
          auth: {
            username: this.username,
            password: this.apiToken
          }
        }
      );
      
      // Get the created issue
      return this.getIssue(response.data.key);
    } catch (error) {
      console.error('Failed to create JIRA issue:', error);
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
      const updateData: any = {
        fields: {}
      };
      
      if (issue.title) updateData.fields.summary = issue.title;
      
      if (issue.description) {
        updateData.fields.description = {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: issue.description
                }
              ]
            }
          ]
        };
      }
      
      if (issue.labels) updateData.fields.labels = issue.labels;
      
      if (issue.status) {
        // This is a simplified approach; in reality, you'd need to use transitions
        // to change status in JIRA, which is more complex
        console.warn('Changing status directly is not supported in JIRA API. Use transitions instead.');
      }
      
      await axios.put(
        `${this.baseUrl}/rest/api/3/issue/${id}`,
        updateData,
        {
          auth: {
            username: this.username,
            password: this.apiToken
          }
        }
      );
      
      // Get the updated issue
      return this.getIssue(id);
    } catch (error) {
      console.error(`Failed to update JIRA issue ${id}:`, error);
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
      await axios.put(
        `${this.baseUrl}/rest/api/3/issue/${id}/assignee`,
        {
          name: assignee
        },
        {
          auth: {
            username: this.username,
            password: this.apiToken
          }
        }
      );
      
      // Get the updated issue
      return this.getIssue(id);
    } catch (error) {
      console.error(`Failed to assign JIRA issue ${id} to ${assignee}:`, error);
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
        `${this.baseUrl}/rest/api/3/issue/${id}/comment`,
        {
          body: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: comment
                  }
                ]
              }
            ]
          }
        },
        {
          auth: {
            username: this.username,
            password: this.apiToken
          }
        }
      );
    } catch (error) {
      console.error(`Failed to add comment to JIRA issue ${id}:`, error);
      throw error;
    }
  }

  /**
   * Maps a JIRA issue to our Issue interface
   * @param jiraIssue JIRA issue object
   * @returns Mapped Issue object
   * @private
   */
  private mapJiraIssueToIssue(jiraIssue: any): Issue {
    return {
      id: jiraIssue.key,
      title: jiraIssue.fields.summary,
      description: this.extractTextFromJiraDescription(jiraIssue.fields.description),
      status: jiraIssue.fields.status.name,
      assignee: jiraIssue.fields.assignee?.name,
      createdAt: new Date(jiraIssue.fields.created).getTime(),
      updatedAt: new Date(jiraIssue.fields.updated).getTime(),
      labels: jiraIssue.fields.labels || [],
      url: `${this.baseUrl}/browse/${jiraIssue.key}`
    };
  }

  /**
   * Extracts plain text from JIRA's Atlassian Document Format
   * @param description JIRA description in ADF
   * @returns Plain text description
   * @private
   */
  private extractTextFromJiraDescription(description: any): string {
    if (!description) return '';
    
    try {
      // This is a simplified extraction that works for basic ADF documents
      // A more robust solution would need to handle all ADF node types
      let text = '';
      
      if (description.content) {
        for (const contentNode of description.content) {
          if (contentNode.content) {
            for (const textNode of contentNode.content) {
              if (textNode.text) {
                text += textNode.text + ' ';
              }
            }
            text += '\n';
          }
        }
      }
      
      return text.trim();
    } catch (error) {
      console.error('Failed to extract text from JIRA description:', error);
      return '';
    }
  }
}
