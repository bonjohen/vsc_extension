import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  test('Sample test', () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });

  test('Extension should register commands', async () => {
    // Get all commands
    const commands = await vscode.commands.getCommands();

    // Check if our command is registered
    assert.ok(commands.includes('augment-readme-creator.createReadme'));
  });
});
