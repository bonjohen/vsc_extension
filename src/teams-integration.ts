import axios from 'axios';
import { NotificationIntegration } from './types';

/**
 * Integration with Microsoft Teams
 */
export class TeamsIntegration implements NotificationIntegration {
  private webhookUrls: Map<string, string>;
  private defaultWebhookUrl: string;

  /**
   * Creates a new TeamsIntegration
   * @param defaultWebhookUrl Default Teams webhook URL
   * @param channelWebhooks Map of channel names to webhook URLs
   */
  constructor(defaultWebhookUrl: string, channelWebhooks?: Record<string, string>) {
    this.defaultWebhookUrl = defaultWebhookUrl;
    this.webhookUrls = new Map<string, string>();
    
    if (channelWebhooks) {
      for (const [channel, url] of Object.entries(channelWebhooks)) {
        this.webhookUrls.set(channel, url);
      }
    }
  }

  /**
   * Sends a notification to a channel
   * @param message Message to send
   * @param channel Channel to send to (uses default webhook if not specified)
   */
  async sendNotification(message: string, channel?: string): Promise<void> {
    try {
      const webhookUrl = channel && this.webhookUrls.has(channel)
        ? this.webhookUrls.get(channel)!
        : this.defaultWebhookUrl;
      
      // Create a simple Teams message card
      const payload = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "summary": "Notification from Augment CLI",
        "themeColor": "0078D7",
        "sections": [
          {
            "text": message
          }
        ]
      };
      
      await axios.post(webhookUrl, payload);
      
      console.log(`Sent Teams notification${channel ? ` to ${channel}` : ''}`);
    } catch (error) {
      console.error('Failed to send Teams notification:', error);
      throw error;
    }
  }

  /**
   * Sends a direct message to a user
   * @param message Message to send
   * @param user User email or ID
   */
  async sendDirectMessage(message: string, user: string): Promise<void> {
    // Microsoft Teams doesn't have a simple API for sending direct messages
    // This would typically require using the Microsoft Graph API with proper authentication
    // For simplicity, we'll just log a warning
    console.warn('Direct messages are not supported in the Teams integration');
    console.warn(`Would have sent to ${user}: ${message}`);
    
    throw new Error('Direct messages are not supported in the Teams integration');
  }

  /**
   * Adds a channel webhook URL
   * @param channel Channel name
   * @param webhookUrl Webhook URL for the channel
   */
  addChannelWebhook(channel: string, webhookUrl: string): void {
    this.webhookUrls.set(channel, webhookUrl);
  }
}
