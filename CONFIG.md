# Configuration Guide for Augment Extension Orchestration Framework

This guide explains how to configure the Augment Extension Orchestration Framework to suit your needs.

## Configuration File Location

The framework uses a configuration file located at:

- **Windows**: `%USERPROFILE%\.augment-cli\config.json`
- **macOS/Linux**: `~/.augment-cli/config.json`

The configuration file is created automatically with default values when you first run any command.

## Configuration Options

### Core Configuration (Phase 1)

| Option | Description | Default Value | Type |
|--------|-------------|---------------|------|
| `dataDir` | Directory for storing data | `~/.augment-cli/data` | String |
| `heartbeatFrequency` | Frequency of agent heartbeats in milliseconds | `5000` | Number |
| `defaultTimeout` | Default timeout for operations in milliseconds | `1800000` (30 minutes) | Number |

### Change Management Configuration (Phase 2)

| Option | Description | Default Value | Type |
|--------|-------------|---------------|------|
| `logDir` | Directory for storing logs | `~/.augment-cli/logs` | String |
| `watchPaths` | Paths to watch for changes | `[process.cwd()]` | Array of Strings |
| `watchIgnored` | Patterns to ignore when watching | `["**/node_modules/**", "**/.git/**", "**/dist/**"]` | Array of Strings |
| `gitEnabled` | Whether to enable Git integration | `true` | Boolean |

### Advanced Features Configuration (Phase 3)

| Option | Description | Default Value | Type |
|--------|-------------|---------------|------|
| `analyticsPort` | Port for the analytics dashboard | `3000` | Number |
| `notificationEnabled` | Whether to enable notifications | `true` | Boolean |
| `maxAgents` | Maximum number of agents to run simultaneously | `5` | Number |
| `specializations` | Agent specialization patterns | *(see below)* | Object |

## Modifying Configuration

### Using the CLI

The easiest way to modify the configuration is using the CLI:

```bash
# Set a single value
augment-cli config set --key dataDir --value "/custom/path/to/data"

# Set an array value
augment-cli config set --key watchIgnored --value "node_modules,dist,.git"

# Show current configuration
augment-cli config show
```

### Editing the Configuration File Directly

You can also edit the configuration file directly using a text editor:

```json
{
  "dataDir": "/custom/path/to/data",
  "logDir": "/custom/path/to/logs",
  "heartbeatFrequency": 10000,
  "defaultTimeout": 3600000,
  "watchPaths": ["/path/to/project"],
  "watchIgnored": ["**/node_modules/**", "**/.git/**", "**/dist/**"],
  "gitEnabled": true,
  "analyticsPort": 3000,
  "notificationEnabled": true,
  "maxAgents": 10
}
```

## Environment Variables

You can override configuration values using environment variables:

| Environment Variable | Configuration Option |
|----------------------|----------------------|
| `AUGMENT_DATA_DIR` | `dataDir` |
| `AUGMENT_LOG_DIR` | `logDir` |
| `AUGMENT_HEARTBEAT_FREQUENCY` | `heartbeatFrequency` |
| `AUGMENT_DEFAULT_TIMEOUT` | `defaultTimeout` |
| `AUGMENT_GIT_ENABLED` | `gitEnabled` |
| `AUGMENT_ANALYTICS_PORT` | `analyticsPort` |
| `AUGMENT_MAX_AGENTS` | `maxAgents` |

Example:

```bash
# Set environment variable
export AUGMENT_DATA_DIR="/custom/path/to/data"

# Run command with custom configuration
augment-cli queue list
```

## Advanced Configuration

### Agent Specialization Patterns

You can customize the patterns used to determine agent specializations:

```json
{
  "specializations": {
    "frontend": [
      "*.html", "*.css", "*.scss", "*.js", "*.jsx", "*.ts", "*.tsx",
      "react", "vue", "angular", "svelte", "webpack", "babel", "eslint"
    ],
    "backend": [
      "*.js", "*.ts", "*.py", "*.java", "*.go", "*.rb", "*.php", "*.cs",
      "api", "rest", "graphql", "server", "endpoint", "controller"
    ],
    "database": [
      "*.sql", "*.prisma", "*.schema", "migration",
      "database", "db", "sql", "nosql", "mongodb", "postgres", "mysql"
    ],
    "devops": [
      "Dockerfile", "docker-compose.yml", "*.yaml", "*.yml",
      "kubernetes", "k8s", "helm", "terraform", "ansible"
    ]
  }
}
```

### Integration Configuration

For integrations with external services, you can configure credentials:

```json
{
  "integrations": {
    "github": {
      "token": "your-github-token",
      "owner": "your-username",
      "repo": "your-repo"
    },
    "jira": {
      "url": "https://your-instance.atlassian.net",
      "username": "your-username",
      "token": "your-api-token",
      "project": "PROJECT"
    },
    "slack": {
      "webhook": "https://hooks.slack.com/services/your/webhook/url",
      "token": "your-slack-token"
    }
  }
}
```

**Note**: For security reasons, it's recommended to use environment variables for sensitive information rather than storing them in the configuration file.

## Configuration Profiles

You can create multiple configuration profiles for different projects:

```bash
# Create a new profile
augment-cli config create-profile --name "project-a"

# Use a specific profile
augment-cli --profile "project-a" queue list

# Set a configuration value for a specific profile
augment-cli --profile "project-a" config set --key dataDir --value "/path/to/project-a/data"
```

## Resetting Configuration

To reset the configuration to default values:

```bash
augment-cli config reset
```

## Next Steps

- [Installation Guide](INSTALL.md)
- [Getting Started Guide](README.md)
- [Sample Scripts](samples/README.md)
