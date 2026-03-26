@echo off
title DeVote - Generatore Elezioni
color 0E

echo ===================================================
echo       🗳️ POPOLAMENTO ELEZIONI IN CORSO...
echo ===================================================
echo.
echo Avvio dello script di seed...
echo.

:: Spostiamoci nella cartella backend ed eseguiamo lo script
cd backend
npm run seed

echo.
echo ===================================================
echo       ✅ DATI GENERATI CON SUCCESSO!
echo ===================================================