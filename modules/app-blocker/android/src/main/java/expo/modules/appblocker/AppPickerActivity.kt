package expo.modules.appblocker

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.Gravity
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ListView
import android.widget.TextView
import android.widget.Toast
import java.util.Locale

class AppPickerActivity : Activity() {
  private lateinit var store: AppBlockerStore
  private lateinit var listView: ListView
  private var allApps: List<AppEntry> = emptyList()
  private var visibleApps: List<AppEntry> = emptyList()
  private val selectedPackages = mutableSetOf<String>()

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    store = AppBlockerStore(this)

    if (store.getLocked()) {
      Toast.makeText(this, "Unlock ScanLock before changing apps.", Toast.LENGTH_LONG).show()
      setResult(RESULT_CANCELED)
      finish()
      return
    }

    selectedPackages += store.getSelectedPackages()
    allApps = loadLaunchableApps()
    visibleApps = allApps
    setContentView(createContent())
    showApps(allApps)
  }

  private fun createContent(): LinearLayout {
    val density = resources.displayMetrics.density
    val horizontalPadding = (20 * density).toInt()

    return LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(horizontalPadding, (20 * density).toInt(), horizontalPadding, 0)
      setBackgroundColor(Color.rgb(248, 247, 252))

      addView(TextView(context).apply {
        text = "Choose blocked apps"
        textSize = 28f
        setTextColor(Color.rgb(32, 28, 43))
        typeface = Typeface.DEFAULT_BOLD
      })

      addView(TextView(context).apply {
        text = "Selected apps become unavailable while ScanLock is active."
        textSize = 14f
        setTextColor(Color.rgb(110, 104, 122))
        setPadding(0, (6 * density).toInt(), 0, (14 * density).toInt())
      })

      addView(EditText(context).apply {
        hint = "Search apps"
        isSingleLine = true
        addTextChangedListener(object : TextWatcher {
          override fun beforeTextChanged(value: CharSequence?, start: Int, count: Int, after: Int) = Unit
          override fun onTextChanged(value: CharSequence?, start: Int, before: Int, count: Int) {
            filterApps(value?.toString().orEmpty())
          }
          override fun afterTextChanged(value: Editable?) = Unit
        })
      }, LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.WRAP_CONTENT
      ))

      listView = ListView(context).apply {
        choiceMode = ListView.CHOICE_MODE_MULTIPLE
        dividerHeight = 1
        setOnItemClickListener { _, _, position, _ ->
          val packageName = visibleApps[position].packageName
          if (isItemChecked(position)) selectedPackages += packageName
          else selectedPackages -= packageName
        }
      }
      addView(listView, LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        0,
        1f
      ))

      addView(LinearLayout(context).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.END or Gravity.CENTER_VERTICAL
        setPadding(0, (10 * density).toInt(), 0, (14 * density).toInt())

        addView(Button(context).apply {
          text = "Cancel"
          isAllCaps = false
          setOnClickListener {
            setResult(RESULT_CANCELED)
            finish()
          }
        })

        addView(Button(context).apply {
          text = "Save"
          isAllCaps = false
          setTextColor(Color.WHITE)
          setBackgroundColor(Color.rgb(112, 87, 232))
          setOnClickListener { saveAndFinish() }
        })
      }, LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.WRAP_CONTENT
      ))
    }
  }

  private fun filterApps(query: String) {
    val normalized = query.trim().lowercase(Locale.getDefault())
    showApps(
      if (normalized.isEmpty()) allApps
      else allApps.filter {
        it.label.lowercase(Locale.getDefault()).contains(normalized) ||
          it.packageName.lowercase(Locale.ROOT).contains(normalized)
      }
    )
  }

  private fun showApps(apps: List<AppEntry>) {
    visibleApps = apps
    listView.adapter = ArrayAdapter(
      this,
      android.R.layout.simple_list_item_multiple_choice,
      apps.map { it.label }
    )
    apps.forEachIndexed { index, app ->
      listView.setItemChecked(index, app.packageName in selectedPackages)
    }
  }

  private fun saveAndFinish() {
    try {
      store.saveSelectedPackages(selectedPackages)
      setResult(RESULT_OK)
      finish()
    } catch (error: Exception) {
      Toast.makeText(this, error.message ?: "Could not save selected apps.", Toast.LENGTH_LONG).show()
    }
  }

  private fun loadLaunchableApps(): List<AppEntry> {
    val launcherIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
    val resolvedApps = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      packageManager.queryIntentActivities(
        launcherIntent,
        android.content.pm.PackageManager.ResolveInfoFlags.of(0)
      )
    } else {
      @Suppress("DEPRECATION")
      packageManager.queryIntentActivities(launcherIntent, 0)
    }

    val homePackage = packageManager.resolveActivity(
      Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME),
      0
    )?.activityInfo?.packageName

    return resolvedApps
      .mapNotNull { resolved ->
        val packageName = resolved.activityInfo?.packageName ?: return@mapNotNull null
        if (packageName == this.packageName || packageName == homePackage) return@mapNotNull null
        AppEntry(
          label = resolved.loadLabel(packageManager)?.toString()?.ifBlank { packageName } ?: packageName,
          packageName = packageName
        )
      }
      .distinctBy(AppEntry::packageName)
      .sortedBy { it.label.lowercase(Locale.getDefault()) }
  }

  private data class AppEntry(val label: String, val packageName: String)
}
