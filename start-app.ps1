# 设置工作目录
Set-Location -Path "D:\project\File Transfer Application"

# 运行npm命令
npm run s

# 如果发生错误,暂停显示
if ($LASTEXITCODE -ne 0) {
    Write-Host "执行过程中发生错误,按任意键退出..." -ForegroundColor Red
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
}
