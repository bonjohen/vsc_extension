import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    console.log('Augment README Creator is now active!');

    // Register the command to create a README file
    let disposable = vscode.commands.registerCommand('augment-readme-creator.createReadme', async () => {
        try {
            // Get the workspace folder
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage('No workspace folder is open. Please open a folder first.');
                return;
            }

            const workspaceRoot = workspaceFolders[0].uri.fsPath;
            const readmePath = path.join(workspaceRoot, 'test_readme.md');

            // Check if test_readme.md already exists
            if (fs.existsSync(readmePath)) {
                const overwrite = await vscode.window.showWarningMessage(
                    'test_readme.md already exists. Do you want to overwrite it?',
                    'Yes', 'No'
                );

                if (overwrite !== 'Yes') {
                    return;
                }
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

            // Show progress notification
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Creating README with Augment',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });

                // Focus Augment panel
                await vscode.commands.executeCommand('vscode-augment.focusAugmentPanel');
                progress.report({ increment: 20 });

                // Start a new chat
                await vscode.commands.executeCommand('vscode-augment.startNewChat');
                progress.report({ increment: 40 });

                // Get the list of files in the project (limit to 10 for simplicity)
                const files = fs.readdirSync(workspaceRoot)
                    .filter(file => !file.startsWith('.') && !file.startsWith('node_modules'))
                    .slice(0, 10);

                // Create the prompt for Augment
                const prompt = `Create a comprehensive README.md file for my project with the following details:

Project Name: ${projectName}
Description: ${projectDescription}
Files in project: ${files.join(', ')}

The README should include:
1. A title and brief description
2. Installation instructions
3. Usage examples
4. Features
5. License information
6. Any other relevant sections

Please format it in Markdown. Start your response with "# ${projectName}" and end it with "## License".`;

                // Send the prompt to Augment
                await vscode.commands.executeCommand('vscode-augment.chat', prompt);
                progress.report({ increment: 60 });

                // Wait for Augment to process (this is a simple delay, not ideal but works for demo)
                await new Promise(resolve => setTimeout(resolve, 10000));
                progress.report({ increment: 80 });

                // Show options to the user
                const action = await vscode.window.showInformationMessage(
                    'README content generated! What would you like to do?',
                    'Create Test README', 'Copy from Augment', 'Cancel'
                );

                if (action === 'Create Test README') {
                    // Create the README content
                    const readmeContent = `# ${projectName}\n\n${projectDescription ? projectDescription + '\n\n' : ''}## Installation\n\n\`\`\`bash\nnpm install ${projectName}\n\`\`\`\n\n## Usage\n\n\`\`\`javascript\n// Example usage code\n\`\`\`\n\n## Features\n\n- Feature 1\n- Feature 2\n- Feature 3\n\n## License\n\nMIT`;

                    // Save the content directly to test_readme.md
                    fs.writeFileSync(readmePath, readmeContent);

                    // Open the file in the editor
                    const document = await vscode.workspace.openTextDocument(readmePath);
                    await vscode.window.showTextDocument(document);

                    vscode.window.showInformationMessage(
                        `Successfully created test_readme.md at ${readmePath}`,
                        'OK'
                    );
                } else if (action === 'Copy from Augment') {
                    // Provide instructions for copying from Augment
                    vscode.window.showInformationMessage(
                        'Please copy the content from Augment chat and paste it into test_readme.md file',
                        'OK'
                    );
                }

                progress.report({ increment: 100 });
                return;
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Error creating README: ${error}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
