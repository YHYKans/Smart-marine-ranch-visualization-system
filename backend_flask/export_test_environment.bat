@echo off
setlocal

set FORMAT=%1
if "%FORMAT%"=="" set FORMAT=markdown

set OUTPUT_FILE=test_environment_report.%FORMAT%

curl -s "http://localhost:3001/api/test-environment?format=%FORMAT%" > %OUTPUT_FILE%

echo 测试环境报告已导出到: %OUTPUT_FILE%

if "%FORMAT%"=="html" (
    start %OUTPUT_FILE%
)

endlocal