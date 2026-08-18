package expo.modules.appblocker

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AppBlockerDecisionTest {
  private val selected = setOf("com.example.blocked")

  @Test
  fun blocksSelectedForegroundPackageWhileLocked() {
    assertTrue(
      AppBlockerDecision.shouldBlock(
        locked = true,
        selectedPackages = selected,
        foregroundPackage = "com.example.blocked",
        ownPackage = "com.cytadelltime.scanlock"
      )
    )
  }

  @Test
  fun permitsAppsWhenUnlockedOrNotSelected() {
    assertFalse(
      AppBlockerDecision.shouldBlock(
        locked = false,
        selectedPackages = selected,
        foregroundPackage = "com.example.blocked",
        ownPackage = "com.cytadelltime.scanlock"
      )
    )
    assertFalse(
      AppBlockerDecision.shouldBlock(
        locked = true,
        selectedPackages = selected,
        foregroundPackage = "com.example.allowed",
        ownPackage = "com.cytadelltime.scanlock"
      )
    )
  }

  @Test
  fun neverBlocksScanLockOrAnUnknownPackage() {
    assertFalse(
      AppBlockerDecision.shouldBlock(
        locked = true,
        selectedPackages = selected + "com.cytadelltime.scanlock",
        foregroundPackage = "com.cytadelltime.scanlock",
        ownPackage = "com.cytadelltime.scanlock"
      )
    )
    assertFalse(
      AppBlockerDecision.shouldBlock(
        locked = true,
        selectedPackages = selected,
        foregroundPackage = null,
        ownPackage = "com.cytadelltime.scanlock"
      )
    )
  }
}
