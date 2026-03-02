@echo off
echo Resetting SkillSync Database...
cd skillsyncBackEnd
npm run reset-db
echo.
pause
