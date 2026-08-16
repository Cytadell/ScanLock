package expo.modules.appblocker

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.os.SystemClock
import android.view.accessibility.AccessibilityEvent

class AppBlockingAccessibilityService : AccessibilityService() {
  private lateinit var store: AppBlockerStore
  private var lastBlockedPackage: String? = null
  private var lastBlockTimestamp = 0L

  override fun onServiceConnected() {
    super.onServiceConnected()
    store = AppBlockerStore(this)
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED &&
      event?.eventType != AccessibilityEvent.TYPE_WINDOWS_CHANGED
    ) return

    val foregroundPackage = event.packageName?.toString()
    if (!AppBlockerDecision.shouldBlock(
        locked = store.getLocked(),
        selectedPackages = store.getSelectedPackages(),
        foregroundPackage = foregroundPackage,
        ownPackage = packageName
      )
    ) return

    val now = SystemClock.elapsedRealtime()
    if (foregroundPackage == lastBlockedPackage && now - lastBlockTimestamp < BLOCK_DEBOUNCE_MS) {
      return
    }
    lastBlockedPackage = foregroundPackage
    lastBlockTimestamp = now

    startActivity(
      Intent(this, BlockedAppActivity::class.java)
        .putExtra(BlockedAppActivity.EXTRA_BLOCKED_PACKAGE, foregroundPackage)
        .addFlags(
          Intent.FLAG_ACTIVITY_NEW_TASK or
            Intent.FLAG_ACTIVITY_CLEAR_TOP or
            Intent.FLAG_ACTIVITY_SINGLE_TOP or
            Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS
        )
    )
  }

  override fun onInterrupt() = Unit

  private companion object {
    const val BLOCK_DEBOUNCE_MS = 750L
  }
}
