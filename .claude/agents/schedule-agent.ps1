param([switch]$Remove)

$apiKey = [System.Environment]::GetEnvironmentVariable("ANTHROPIC_API_KEY", "User")
if (-not $apiKey) {
    Write-Error "ANTHROPIC_API_KEY not found. Set it first."
    exit 1
}

$pythonPath  = (Get-Command python).Source
$agentScript = "C:\Users\Jaylen.Davis\OneDrive - Southwestern College\Desktop\DoWhatever\.claude\agents\agent.py"

$tasks = @(
    @{ Project = "Ranch-Pad"; Hour = 8; Minute = 0  },
    @{ Project = "pjroutes";  Hour = 8; Minute = 10 }
)

foreach ($t in $tasks) {
    $name    = "ClaudeAgent-$($t.Project)"
    $timeStr = "$('{0:D2}' -f $t.Hour):$('{0:D2}' -f $t.Minute)"
    $batPath = "C:\Users\Jaylen.Davis\AppData\Local\Temp\claude-agent-$($t.Project).bat"

    $batContent = "@echo off`r`nset ANTHROPIC_API_KEY=$apiKey`r`nset PYTHONIOENCODING=utf-8`r`n`"$pythonPath`" `"$agentScript`" --project $($t.Project)`r`n"
    [System.IO.File]::WriteAllText($batPath, $batContent, [System.Text.Encoding]::ASCII)

    if ($Remove) {
        schtasks /delete /tn $name /f 2>$null
        Write-Host "Removed: $name"
    } else {
        schtasks /delete /tn $name /f 2>$null
        schtasks /create /tn $name /tr "`"cmd.exe`" /c `"$batPath`"" /sc daily /st $timeStr /f
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Scheduled: $name at $timeStr daily"
        } else {
            Write-Host "Failed: $name"
        }
    }
}

if (-not $Remove) {
    Write-Host ""
    Write-Host "Done. Verify in Task Scheduler or run: schtasks /query /tn ClaudeAgent-Ranch-Pad"
}
