package expo.modules.appblocker

import android.content.ComponentName
import android.content.Context
import android.provider.Settings

internal object AppBlockerAuthorization {
  fun isEnabled(context: Context): Boolean {
    if (Settings.Secure.getInt(
        context.contentResolver,
        Settings.Secure.ACCESSIBILITY_ENABLED,
        0
      ) != 1
    ) return false

    val expected = ComponentName(context, AppBlockingAccessibilityService::class.java)
    val enabledServices = Settings.Secure.getString(
      context.contentResolver,
      Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
    ) ?: return false

    return enabledServices.split(':').any { flattenedComponent ->
      ComponentName.unflattenFromString(flattenedComponent) == expected
    }
  }
}
