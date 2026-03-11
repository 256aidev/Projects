sqlite3 "C:\Projects\256ai.Engine\publish\cp-win-x64\swarm.db" "SELECT TaskId, substr(Objective,1,40), FailedWorkersJson, DependsOnJson FROM Tasks WHERE Status='PENDING' LIMIT 3"
