#!pwsh -NoProfile -NoLogo

# Change to the client directory and generate types
Set-Location .\client
supabase gen types typescript --local > .\src\lib\supabase\database.ts

# Change to the server directory and generate types
Set-Location ..\server
supabase gen types typescript --local > .\src\lib\supabase\database.ts

# Change back to the root directory
Set-Location ..\
