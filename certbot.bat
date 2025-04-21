@echo off
:menu
cls
echo ===================================================
echo Let's Encrypt Certificate Issuance Script
echo ===================================================
echo Domain: sp.wvl.co.kr
echo Email: jaesu@kakao.com
echo Certificate Path: C:\SP\certbot\conf
echo.
echo Please select issuance method:
echo [1] HTTP-01 Challenge (Recommended)
echo [2] DNS-01 Challenge
echo [3] Staging Test
echo [4] Clean Cache
echo [5] Exit
echo.
set /p choice=Select (1-5): 

if "%choice%"=="1" goto http01
if "%choice%"=="2" goto dns01
if "%choice%"=="3" goto staging
if "%choice%"=="4" goto clean
if "%choice%"=="5" goto end

:http01
docker run --rm -p 80:80 -v "%CD%\certbot\conf:/etc/letsencrypt" certbot/certbot certonly --standalone -d sp.wvl.co.kr --agree-tos --email jaesu@kakao.com --no-eff-email
goto menu

:dns01
docker run --rm -it -v "%CD%\certbot\conf:/etc/letsencrypt" certbot/certbot certonly --manual --preferred-challenges dns -d sp.wvl.co.kr --agree-tos --email jaesu@kakao.com --no-eff-email
goto menu

:staging
docker run --rm -p 80:80 -v "%CD%\certbot\conf:/etc/letsencrypt" certbot/certbot certonly --standalone -d sp.wvl.co.kr --staging --agree-tos --email jaesu@kakao.com --no-eff-email
goto menu

:clean
echo Cleaning certificate cache...
rd /s /q "C:\SP\certbot\conf\archive" 2>nul
rd /s /q "C:\SP\certbot\conf\live" 2>nul
rd /s /q "C:\SP\certbot\conf\renewal" 2>nul
echo Cache cleaned successfully!
timeout /t 2 > nul
goto menu

:end
echo.
echo Process completed.
exit 