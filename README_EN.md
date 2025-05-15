> [查看中文版说明文档](./README.md)

# auto-refresh-gad.js – Auto-Refresh Google AdSense Ad Units Script

`auto-refresh-gad.js` is a lightweight JavaScript utility that provides smart auto-refresh functionality for AdSense ad units—**designed to comply with Google AdSense policies** when used correctly.

This script is intended for use in Single Page Applications (SPAs) or similar environments where ad display integrity may suffer (e.g., after an ad fails to load). It is **not recommended for increasing ad impressions or earnings artificially**. Use it only when necessary and in accordance with your actual needs.

The script intelligently refreshes visible ads after user interaction and within a limited number of times and intervals to help improve ad fill rates.

> Author: [axiaoxin](https://blog.axiaoxin.com)  
> Project URL: <https://github.com/axiaoxin/auto-refresh-gad.js>

## Disclaimer (Please Read Carefully)

**Before using this script, please read the following disclaimer:**

1. This script is for demonstration purposes only. The author does **not encourage or recommend** using it in any way that violates Google AdSense policies. Users are responsible for understanding and complying with the policies.
2. **Using this script carries a risk of being flagged for invalid traffic**, which may lead to account warnings, ad serving suspension, revenue clawbacks, or even permanent account termination.
3. This project is for educational and research purposes only. **The author takes no responsibility for any ad-related issues, account penalties, revenue loss, or other consequences resulting from using this script.**
4. Each website is unique. You should customize and thoroughly test the script to suit your own needs.

If you plan to use it in a production/commercial setting, you must:

- Carefully read the [Google AdSense Program Policies](https://support.google.com/adsense/answer/48182?hl=en)
- Consult professionals if unsure
- Carefully assess compliance risks

**By using this script, you acknowledge that you fully understand and agree to the above terms.**

## AdSense Policy Compliance & Risk Warning

Google AdSense explicitly prohibits the following:

- Artificial ad impressions (including automated ad refreshes)
- Manipulating ad display behavior via scripts
- Any form of fraudulent traffic or simulated user behavior

Although `auto-refresh-gad.js` avoids click fraud and forced refreshes, **Google uses highly advanced automated systems** to detect unnatural behavior such as repeated loading or suspicious refresh intervals.

> ⚠️ Using this script may:
>
> - Be flagged as invalid traffic
> - Cause ads to stop serving or revenue to reset
> - Result in account suspension, limitation, or permanent ban

This script is **for technical learning purposes only** and **does not guarantee compliance with Google AdSense policies**.

## Features

- Designed with AdSense policy considerations in mind
- Smart viewport detection (only refreshes visible ads)
- Configurable random refresh intervals
- Max refresh count limiter to avoid over-refreshing
- Highly customizable configuration
- Lightweight and minimally impacts performance
- Easy integration with debug mode support

## Quick Start Guide: How to Auto-Refresh Google Ad Units

### Step 1: Prepare Your Ad Container

Add the designated class (default: `.auto-refresh-gad`) to your ad container. Ensure your AdSense unit is correctly inserted:

```html
<div class="auto-refresh-gad">
  <!-- Your AdSense ad code -->
  <ins
    class="adsbygoogle"
    style="display:block"
    data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
    data-ad-slot="XXXXXXXXXX"
    data-ad-format="auto"
    data-full-width-responsive="true"
  ></ins>
  <script>
    (adsbygoogle = window.adsbygoogle || []).push({});
  </script>
</div>
```

### Step 2: Add the Refresh Script

Insert the script before the closing `</body>` tag:

```html
<script src="path/to/auto-refresh-gad.js"></script>
```

Or paste the full script directly inline:

```html
<script>
  // Paste the entire auto-refresh-gad.js code here
</script>
```

### Step 3: Configure Parameters (Optional)

The default parameters are set conservatively. To customize, edit the `CONFIG` object inside the script:

```javascript
const CONFIG = {
  minRefreshInterval: 30000, // Minimum interval in ms (e.g. 30 secs)
  maxRefreshInterval: 60000, // Maximum interval in ms (e.g. 1 min)
  maxRefreshCount: 20, // Max number of refreshes per ad, set to -1 for unlimited
  viewportThreshold: 0.45, // % of ad visible in viewport (0–1)
  containerSelector: ".auto-refresh-gad", // Ad container selector, can use comma to separate multiple selectors, e.g. ".ad1, .ad2, #special-ad"
  debug: true, // Enable console debug logs
  requireUserInteraction: false, // Require user interaction before initialization
  initializationDelay: 5000, // Initialization delay when no interaction (ms)
  logLevel: "info", // Log level: 'error', 'warn', 'info'
};
```

If you use a custom class for your ad containers, change the `containerSelector` accordingly.

### Step 4: Test and Verify

1. Open your website
2. Open browser dev tools (press `F12`)
3. Go to the **Console** tab
4. Scroll or interact with the page to trigger script
5. You should see debug messages like:
   - "User interaction detected, initializing ad refresh logic"
   - "AdSense loaded, starting refresh cycle"
   - "Next ad refresh scheduled in XX seconds"

### Step 5: Production Settings

After confirming everything works:

1. Set `debug` to `false` to silence console logs:
   ```javascript
   debug: false;
   ```
2. Optionally increase the viewport threshold for better visibility:
   ```javascript
   viewportThreshold: 0.7;
   ```

## Best Practices

To stay as compliant and safe as possible:

1. **Use longer refresh intervals** – Set `minRefreshInterval` to 180000 (3 minutes) or more
2. **Use a higher viewport threshold** – e.g., 0.7 for at least 70% visibility
3. **Limit total refreshes** – Set `maxRefreshCount` to 5–8
4. **Disable debug in production** – Set `debug` to `false`

## Final Warning

> **This script is not guaranteed to be compliant with Google AdSense. Use at your own discretion and risk. Improper use may lead to account issues.**
