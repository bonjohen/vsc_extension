import * as notifier from 'node-notifier';
import { NotificationIntegration } from './types';

/**
 * Desktop notification integration
 */
export class DesktopNotification implements NotificationIntegration {
  private appName: string;

  /**
   * Creates a new DesktopNotification
   * @param appName Name of the application
   */
  constructor(appName: string = 'Augment CLI') {
    this.appName = appName;
  }

  /**
   * Sends a notification
   * @param message Message to send
   * @param channel Optional category for the notification
   */
  async sendNotification(message: string, channel?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      notifier.notify(
        {
          title: channel ? `${this.appName} - ${channel}` : this.appName,
          message,
          sound: true,
          wait: false
        },
        (err) => {
          if (err) {
            console.error('Failed to send desktop notification:', err);
            reject(err);
          } else {
            console.log('Sent desktop notification');
            resolve();
          }
        }
      );
    });
  }

  /**
   * Sends a direct message to a user
   * @param message Message to send
   * @param user User to send to
   */
  async sendDirectMessage(message: string, user: string): Promise<void> {
    // For desktop notifications, we don't have the concept of users
    // So we'll just send a regular notification with the user in the title
    return new Promise((resolve, reject) => {
      notifier.notify(
        {
          title: `${this.appName} - Message for ${user}`,
          message,
          sound: true,
          wait: false
        },
        (err) => {
          if (err) {
            console.error('Failed to send desktop notification:', err);
            reject(err);
          } else {
            console.log(`Sent desktop notification for user ${user}`);
            resolve();
          }
        }
      );
    });
  }
}
