!macro NSIS_HOOK_POSTINSTALL
  # Copy WebView2Loader.dll to the installation directory
  File "/oname=$INSTDIR\WebView2Loader.dll" "C:\Users\saravanan\AppData\Local\Temp\view-md-target\release\WebView2Loader.dll"
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  # Delete WebView2Loader.dll on uninstall
  Delete "$INSTDIR\WebView2Loader.dll"
!macroend
