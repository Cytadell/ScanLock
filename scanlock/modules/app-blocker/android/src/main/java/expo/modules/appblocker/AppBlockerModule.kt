package expo.modules.appblocker

import android.content.Context
import android.content.Intent
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AppBlockerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AppBlocker")

    lateinit var authorizationLauncher: AppContextActivityResultLauncher<String, Boolean>
    lateinit var appPickerLauncher: AppContextActivityResultLauncher<String, Int>

    RegisterActivityContracts {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      authorizationLauncher = registerForActivityResult(AccessibilitySettingsContract(context))
      appPickerLauncher = registerForActivityResult(AppPickerContract(context))
    }

    AsyncFunction("requestAuthorization") Coroutine { ->
      val context = requireContext()
      if (AppBlockerAuthorization.isEnabled(context)) {
        true
      } else {
        authorizationLauncher.launch(AUTHORIZATION_REQUEST)
      }
    }

    AsyncFunction("selectApps") Coroutine { ->
      val context = requireContext()
      val store = AppBlockerStore(context)
      if (!AppBlockerAuthorization.isEnabled(context)) throw AppBlockerNotAuthorizedException()
      if (store.getLocked()) throw AppBlockerSelectionLockedException()

      val count = appPickerLauncher.launch(APP_PICKER_REQUEST)
      selectionResult(count)
    }

    Function("isAuthorized") {
      AppBlockerAuthorization.isEnabled(requireContext())
    }

    Function("getSelectedAppCount") {
      AppBlockerStore(requireContext()).getSelectedPackages().size
    }

    Function("hasSelection") {
      AppBlockerStore(requireContext()).getSelectedPackages().isNotEmpty()
    }

    Function("getLocked") {
      AppBlockerStore(requireContext()).getLocked()
    }

    AsyncFunction("setBlockingEnabled") { enabled: Boolean ->
      val context = requireContext()
      val store = AppBlockerStore(context)

      if (enabled) {
        if (!AppBlockerAuthorization.isEnabled(context)) throw AppBlockerNotAuthorizedException()
        if (store.getSelectedPackages().isEmpty()) throw AppBlockerNoSelectionException()
      }

      val locked = try {
        store.setLocked(enabled)
      } catch (error: IllegalStateException) {
        throw AppBlockerOperationException(error.message)
      }
      blockingResult(locked)
    }

    AsyncFunction("clearSelection") {
      try {
        AppBlockerStore(requireContext()).clearSelection()
      } catch (error: IllegalStateException) {
        throw AppBlockerOperationException(error.message)
      }
    }
  }

  private fun requireContext(): Context =
    appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private fun selectionResult(count: Int): Map<String, Any> = mapOf(
    "count" to count,
    "applicationCount" to count,
    "categoryCount" to 0,
    "webDomainCount" to 0
  )

  private fun blockingResult(locked: Boolean): Map<String, Any> = mapOf(
    "status" to if (locked) "locked" else "unlocked",
    "locked" to locked
  )

  private companion object {
    const val AUTHORIZATION_REQUEST = "authorization"
    const val APP_PICKER_REQUEST = "app-picker"
  }
}

private class AccessibilitySettingsContract(
  context: Context
) : AppContextActivityResultContract<String, Boolean> {
  private val applicationContext = context.applicationContext

  override fun createIntent(context: Context, input: String): Intent =
    Intent(context, AppBlockerAuthorizationActivity::class.java)

  override fun parseResult(input: String, resultCode: Int, intent: Intent?): Boolean =
    AppBlockerAuthorization.isEnabled(applicationContext)
}

private class AppPickerContract(
  context: Context
) : AppContextActivityResultContract<String, Int> {
  private val applicationContext = context.applicationContext

  override fun createIntent(context: Context, input: String): Intent =
    Intent(context, AppPickerActivity::class.java)

  override fun parseResult(input: String, resultCode: Int, intent: Intent?): Int =
    AppBlockerStore(applicationContext).getSelectedPackages().size
}

private class AppBlockerNotAuthorizedException : CodedException(
  "Accessibility authorization is required before selecting or blocking apps."
)

private class AppBlockerNoSelectionException : CodedException(
  "No apps have been selected."
)

private class AppBlockerSelectionLockedException : CodedException(
  "Unlock ScanLock before changing the blocked app selection."
)

private class AppBlockerOperationException(message: String?) : CodedException(
  message ?: "The blocking operation could not be completed."
)
