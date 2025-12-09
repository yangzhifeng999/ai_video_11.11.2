# 自动提交脚本 - 用于 Windows 任务计划程序
# 设置工作目录为脚本所在目录的父目录
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectPath = Split-Path -Parent $scriptPath
Set-Location $projectPath

# 创建日志目录（如果不存在）
$logDir = Join-Path $projectPath "logs"
if (!(Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force
}

# 记录开始执行
$logFile = Join-Path $projectPath "logs\auto-commit-task.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $logFile -Value "[$timestamp] ===== 开始执行自动提交 ====="

try {
    # 检查是否有未提交的更改
    $status = git status --porcelain
    if ($status) {
        Add-Content -Path $logFile -Value "[$timestamp] 发现未提交的更改，开始提交..."

        # 添加所有更改
        git add -A
        Add-Content -Path $logFile -Value "[$timestamp] 已添加所有更改到暂存区"

        # 生成提交信息（包含时间戳）
        $commitMessage = "chore: 自动保存 - $timestamp"
        git commit -m $commitMessage
        Add-Content -Path $logFile -Value "[$timestamp] 提交成功: $commitMessage"

        # 显示提交统计
        $commitInfo = git show --stat --oneline -1
        Add-Content -Path $logFile -Value "[$timestamp] 提交详情: $commitInfo"
    } else {
        Add-Content -Path $logFile -Value "[$timestamp] 没有发现新的更改，跳过提交"
    }

    Add-Content -Path $logFile -Value "[$timestamp] ===== 自动提交执行完成 ====="
} catch {
    $errorMessage = $_.Exception.Message
    Add-Content -Path $logFile -Value "[$timestamp] 错误: $errorMessage"
    Add-Content -Path $logFile -Value "[$timestamp] ===== 自动提交执行失败 ====="
}

