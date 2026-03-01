# Register Scheduled Task for Control Plane
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-ExecutionPolicy Bypass -WindowStyle Hidden -File "I:\2026CodeProjects\256ai.Engine\scripts\start-controlplane.ps1"'
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -TaskName '256ai Engine Control Plane' -Action $action -Trigger $trigger -Principal $principal -Description 'Starts the 256ai Engine Control Plane at boot' -Force
Write-Host "Scheduled task '256ai Engine Control Plane' registered successfully!"
