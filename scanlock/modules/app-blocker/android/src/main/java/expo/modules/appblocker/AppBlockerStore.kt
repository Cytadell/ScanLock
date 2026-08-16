package expo.modules.appblocker

import android.content.Context
import android.content.SharedPreferences

internal class AppBlockerStore(context: Context) {
  private val preferences: SharedPreferences = context.applicationContext.getSharedPreferences(
    PREFERENCES_NAME,
    Context.MODE_PRIVATE
  )

  @Synchronized
  fun getSelectedPackages(): Set<String> =
    preferences.getStringSet(KEY_SELECTED_PACKAGES, emptySet())?.toSet() ?: emptySet()

  @Synchronized
  fun saveSelectedPackages(packages: Set<String>) {
    check(!getLocked()) { "Unlock ScanLock before changing the blocked app selection." }
    check(preferences.edit().putStringSet(KEY_SELECTED_PACKAGES, packages.toSet()).commit()) {
      "The blocked app selection could not be saved."
    }
  }

  @Synchronized
  fun getLocked(): Boolean {
    recoverInterruptedOperation()
    return preferences.getBoolean(KEY_LOCKED, false)
  }

  @Synchronized
  fun setLocked(enabled: Boolean): Boolean {
    recoverInterruptedOperation()

    val previous = preferences.getBoolean(KEY_LOCKED, false)
    if (previous == enabled) return previous

    check(
      preferences.edit()
        .putBoolean(KEY_JOURNAL_ACTIVE, true)
        .putBoolean(KEY_JOURNAL_PREVIOUS, previous)
        .putBoolean(KEY_JOURNAL_INTENDED, enabled)
        .commit()
    ) { "The blocking change could not be prepared." }

    if (!preferences.edit().putBoolean(KEY_LOCKED, enabled).commit() ||
      preferences.getBoolean(KEY_LOCKED, false) != enabled
    ) {
      rollback(previous)
      error("The blocking change could not be verified, so the previous state was restored.")
    }

    if (!clearJournal()) {
      rollback(previous)
      error("The blocking change could not be committed, so the previous state was restored.")
    }

    return enabled
  }

  @Synchronized
  fun clearSelection() {
    setLocked(false)
    check(preferences.edit().remove(KEY_SELECTED_PACKAGES).commit()) {
      "The blocked app selection could not be cleared."
    }
  }

  private fun recoverInterruptedOperation() {
    if (!preferences.getBoolean(KEY_JOURNAL_ACTIVE, false)) return

    val previous = preferences.getBoolean(KEY_JOURNAL_PREVIOUS, false)
    check(preferences.edit().putBoolean(KEY_LOCKED, previous).commit()) {
      "ScanLock could not restore an interrupted blocking change."
    }
    check(preferences.getBoolean(KEY_LOCKED, false) == previous && clearJournal()) {
      "ScanLock could not restore an interrupted blocking change."
    }
  }

  private fun rollback(previous: Boolean) {
    check(preferences.edit().putBoolean(KEY_LOCKED, previous).commit()) {
      "The blocking change and its rollback could not be verified."
    }
    check(preferences.getBoolean(KEY_LOCKED, false) == previous && clearJournal()) {
      "The blocking change and its rollback could not be verified."
    }
  }

  private fun clearJournal(): Boolean = preferences.edit()
    .remove(KEY_JOURNAL_ACTIVE)
    .remove(KEY_JOURNAL_PREVIOUS)
    .remove(KEY_JOURNAL_INTENDED)
    .commit()

  private companion object {
    const val PREFERENCES_NAME = "scanlock_app_blocker"
    const val KEY_SELECTED_PACKAGES = "selected_packages"
    const val KEY_LOCKED = "locked"
    const val KEY_JOURNAL_ACTIVE = "journal_active"
    const val KEY_JOURNAL_PREVIOUS = "journal_previous"
    const val KEY_JOURNAL_INTENDED = "journal_intended"
  }
}
