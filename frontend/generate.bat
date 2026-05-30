@echo off
setlocal enabledelayedexpansion

:: ==========================================================
::  AppForge Generate Menu - Mini Inventory
::  Generate halaman per payload secara interaktif.
::
::  Cara pakai:
::    1. Double-click file ini, atau
::    2. Buka terminal di folder frontend lalu jalankan:
::       > generate.bat
::
::  Setiap pilihan akan menjalankan satu command generate.
::  Setelah selesai, menu kembali muncul untuk pilihan berikutnya.
:: ==========================================================

:: ----------------------------------------------------------
::  Konfigurasi command appforge
::  - Default: pakai binary installer (`appforge` di PATH)
::  - Switch ke source code dengan UNCOMMENT baris kedua
::    (misal saat testing fitur development yang belum di-build)
:: ----------------------------------------------------------
set "APPFORGE=appforge"
:: set "APPFORGE=python D:/workspace/03_projects/app-framework/appforge.py"

set "PAYLOAD_DIR=payload"
set "OUTPUT_DIR=./mini-inventory"

:: ----------------------------------------------------------
::  Konfigurasi project (dipakai saat init project pertama)
:: ----------------------------------------------------------
set "PLUGIN=vanilla-js-auth"
set "APP_NAME=Mini Inventory"
set "APP_CODE=mini-inventory"
set "API_BASE_URL=http://localhost:3032/api/mini-inventory"
set "PORT=3000"

:: Pindah ke folder script supaya path relative bekerja
cd /d "%~dp0"

:menu
cls
echo.
echo ============================================
echo  AppForge Generate - Mini Inventory
echo ============================================
echo  Command : %APPFORGE%
echo  Payload : %PAYLOAD_DIR%
echo  Output  : %OUTPUT_DIR%
echo  Run     : cd mini-inventory ^&^& npx serve . -l 3000
echo ============================================
echo.
echo  Setup (jalankan sekali di awal):
echo    [I] Init Project       (membuat fondasi: index, login, sidebar, assets)
echo.
echo  Master Data:
echo    [1] Category           (01-category.json)
echo    [2] Warehouse          (02-warehouse.json)
echo    [3] Supplier           (03-supplier.json)
echo    [4] Customer           (04-customer.json)
echo    [5] Item Product       (05-item-product.json)
echo.
echo  Transaksi:
echo    [6] Stock Inbound      (06-stock-inbound.json)
echo    [7] Stock Outbound     (07-stock-outbound.json)
echo.
echo  Dashboard:
echo    [8] Dashboard Outbound (dashboard-outbound.json)
echo.
echo  Lainnya:
echo    [A] Generate semua     (all-pages.json, scope=app)
echo    [V] Validate semua payload
echo    [Q] Keluar
echo.

set "choice="
set /p "choice=Pilih [I/1-8/A/V/Q]: "

if /i "%choice%"=="I" goto :do_init
if "%choice%"=="1" goto :do_category
if "%choice%"=="2" goto :do_warehouse
if "%choice%"=="3" goto :do_supplier
if "%choice%"=="4" goto :do_customer
if "%choice%"=="5" goto :do_item_product
if "%choice%"=="6" goto :do_stock_inbound
if "%choice%"=="7" goto :do_stock_outbound
if "%choice%"=="8" goto :do_dashboard_outbound
if /i "%choice%"=="A" goto :do_all
if /i "%choice%"=="V" goto :do_validate
if /i "%choice%"=="Q" exit /b 0

echo.
echo  [!] Pilihan tidak valid: %choice%
echo.
pause
goto :menu

:: ----------------------------------------------------------
::  Action handlers
:: ----------------------------------------------------------
:do_init
echo.
echo --- Init Project: %APP_NAME% ---
echo.
echo  [!] PERHATIAN: command ini akan menimpa folder %OUTPUT_DIR%
echo      Pastikan folder tidak berisi modifikasi manual yang penting.
echo.
set "confirm="
set /p "confirm=Lanjutkan init? [Y/N]: "
if /i not "%confirm%"=="Y" (
    echo Init dibatalkan.
    goto :after_action
)
echo.
echo ^> %APPFORGE% init --plugin "%PLUGIN%" --output "%OUTPUT_DIR%" --app-name "%APP_NAME%" --app-code "%APP_CODE%" --api-base-url "%API_BASE_URL%" --port %PORT% --overwrite
echo.
%APPFORGE% init --plugin "%PLUGIN%" --output "%OUTPUT_DIR%" --app-name "%APP_NAME%" --app-code "%APP_CODE%" --api-base-url "%API_BASE_URL%" --port %PORT% --overwrite
goto :after_action

:do_category
call :gen "01-category" "category"
goto :after_action

:do_warehouse
call :gen "02-warehouse" "warehouse"
goto :after_action

:do_supplier
call :gen "03-supplier" "supplier"
goto :after_action

:do_customer
call :gen "04-customer" "customer"
goto :after_action

:do_item_product
call :gen "05-item-product" "item-product"
goto :after_action

:do_stock_inbound
call :gen "06-stock-inbound" "stock-inbound"
goto :after_action

:do_stock_outbound
call :gen "07-stock-outbound" "stock-outbound"
goto :after_action

:do_dashboard_outbound
call :gen "dashboard-outbound" "dashboard-outbound"
goto :after_action

:do_all
echo.
echo --- Generate: all-pages.json (scope=app) ---
echo.
echo ^> %APPFORGE% generate --payload "%PAYLOAD_DIR%/all-pages.json" --output "%OUTPUT_DIR%" --overwrite
echo.
%APPFORGE% generate --payload "%PAYLOAD_DIR%/all-pages.json" --output "%OUTPUT_DIR%" --overwrite
goto :after_action

:do_validate
echo.
echo --- Validate semua payload ---
for %%F in (
    01-category 02-warehouse 03-supplier 04-customer 05-item-product
    06-stock-inbound 07-stock-outbound dashboard-outbound all-pages
) do (
    echo.
    echo === %%F.json ===
    echo ^> %APPFORGE% validate --payload "%PAYLOAD_DIR%/%%F.json"
    echo.
    %APPFORGE% validate --payload "%PAYLOAD_DIR%/%%F.json"
)
goto :after_action

:after_action
echo.
echo --------------------------------------------
pause
goto :menu

:: ----------------------------------------------------------
::  Subroutine: gen <payload-prefix> <page-id>
::  Memanggil: appforge generate --payload <prefix>.json --scope form --page <pageId>
:: ----------------------------------------------------------
:gen
echo.
echo --- Generate: %~1 (page: %~2) ---
echo.
echo ^> %APPFORGE% generate --payload "%PAYLOAD_DIR%/%~1.json" --output "%OUTPUT_DIR%" --scope form --page "%~2" --overwrite
echo.
%APPFORGE% generate --payload "%PAYLOAD_DIR%/%~1.json" --output "%OUTPUT_DIR%" --scope form --page "%~2" --overwrite
exit /b 0
