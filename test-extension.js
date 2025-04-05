const fs = require('fs');
const path = require('path');

// Simulate the extension's functionality
function createTestReadme() {
    console.log('Creating test_readme.md...');
    
    // Get project information
    const workspaceRoot = process.cwd();
    const readmePath = path.join(workspaceRoot, 'test_readme.md');
    
    // Check if test_readme.md already exists
    if (fs.existsSync(readmePath)) {
        console.log('test_readme.md already exists. Overwriting...');
    }
    
    // Get project information
    const packageJsonPath = path.join(workspaceRoot, 'package.json');
    let projectName = path.basename(workspaceRoot);
    let projectDescription = '';
    
    if (fs.existsSync(packageJsonPath)) {
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            projectName = packageJson.name || projectName;
            projectDescription = packageJson.description || '';
        } catch (err) {
            console.error('Error reading package.json:', err);
        }
    }
    
    // Get the list of files in the project (limit to 10 for simplicity)
    const files = fs.readdirSync(workspaceRoot)
        .filter(file => !file.startsWith('.') && !file.startsWith('node_modules'))
        .slice(0, 10);
    
    console.log('Project information:');
    console.log(`- Name: ${projectName}`);
    console.log(`- Description: ${projectDescription}`);
    console.log(`- Files: ${files.join(', ')}`);
    
    // Create the README content
    const readmeContent = `# ${projectName}

${projectDescription ? projectDescription + '\n\n' : ''}## Installation

\`\`\`bash
npm install ${projectName}
\`\`\`

## Usage

\`\`\`javascript
// Example usage code
\`\`\`

## Features

- Feature 1: Programmatically controls the Augment extension
- Feature 2: Creates README files using AI-generated content
- Feature 3: Saves files directly to the file system

## License

MIT`;
    
    // Save the content directly to test_readme.md
    fs.writeFileSync(readmePath, readmeContent);
    
    console.log(`Successfully created test_readme.md at ${readmePath}`);
    console.log('Content:');
    console.log('-----------------------------------');
    console.log(readmeContent);
    console.log('-----------------------------------');
}

// Run the function
createTestReadme();
