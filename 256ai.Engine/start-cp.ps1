Set-Location "C:\Projects\256ai.Engine\publish\cp-win-x64"
Start-Process -FilePath ".\Engine.ControlPlane.exe" -WorkingDirectory "C:\Projects\256ai.Engine\publish\cp-win-x64"
Write-Host "ControlPlane started from publish\cp-win-x64"
