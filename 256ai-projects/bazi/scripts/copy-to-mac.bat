@echo off
echo ============================================
echo   STARTING COPY TO MAC
echo   %date% %time%
echo ============================================
echo.

scp -r "I:\2026CodeProjects\BaZi\BaziMobileApp" "mark lombardi"@10.0.0.143:~/Documents/

echo.
if %errorlevel%==0 (
    echo ============================================
    echo   COPY COMPLETE!
    echo   %date% %time%
    echo ============================================
) else (
    echo ============================================
    echo   COPY FAILED!
    echo   %date% %time%
    echo ============================================
)
echo.
pause
