import * as fs from 'fs-extra';
import * as path from 'path';
import { StorageProvider } from './types';

/**
 * File-based storage provider
 */
export class FileStorageProvider implements StorageProvider {
  /**
   * Creates a new FileStorageProvider
   * @param storagePath Path to the storage directory
   */
  constructor(private storagePath: string) {
    fs.ensureDirSync(this.storagePath);
  }
  
  /**
   * Loads data from storage
   * @param key Key to load
   * @returns The loaded data or null if not found
   */
  async load(key: string): Promise<any> {
    const filePath = path.join(this.storagePath, `${key}.json`);
    
    try {
      if (await fs.pathExists(filePath)) {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error(`Error loading data for key ${key}:`, error);
      return null;
    }
  }
  
  /**
   * Saves data to storage
   * @param key Key to save under
   * @param data Data to save
   */
  async save(key: string, data: any): Promise<void> {
    const filePath = path.join(this.storagePath, `${key}.json`);
    
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error(`Error saving data for key ${key}:`, error);
      throw error;
    }
  }
}
