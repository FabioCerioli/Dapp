@echo off
title DeVote - Startup Automatica
color 0A

echo AVVIO AMBIENTE IN CORSO...

echo.
echo [1/5] Reset dei dati backend...
start "Reset Backend Server" cmd /c "cd backend && npm run clean:all"


echo.
echo [2/5] Avvio del nodo Hardhat (Blockchain locale)...
start "Hardhat Node" cmd /k "npx hardhat node"

echo ⏳ Attendo 5 secondi per l'inizializzazione del nodo...
timeout /t 5 /nobreak > NUL

echo.
echo [3/5] Esecuzione del deploy dello Smart Contract...
start "Deploy Contract" cmd /c "npx hardhat run scripts/deploy.ts --network localhost & pause"

echo.
echo [4/5] Avvio del Server Backend...
start "Backend Server" cmd /k "cd backend && node server.js"

echo.
echo [5/5] Avvio del Frontend React/Vite...
start "Frontend React" cmd /k "cd frontend && npm run dev"

echo.

echo TUTTO AVVIATO
echo Puoi chiudere questa finestra. I terminali rimarranno aperti.
pause > NUL