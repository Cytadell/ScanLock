package expo.modules.appblocker

internal object AppBlockerDecision {
  fun shouldBlock(
    locked: Boolean,
    selectedPackages: Set<String>,
    foregroundPackage: String?,
    ownPackage: String
  ): Boolean = locked &&
    foregroundPackage != null &&
    foregroundPackage != ownPackage &&
    foregroundPackage in selectedPackages
}
