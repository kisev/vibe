# Install the Vulkan SDK on a Windows runner. Same headless invocation as
# llama.cpp's build-vulkan CI: the QtIFW flags --accept-licenses
# --default-answer --confirm-command are the only silent form this installer
# accepts (/S and --mode unattended hang a headless runner); it lands in
# C:\VulkanSDK\<version> in well under a minute.
#
# Reads VULKAN_VERSION (e.g. 1.4.357.0) from the environment.

curl.exe -o $env:RUNNER_TEMP/VulkanSDK-Installer.exe -L "https://sdk.lunarg.com/sdk/download/${env:VULKAN_VERSION}/windows/vulkansdk-windows-X64-${env:VULKAN_VERSION}.exe"
& "$env:RUNNER_TEMP\VulkanSDK-Installer.exe" --accept-licenses --default-answer --confirm-command install
if (-not (Test-Path "C:\VulkanSDK\${env:VULKAN_VERSION}\Bin\glslc.exe")) { throw 'glslc.exe not found after the SDK install' }
"VULKAN_SDK=C:\VulkanSDK\${env:VULKAN_VERSION}" | Out-File -FilePath $env:GITHUB_ENV -Append
"C:\VulkanSDK\${env:VULKAN_VERSION}\Bin" | Out-File -FilePath $env:GITHUB_PATH -Append
# cmake links the loader by absolute path, but the rust crate links vulkan-1 by
# name, so link.exe also needs the SDK lib dir on LIB.
$vulkanLib = (Get-ChildItem "C:\VulkanSDK\${env:VULKAN_VERSION}" -Recurse -Filter vulkan-1.lib | Select-Object -First 1).DirectoryName
if (-not $vulkanLib) { throw 'vulkan-1.lib not found in the SDK install' }
"LIB=$vulkanLib;${env:LIB}" | Out-File -FilePath $env:GITHUB_ENV -Append
