package expo.modules.appblocker

import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AppBlockerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AppBlocker")

    AsyncFunction("requestAuthorization") {
      throw AppBlockerUnavailableException()
    }

    AsyncFunction("selectApps") {
      throw AppBlockerUnavailableException()
    }

    Function("isAuthorized") { false }
    Function("getSelectedAppCount") { 0 }
    Function("hasSelection") { false }
    Function("getLocked") { false }

    AsyncFunction("setBlockingEnabled") { _: Boolean ->
      throw AppBlockerUnavailableException()
    }

    AsyncFunction("clearSelection") {
      throw AppBlockerUnavailableException()
    }
  }
}

private class AppBlockerUnavailableException : CodedException(
  "App blocking is not implemented on Android yet."
)
