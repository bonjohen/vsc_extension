import { Agent, AgentSpecialization } from './types';

/**
 * Manages agent specializations
 */
export class AgentSpecializationManager {
  private specializations: Map<AgentSpecialization, string[]> = new Map();

  /**
   * Creates a new AgentSpecializationManager
   */
  constructor() {
    // Initialize with default patterns for each specialization
    this.specializations.set('frontend', [
      '*.html', '*.css', '*.scss', '*.js', '*.jsx', '*.ts', '*.tsx',
      'react', 'vue', 'angular', 'svelte', 'webpack', 'babel', 'eslint',
      'ui', 'ux', 'responsive', 'mobile', 'desktop', 'web'
    ]);
    
    this.specializations.set('backend', [
      '*.js', '*.ts', '*.py', '*.java', '*.go', '*.rb', '*.php', '*.cs',
      'api', 'rest', 'graphql', 'server', 'endpoint', 'controller',
      'middleware', 'authentication', 'authorization', 'security'
    ]);
    
    this.specializations.set('database', [
      '*.sql', '*.prisma', '*.schema', 'migration',
      'database', 'db', 'sql', 'nosql', 'mongodb', 'postgres', 'mysql',
      'query', 'index', 'transaction', 'orm', 'entity', 'model'
    ]);
    
    this.specializations.set('devops', [
      'Dockerfile', 'docker-compose.yml', '*.yaml', '*.yml',
      'kubernetes', 'k8s', 'helm', 'terraform', 'ansible',
      'ci', 'cd', 'pipeline', 'deploy', 'build', 'test',
      'monitoring', 'logging', 'metrics', 'alert'
    ]);
  }

  /**
   * Determines the specialization for a task
   * @param description Task description
   * @param files Files involved in the task
   * @returns The determined specialization
   */
  determineSpecialization(description: string, files: string[]): AgentSpecialization {
    const scores = new Map<AgentSpecialization, number>();
    
    // Initialize scores
    scores.set('frontend', 0);
    scores.set('backend', 0);
    scores.set('database', 0);
    scores.set('devops', 0);
    scores.set('general', 0);
    
    // Score based on description
    this.scoreDescription(description, scores);
    
    // Score based on files
    this.scoreFiles(files, scores);
    
    // Find the specialization with the highest score
    let maxScore = 0;
    let bestSpecialization: AgentSpecialization = 'general';
    
    for (const [specialization, score] of scores.entries()) {
      if (score > maxScore) {
        maxScore = score;
        bestSpecialization = specialization;
      }
    }
    
    return bestSpecialization;
  }

  /**
   * Adds patterns for a specialization
   * @param specialization Specialization to add patterns for
   * @param patterns Patterns to add
   */
  addPatterns(specialization: AgentSpecialization, patterns: string[]): void {
    const existingPatterns = this.specializations.get(specialization) || [];
    this.specializations.set(specialization, [...existingPatterns, ...patterns]);
  }

  /**
   * Gets patterns for a specialization
   * @param specialization Specialization to get patterns for
   * @returns Array of patterns
   */
  getPatterns(specialization: AgentSpecialization): string[] {
    return this.specializations.get(specialization) || [];
  }

  /**
   * Scores a description based on specialization patterns
   * @param description Description to score
   * @param scores Map of scores to update
   * @private
   */
  private scoreDescription(description: string, scores: Map<AgentSpecialization, number>): void {
    const lowerDescription = description.toLowerCase();
    
    for (const [specialization, patterns] of this.specializations.entries()) {
      for (const pattern of patterns) {
        if (lowerDescription.includes(pattern.toLowerCase())) {
          scores.set(specialization, scores.get(specialization)! + 1);
        }
      }
    }
  }

  /**
   * Scores files based on specialization patterns
   * @param files Files to score
   * @param scores Map of scores to update
   * @private
   */
  private scoreFiles(files: string[], scores: Map<AgentSpecialization, number>): void {
    for (const file of files) {
      const lowerFile = file.toLowerCase();
      
      for (const [specialization, patterns] of this.specializations.entries()) {
        for (const pattern of patterns) {
          if (pattern.startsWith('*.')) {
            // Extension pattern
            const extension = pattern.substring(1); // Remove the *
            if (lowerFile.endsWith(extension)) {
              scores.set(specialization, scores.get(specialization)! + 2); // Higher weight for file extensions
            }
          } else if (lowerFile.includes(pattern.toLowerCase())) {
            scores.set(specialization, scores.get(specialization)! + 1);
          }
        }
      }
    }
  }
}
