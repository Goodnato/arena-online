@echo off
cd /d "%~dp0servidor"
rem regenera os arquivos do online a partir do jogo.html (modos e desenho)
node montar.js
echo.
echo Arena online em http://localhost:3000  (feche esta janela para desligar)
node servidor.js
pause
