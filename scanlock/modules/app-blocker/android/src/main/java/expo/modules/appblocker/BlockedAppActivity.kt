package expo.modules.appblocker

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class BlockedAppActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    window.statusBarColor = COLOR_BACKGROUND
    window.navigationBarColor = COLOR_BACKGROUND
    setContentView(createContent())
  }

  override fun onResume() {
    super.onResume()
    if (!AppBlockerStore(this).getLocked()) finish()
  }

  @Deprecated("Android still invokes this callback on supported ScanLock versions.")
  override fun onBackPressed() {
    goHome()
  }

  private fun createContent(): View {
    val density = resources.displayMetrics.density
    val padding = (32 * density).toInt()
    val blockedPackage = intent.getStringExtra(EXTRA_BLOCKED_PACKAGE)
    val appLabel = blockedPackage?.let(::resolveAppLabel) ?: "This app"

    return LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setPadding(padding, padding, padding, padding)
      setBackgroundColor(COLOR_BACKGROUND)

      addView(TextView(context).apply {
        text = "SCANLOCK"
        textSize = 13f
        letterSpacing = 0.18f
        setTextColor(COLOR_ACCENT)
        typeface = Typeface.DEFAULT_BOLD
        gravity = Gravity.CENTER
      })

      addView(TextView(context).apply {
        text = "$appLabel is locked"
        textSize = 30f
        setTextColor(COLOR_TEXT)
        typeface = Typeface.DEFAULT_BOLD
        gravity = Gravity.CENTER
        setPadding(0, (18 * density).toInt(), 0, 0)
      })

      addView(TextView(context).apply {
        text = "Scan your ScanLock QR code to restore access."
        textSize = 16f
        setTextColor(COLOR_SECONDARY_TEXT)
        gravity = Gravity.CENTER
        setPadding(0, (14 * density).toInt(), 0, (28 * density).toInt())
      })

      addView(Button(context).apply {
        text = "Go to Home screen"
        isAllCaps = false
        textSize = 16f
        setTextColor(Color.WHITE)
        setBackgroundColor(COLOR_ACCENT)
        setPadding((20 * density).toInt(), 0, (20 * density).toInt(), 0)
        setOnClickListener { goHome() }
      }, LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        (52 * density).toInt()
      ))
    }
  }

  private fun resolveAppLabel(packageName: String): String = try {
    packageManager.getApplicationLabel(packageManager.getApplicationInfo(packageName, 0)).toString()
  } catch (_: Exception) {
    "This app"
  }

  private fun goHome() {
    startActivity(
      Intent(Intent.ACTION_MAIN)
        .addCategory(Intent.CATEGORY_HOME)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    )
    finish()
  }

  companion object {
    const val EXTRA_BLOCKED_PACKAGE = "blockedPackage"
    private val COLOR_BACKGROUND = Color.rgb(248, 247, 252)
    private val COLOR_ACCENT = Color.rgb(112, 87, 232)
    private val COLOR_TEXT = Color.rgb(32, 28, 43)
    private val COLOR_SECONDARY_TEXT = Color.rgb(110, 104, 122)
  }
}
