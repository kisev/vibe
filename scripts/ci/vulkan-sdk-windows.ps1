# Install the Vulkan SDK on a Windows runner. Same headless invocation as
# llama.cpp's build-vulkan CI: the QtIFW flags --accept-licenses
# --default-answer --confirm-command are the only silent form this installer
# accepts (/S and --mode unattended hang a headless runner); it lands in
# C:\VulkanSDK\<version> in well under a minute.
#
# Reads VULKAN_VERSION (e.g. 1.4.357.0) from the environment.

curl.exe -f -o $env:RUNNER_TEMP/VulkanSDK-Installer.exe -L "https://sdk.lunarg.com/sdk/download/${env:VULKAN_VERSION}/windows/vulkansdk-windows-X64-${env:VULKAN_VERSION}.exe"
if ($LASTEXITCODE -ne 0) { throw "Vulkan SDK download failed with exit code $LASTEXITCODE" }
& "$env:RUNNER_TEMP\VulkanSDK-Installer.exe" --accept-licenses --default-answer --confirm-command install
if (-not (Test-Path "C:\VulkanSDK\${env:VULKAN_VERSION}\Bin\glslc.exe")) { throw 'glslc.exe not found after the SDK install' }
"VULKAN_SDK=C:\VulkanSDK\${env:VULKAN_VERSION}" | Out-File -FilePath $env:GITHUB_ENV -Append
"C:\VulkanSDK\${env:VULKAN_VERSION}\Bin" | Out-File -FilePath $env:GITHUB_PATH -Append
# cmake links the loader by absolute path, but the rust crate links vulkan-1 by
# name, so link.exe also needs the SDK lib dir on LIB.
# Lib holds the x64 import library; a recursive search could just as easily
# find Lib32\vulkan-1.lib and link a 64-bit build against the 32-bit one.
$vulkanLib = "C:\VulkanSDK\${env:VULKAN_VERSION}\Lib"
if (-not (Test-Path "$vulkanLib\vulkan-1.lib")) { throw "vulkan-1.lib not found in $vulkanLib" }
"LIB=$vulkanLib;${env:LIB}" | Out-File -FilePath $env:GITHUB_ENV -Append
