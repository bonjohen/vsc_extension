# Manual Testing Guide for Augment README Creator Extension

Since automated testing requires downloading VS Code and the Augment extension, which can be complex in this environment, here's a manual testing guide to verify the extension's functionality.

## Prerequisites

1. VS Code installed
2. Augment extension installed and configured
3. The Augment README Creator extension installed (can be done by opening the extension folder in VS Code and pressing F5)

## Test Cases

### Test Case 1: Extension Activation

**Steps:**
1. Open VS Code
2. Open the Command Palette (Ctrl+Shift+P)
3. Type "Create README with Augment"
4. Verify that the command appears in the list

**Expected Result:**
- The command "Create README with Augment" should be visible in the Command Palette

### Test Case 2: No Workspace Folder Open

**Steps:**
1. Close any open folders in VS Code
2. Open the Command Palette (Ctrl+Shift+P)
3. Run the "Create README with Augment" command

**Expected Result:**
- An error message should appear: "No workspace folder is open. Please open a folder first."

### Test Case 3: README Already Exists

**Steps:**
1. Open a folder in VS Code that contains a README.md file
2. Open the Command Palette (Ctrl+Shift+P)
3. Run the "Create README with Augment" command

**Expected Result:**
- A warning message should appear: "README.md already exists. Do you want to overwrite it?"
- Clicking "No" should cancel the operation
- Clicking "Yes" should proceed with generating a new README

### Test Case 4: Generate README with Augment

**Steps:**
1. Open a folder in VS Code that does not contain a README.md file
2. Open the Command Palette (Ctrl+Shift+P)
3. Run the "Create README with Augment" command

**Expected Result:**
- The Augment panel should open
- A new chat should start
- A prompt should be sent to Augment asking it to create a README
- After a few seconds, a message should appear with options: "Create Template README", "Copy from Augment", or "Cancel"

### Test Case 5: Create Template README

**Steps:**
1. Follow the steps in Test Case 4
2. When the options appear, click "Create Template README"

**Expected Result:**
- A new untitled document should open with a template README
- The template should include the project name and basic sections

### Test Case 6: Copy from Augment

**Steps:**
1. Follow the steps in Test Case 4
2. When the options appear, click "Copy from Augment"

**Expected Result:**
- A message should appear instructing you to copy the content from Augment chat

## Verification

For each test case, verify that:
1. The UI behaves as expected
2. Error messages are clear and helpful
3. The extension interacts correctly with Augment
4. The generated README content is appropriate for the project

## Notes

- The extension depends on the Augment extension, so make sure it's installed and working
- The extension uses a timeout to wait for Augment to generate content, which might need adjustment based on your system's performance
- The extension cannot directly capture Augment's response, so manual copying is required in some cases
