package expo.modules.appblocker

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.provider.Settings
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class AppBlockerAuthorizationActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    if (AppBlockerAuthorization.isEnabled(this)) {
      setResult(RESULT_OK)
      finish()
      return
    }

    setContentView(createContent())
  }

  @Deprecated("The system Accessibility Settings activity still reports through this callback.")
  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    super.onActivityResult(requestCode, resultCode, data)
    if (requestCode == ACCESSIBILITY_SETTINGS_REQUEST) {
      setResult(if (AppBlockerAuthorization.isEnabled(this)) RESULT_OK else RESULT_CANCELED)
      finish()
    }
  }

  private fun createContent(): LinearLayout {
    val density = resources.displayMetrics.density
    val padding = (28 * density).toInt()

    return LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setPadding(padding, padding, padding, padding)
      setBackgroundColor(Color.rgb(248, 247, 252))

      addView(TextView(context).apply {
        text = "Allow app blocking"
        textSize = 30f
        typeface = Typeface.DEFAULT_BOLD
        gravity = Gravity.CENTER
        setTextColor(Color.rgb(32, 28, 43))
      })

      addView(TextView(context).apply {
        text = "ScanLock uses Android Accessibility only to detect when an app you selected enters the foreground. While ScanLock is active, it replaces that app with a blocking screen.\n\nScanLock does not read, collect, or interact with content inside other apps. You can disable this access at any time in Android Settings."
        textSize = 16f
        gravity = Gravity.CENTER
        setTextColor(Color.rgb(110, 104, 122))
        setPadding(0, (18 * density).toInt(), 0, (28 * density).toInt())
      })

      addView(Button(context).apply {
        text = "Continue to Settings"
        isAllCaps = false
        textSize = 16f
        setTextColor(Color.WHITE)
        setBackgroundColor(Color.rgb(112, 87, 232))
        setOnClickListener {
          startActivityForResult(
            Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS),
            ACCESSIBILITY_SETTINGS_REQUEST
          )
        }
      }, LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        (52 * density).toInt()
      ))

      addView(Button(context).apply {
        text = "Not now"
        isAllCaps = false
        setOnClickListener {
          setResult(RESULT_CANCELED)
          finish()
        }
      }, LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.WRAP_CONTENT
      ).apply {
        topMargin = (10 * density).toInt()
      })
    }
  }

  private companion object {
    const val ACCESSIBILITY_SETTINGS_REQUEST = 4107
  }
}
