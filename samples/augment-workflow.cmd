@echo off
REM augment-workflow.cmd - Example script for Augment CLI workflow

REM Set variables
set TASK_ID=task-%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set AGENT_ID=agent-%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set TASK_TITLE=Refactor authentication module
set TASK_DESCRIPTION=Improve the authentication module by implementing JWT tokens and adding refresh token support

echo Starting Augment CLI workflow...
echo Task ID: %TASK_ID%
echo Agent ID: %AGENT_ID%

REM Step 1: Add a task to the queue
echo Adding task to queue...
call augment-cli queue add --id "%TASK_ID%" --title "%TASK_TITLE%" --description "%TASK_DESCRIPTION%" --priority high

REM Step 2: Start an agent to work on the task
echo Starting agent...
call augment-cli agent start --task-id "%TASK_ID%" --id "%AGENT_ID%" --specialization backend

REM Step 3: Start watching for changes
echo Starting file watcher...
start /b augment-cli watch start --task-id "%TASK_ID%" --agent-id "%AGENT_ID%" --path "./src"
set WATCHER_PID=%ERRORLEVEL%

REM Step 4: Wait for the agent to complete the task
echo Waiting for agent to complete the task...
call augment-cli agent wait --id "%AGENT_ID%" --timeout 600

REM Step 5: Stop the file watcher
echo Stopping file watcher...
taskkill /PID %WATCHER_PID% /F

REM Step 6: List changes made by the agent
echo Listing changes...
call augment-cli changes list --task-id "%TASK_ID%"

REM Step 7: Review changes interactively
echo Starting interactive review...
call augment-cli changes review --task-id "%TASK_ID%" --approver "John Doe"

REM Step 8: Generate an audit report
echo Generating audit report...
if not exist "reports" mkdir reports
call augment-cli audit report --task-id "%TASK_ID%" --output "./reports/%TASK_ID%-audit.md"

REM Step 9: Notify the team about the completed task
echo Sending notification...
call augment-cli notify slack --webhook "%SLACK_WEBHOOK_URL%" --message "Task %TASK_TITLE% has been completed and changes have been approved." --channel "dev-team"

REM Step 10: Add metrics to the analytics dashboard
echo Adding metrics...
call augment-cli analytics add-metric --name "operation_success" --value 1 --unit "boolean"

echo Workflow completed successfully!
pause
