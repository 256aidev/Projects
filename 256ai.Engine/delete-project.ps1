$dllPath = "C:\Projects\256ai.Engine\publish\cp-win-x64\Microsoft.Data.Sqlite.dll"
Add-Type -Path $dllPath
$conn = New-Object Microsoft.Data.Sqlite.SqliteConnection("Data Source=C:\Projects\256ai.Engine\publish\cp-win-x64\engine.db")
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "DELETE FROM Tasks WHERE ProjectId = 'cb0475e9-b035-42ac-908d-d2566ab05c7d'"
$r1 = $cmd.ExecuteNonQuery()
Write-Output "Deleted $r1 tasks"
$cmd.CommandText = "DELETE FROM Projects WHERE ProjectId = 'cb0475e9-b035-42ac-908d-d2566ab05c7d'"
$r2 = $cmd.ExecuteNonQuery()
Write-Output "Deleted $r2 projects"
$conn.Close()
