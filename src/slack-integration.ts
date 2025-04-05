import axios from 'axios';
import { NotificationIntegration } from './types';

/**
 * Integration with Slack
 */
export class SlackIntegration implements NotificationIntegration {
  private webhookUrl: string;
  private token?: string;

  /**
   * Creates a new SlackIntegration
   * @param webhookUrl Slack webhook URL for sending messages
   * @param token Slack API token (required for direct messages)
   */
  constructor(webhookUrl: string, token?: string) {
    this.webhookUrl = webhookUrl;
    this.token = token;
  }

  /**
   * Sends a notification to a channel
   * @param message Message to send
   * @param channel Channel to send to (defaults to the webhook's channel)
   */
  async sendNotification(message: string, channel?: string): Promise<void> {
    try {
      const payload: any = {
        text: message
      };
      
      if (channel) {
        payload.channel = channel;
      }
      
      await axios.post(this.webhookUrl, payload);
      
      console.log(`Sent Slack notification${channel ? ` to ${channel}` : ''}`);
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      throw error;
    }
  }

  /**
   * Sends a direct message to a user
   * @param message Message to send
   * @param user User ID to send to
   */
  async sendDirectMessage(message: string, user: string): Promise<void> {
    if (!this.token) {
      throw new Error('Slack API token is required for sending direct messages');
    }
    
    try {
      // Open a DM channel with the user
      const channelResponse = await axios.post(
        'https://slack.com/api/conversations.open',
        {
          users: user
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!channelResponse.data.ok) {
        throw new Error(`Failed to open DM channel: ${channelResponse.data.error}`);
      }
      
      const channelId = channelResponse.data.channel.id;
      
      // Send the message to the DM channel
      const messageResponse = await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: channelId,
          text: message
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!messageResponse.data.ok) {
        throw new Error(`Failed to send DM: ${messageResponse.data.error}`);
      }
      
      console.log(`Sent Slack DM to user ${user}`);
    } catch (error) {
      console.error('Failed to send Slack direct message:', error);
      throw error;
    }
  }
}
