@REM Maven Wrapper script for Windows
@REM This downloads Maven automatically if not present

@echo off
setlocal

set MAVEN_PROJECTBASEDIR=%~dp0
set WRAPPER_PROPERTIES="%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.properties"

@REM Check if Maven is available
where mvn >nul 2>nul
if %errorlevel% equ 0 (
    mvn %*
    exit /b %errorlevel%
)

@REM Fall back to Maven wrapper JAR
set WRAPPER_JAR="%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.jar"
if exist %WRAPPER_JAR% (
    java -jar %WRAPPER_JAR% %*
    exit /b %errorlevel%
)

@REM Download Maven directly if wrapper JAR not available
echo Maven not found. Downloading Maven 3.9.9...
set MAVEN_URL=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.9/apache-maven-3.9.9-bin.zip
set MAVEN_DIR="%MAVEN_PROJECTBASEDIR%.mvn\maven"

if not exist %MAVEN_DIR% mkdir %MAVEN_DIR%

powershell -Command "& { Invoke-WebRequest -Uri '%MAVEN_URL%' -OutFile '%MAVEN_DIR%\maven.zip' }"
powershell -Command "& { Expand-Archive -Path '%MAVEN_DIR%\maven.zip' -DestinationPath '%MAVEN_DIR%' -Force }"

set PATH=%MAVEN_DIR%\apache-maven-3.9.9\bin;%PATH%
mvn %*
exit /b %errorlevel%
