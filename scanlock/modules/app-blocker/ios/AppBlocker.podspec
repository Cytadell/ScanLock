Pod::Spec.new do |s|
  s.name           = 'AppBlocker'
  s.version        = '1.0.0'
  s.summary        = 'ScanLock app-blocking native module'
  s.description    = 'Bridges FamilyControls and ManagedSettings to ScanLock.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.0'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
