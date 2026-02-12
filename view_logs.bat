@echo off
echo ============================================================
echo SkillSync Centralized Log Viewer
echo ============================================================
echo.
echo [1] View Backend Combined Logs
echo [2] View Backend Error Logs
echo [3] View AI Service Logs
echo [4] Exit
echo.
set /p choice="Select an option (1-4): "

if "%choice%"=="1" (
    powershell -Command "Get-Content -Path d:\SkillSync\logs\backend-combined-*.log -Wait -Tail 50"
) else if "%choice%"=="2" (
    powershell -Command "Get-Content -Path d:\SkillSync\logs\backend-error-*.log -Wait -Tail 50"
) else if "%choice%"=="3" (
    powershell -Command "Get-Content -Path d:\SkillSync\logs\ai_service.log -Wait -Tail 50"
) else if "%choice%"=="4" (
    exit
) else (
    echo Invalid choice.
    pause
    cls
    goto start
)
