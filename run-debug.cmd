@echo off
CD C:\Users\josep\git\fm-dx-webserver
rem chama npm para garantir que o controle volte ao batch após a execução
call npm run debug

echo.
echo Processo finalizado. Pressione qualquer tecla para fechar...
pause >nul
