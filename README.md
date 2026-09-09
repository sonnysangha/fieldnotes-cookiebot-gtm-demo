# Cookiebot Setup Demo

This repository accompanies our YouTube video, where we walk through setting up Cookiebot and explore the benefits of using it for consent management with Google Tag Manager.

Follow along by building a notebook shop where visitors can shop normally while optional tracking waits for consent. The demo uses **one GTM Web container**, the official Cookiebot CMP template, and four small demonstration tags.

**[Sign up for Cookiebot by Usercentrics](https://usercentrics.sjv.io/sonnysangha)**

The signup link is Sonny's affiliate/referral link.

The orders are simulated. The tags really execute inside GTM and report back to the shop's **Behind the banner** panel. **They do not send events to Google Analytics, Google Ads or Meta.**

## Before you start: which installation are we using?

| Option                                  | Why choose it?                                                                                           | What still needs checking?                                                           |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Cookiebot's direct auto-blocking script | The quickest starting point for a simple site where you can edit the header.                             | Script order, domain scan, classifications and whether actual resources are blocked. |
| Cookiebot through GTM — this tutorial   | Keep tag triggers and consent requirements together and inspect them in Tag Assistant.                   | Each tag's consent settings, plus any scripts installed outside GTM.                 |
| Google Consent Mode                     | Communicate consent to supported Google tags. It is a signaling system, not another banner installation. | Choose and test Basic or Advanced behavior for your Google measurement setup.        |

With **Basic** Google tags wait for consent. With **Advanced**, Google tags can load under denied consent and send cookieless signals. This tutorial demonstrates the wait-for-consent principle with custom demo tags. [Google's explanation](https://developers.google.com/tag-platform/security/concepts/consent-mode).

Our installation route is **Cookiebot → Implementation → CMP Banner → Google Tag Manager**. Follow that route throughout; don't also paste the direct CMP script or a second Consent Mode defaults script into this app. The template handles the banner and consent signaling. [Cookiebot's GTM instructions](https://support.cookiebot.com/hc/en-us/articles/360003793854-Google-Tag-Manager-deployment).

You need Node.js 24.15+, Git, a Cookiebot account, a GTM account and a website host. Use your own demo hostname and IDs.

## 1. Run and deploy your copy

```bash
git clone https://github.com/sonnysangha/Cookiebot-Setup-Demo.git
cd Cookiebot-Setup-Demo
npm ci
npm run dev
```

Open **[http://localhost:3000/](http://localhost:3000/)**. Shopping works before the tracking configuration is connected.

In another terminal, from the same project folder:

```bash
npx vercel --prod
```

Sign in and follow Vercel's prompts to create/link your own project. Use the **Next.js** preset. Keep the resulting production hostname for the next steps. Subsequent deployments use the same command from the folder you edit; no separate deployment copy is needed.

You can also import your own GitHub copy in Vercel's dashboard. [Vercel deployment documentation](https://vercel.com/docs/cli/deploy).

## 2. Register the hostname in Cookiebot

1. [Create or open your Cookiebot account](https://usercentrics.sjv.io/sonnysangha).
2. Under **Domains & Aliases**, add your deployed hostname to the intended domain group.
3. Configure and save the banner. For the tutorial, make Statistics, Marketing and Preferences available, initially off, and ensure the banner applies to your test location.
4. Copy the **Domain Group ID** from **Implementation**.
5. Check **Cookies & Reports** for the domain scan and review it when complete.

**Local testing:** your app's environment allowlist and Cookiebot's domain authorization are separate. If Cookiebot reports that `localhost` is unauthorized, authorize it in the relevant Cookiebot domain configuration or use your registered public hostname. Adding localhost only to `.env.local` will not fix that vendor error.

## 3. Create one GTM container and enable Consent Overview

In [Google Tag Manager](https://tagmanager.google.com/), create a demo account if needed, then create one **Web** container. Copy its `GTM-…` **container ID**. A `G-…` Analytics ID is not the container ID.

Before adding tags:

1. Open **Admin**.
2. Under the **Container** column, open **Container Settings**.
3. Find **Additional Settings**.
4. Tick **Enable consent overview**.
5. Click **Save**.
6. Return to **Workspace → Tags** and click the **Consent Overview** icon near the top-right of the tag list.

**This enables a settings overview, not automatic blocking.** Later you will use it to review the consent requirement on every tag. [Google's Consent Overview documentation](https://support.google.com/tagmanager/answer/10718549#consent-overview).

## 4. Connect the app to your IDs

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```dotenv
NEXT_PUBLIC_GTM_ID=GTM-YOURID
NEXT_PUBLIC_COOKIEBOT_ID=YOUR-COOKIEBOT-DOMAIN-GROUP-ID
NEXT_PUBLIC_ALLOWED_HOSTS=localhost,127.0.0.1,your-site.vercel.app
```

Use hostnames without a protocol, port or path. Restart the development server after changing this file.

Add the same three variables in **Vercel → Project Settings → Environment Variables**, selecting **Production**, then redeploy from your project folder:

```bash
npx vercel --prod
```

The supplied app already mounts its loader from the root layout:

```tsx
<DemoProvider config={demoConfig}>
  <GtmLoader gtmId={demoConfig.gtmId} />
  {children}
</DemoProvider>
```

`GtmLoader` uses Next.js `Script` with `afterInteractive`. Initialization prepares `dataLayer` and consent listeners before loading GTM. **Do not add a second GTM snippet.**

If you previously experimented with direct Cookiebot installation, ensure `GtmLoader` is enabled and remove/disable that direct banner script before following the GTM tutorial. Seeing zero receipts when GTM isn't loaded does not prove blocking.

## 5. Add the official Cookiebot CMP tag

1. Open **Templates → Tag Templates → Search Gallery**. Find **Cookiebot CMP** from Usercentrics and add it to your workspace.
2. Open **Variables → User-Defined Variables → New**. Create a **Constant** named `Demo - Cookiebot Domain Group ID`, containing your Domain Group ID.
3. Open **Tags → New**, name it `Cookiebot - Demo CMP`, and select the Cookiebot CMP template.
4. Set **Cookiebot ID** to `{{Demo - Cookiebot Domain Group ID}}`.
5. Keep **Google Consent Mode enabled**.
6. Add/check a global default row: leave Region blank and set optional categories, including advertising user-data and personalization consent, to **denied**. Necessary/security remains granted.
7. Select **Consent Initialization – All Pages** as the trigger.
8. Under **Advanced Settings → Consent Settings**, choose **No additional consent required** for this CMP tag. Save.

The CMP must load before the visitor has chosen optional consent. Do not require Statistics consent to display the banner.

![Cookiebot CMP configuration](screenshots/gtm/02-cookiebot-cmp.jpg)

_Existing demo configuration screenshot. Use your own Domain Group ID. The import's other defaults are automatic language,_ `.com` _CDN, wait-for-update 2000 ms, URL passthrough off, dynamic ads-data redaction and TCF off; these are demo settings, not universal production recommendations._

## 6. Create the two triggers

For each one, open **Triggers → New → Custom Event**, enter the settings below, choose **All Custom Events**, and save.

| Trigger name                 | Event name              | Use regex matching |
| ---------------------------- | ----------------------- | ------------------ |
| `Cookiebot - Consent Update` | `cookie_consent_update` | Off                |
| `Demo - Shop Events`         | `^(add_to_cart          | purchase)$`        |

The first gives category tags a chance to run when consent is available. The second matches an actual shop action. **Do not replace purchase triggers with the consent-update trigger:** agreeing to cookies is not a purchase.

## 7. Create four demo tags and require consent

For each row below:

1. Open **Tags → New → Custom HTML**.
2. Use the exact tag name and corresponding code from the expandable snippets below.
3. Set **Triggering** to the listed trigger.
4. Under **Advanced Settings → Tag firing options**, choose **Once per event**.
5. Under **Advanced Settings → Consent Settings → Additional Consent Checks**, select **Require additional consent for tag to fire**.
6. Click **Add required consent**, enter the listed consent type and save.

| Tag                                   | Trigger                    | Required consent        |
| ------------------------------------- | -------------------------- | ----------------------- |
| `Demo - Statistics receipt`           | Cookiebot - Consent Update | `analytics_storage`     |
| `Demo - Marketing receipt`            | Cookiebot - Consent Update | `ad_storage`            |
| `Demo - Preferences receipt`          | Cookiebot - Consent Update | `functionality_storage` |
| `Demo - Consented shop event receipt` | Demo - Shop Events         | `analytics_storage`     |

**The trigger says when to try. The consent check says whether the tag may run.** `cookie_consent_update` is an event name; `analytics_storage` is a permission. You need both pieces, in their respective fields.

The category code avoids repeating a successful initialization on the same page. The shop tag runs once for each permitted addition or purchase. These permissions describe these demo tags; review the behavior of real services before choosing their requirements.

Demo - Statistics receipt — copy code

```html
<script>
  (function () {
    var k = "__fieldnotes_statistics";
    if (window[k]) return;
    window[k] = true;
    document.cookie = "demo_statistics=1; Path=/; SameSite=Lax";
    window.dispatchEvent(
      new CustomEvent("demo-tag-fired", { detail: "Statistics demo tag" }),
    );
  })();
</script>
```

Demo - Marketing receipt — copy code

```html
<script>
  (function () {
    var k = "__fieldnotes_marketing";
    if (window[k]) return;
    window[k] = true;
    document.cookie = "demo_marketing=1; Path=/; SameSite=Lax";
    window.dispatchEvent(
      new CustomEvent("demo-tag-fired", { detail: "Marketing demo tag" }),
    );
  })();
</script>
```

Demo - Preferences receipt — copy code

```html
<script>
  (function () {
    var k = "__fieldnotes_preferences";
    if (window[k]) return;
    window[k] = true;
    document.cookie = "demo_preferences=1; Path=/; SameSite=Lax";
    window.dispatchEvent(
      new CustomEvent("demo-tag-fired", { detail: "Preferences demo tag" }),
    );
  })();
</script>
```

Demo - Consented shop event receipt — copy code

```html
<script>
  window.dispatchEvent(
    new CustomEvent("demo-tag-fired", { detail: "Consented shop event" }),
  );
</script>
```

![Statistics permission and trigger together](screenshots/gtm/03-statistics-consent.jpg)

## 8. Audit all five tags in Consent Overview

Return to **Workspace → Tags → Consent Overview**.

| Tag                                 | Expected Additional Consent Checks |
| ----------------------------------- | ---------------------------------- |
| Cookiebot - Demo CMP                | No additional consent required     |
| Demo - Statistics receipt           | Require `analytics_storage`        |
| Demo - Marketing receipt            | Require `ad_storage`               |
| Demo - Preferences receipt          | Require `functionality_storage`    |
| Demo - Consented shop event receipt | Require `analytics_storage`        |

All five should be in **Consent Configured**. Investigate anything in **Consent Not Configured**. “Configured” means an explicit setting was selected; it is not proof the setting is correct. Check against the table.

For Google tags, **Built-In Consent Checks** can adapt behavior while the tag still loads. **Additional Consent Checks** can prevent firing until all listed permissions are granted. “Not set” does not add a blocking requirement. Don't bulk-apply Statistics consent to the CMP or to every other category. [Google's tag consent settings](https://support.google.com/tagmanager/answer/10718549#tag-settings).

## 9. Preview and prove the difference

Click **Preview** in GTM, enter your registered public URL, and use the website tab that Tag Assistant opens. Keep that tab and Tag Assistant together. If the floating debug badge covers Cookiebot's buttons, collapse it first.

Start with a fresh page and no saved grant. If needed, withdraw consent and let the page reload before starting.

| Test               | Website action                                                           | Shop actions / tracked actions | GTM evidence                                                                                                    |
| ------------------ | ------------------------------------------------------------------------ | ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Denied             | Deny optional consent. Add one notebook and place an order.              | **2 / 0**, £18 order total     | Select the new `purchase`: shop tag appears under **Tags Blocked by Consent Settings**.                         |
| Statistics allowed | Allow Statistics only. Add one more notebook and order on the same page. | **4 / 2**, £18 order total     | New purchase: shop tag appears under **Tags Fired**, with **Succeeded**. Marketing and Preferences stay denied. |
| Withdrawn          | Withdraw, wait for reload, then add one notebook and order.              | **2 / 0**, £18 order total     | New purchase: shop tag is blocked again.                                                                        |

Also check in Tag Assistant:

- **Consent Initialization:** the Cookiebot CMP tag succeeds before ordinary tags.
- **Consent Default / Consent tab:** `analytics_storage`, `ad_storage`, `ad_user_data` and `ad_personalization` start denied. Statistics-only grants analytics while advertising remains denied.
- **Purchase / Data Layer:** one purchase per order, a distinct transaction ID, GBP currency, correct value and item quantity. Two notebooks should total £36.

A `purchase` entry in `dataLayer` is an internal shop event. The **Tag fired** badge requires a separate execution receipt. “Tags Not Fired” alone is insufficient evidence: the trigger may simply not match that event. The category tags aren't purchase tags, so they should not all fire on a purchase.

[More Tag Assistant testing detail](RECORDING_GUIDE.md#10-preview-and-verify-in-tag-assistant).

## 10. Publish, retest and finish the site setup

1. After Preview passes, use **Submit → Publish** in GTM and name the version.
2. Exit Preview and repeat the test on the normal production URL. Deploying Next.js and publishing GTM are separate actions.
3. Open **Cookie declaration** in the footer. This project already mounts the declaration using your Cookiebot ID; don't add a second declaration script. On another site, place it in a cookie-information page and link that page from the footer.
4. Review the completed Cookiebot scan and any classification/blocking issues. A visible banner or declaration doesn't prove the scan is complete.
5. Audit scripts and embeds outside GTM. This route requires those resources to be controlled separately; use Cookiebot's [manual markup guide](https://support.cookiebot.com/hc/en-us/articles/4405978132242-Manual-Markup-Guide). For combined automatic blocking and GTM, follow the [separate combined-installation recipe](https://support.cookiebot.com/hc/en-us/articles/360009192739-Google-Tag-Manager-and-Automatic-cookie-blocking).

The demo reloads on withdrawal to unload previously initialized scripts. GTM can block future tag execution; it cannot undo data already sent.

## Optional shortcut: import instead of building manually

If you want to skip creating the tags, use this **instead of steps 5–7**, in an empty demo container:

1. Open **Admin → Import Container**.
2. Select [gtm/demo-basic-consent.import.json](gtm/demo-basic-consent.import.json) and your workspace.
3. Choose **Merge**, inspect the preview, and confirm **5 tags, 2 custom triggers and 1 Constant variable**, plus the CMP template.
4. Set **Variables → Demo - Cookiebot Domain Group ID** to your own ID.
5. Still enable **Admin → Container Settings → Additional Settings → Enable consent overview → Save** and complete the audit and tests above.

Do not import on top of your completed manual setup and create duplicates. Importing does not publish the container, configure your website's environment, or authorize a hostname in Cookiebot.

## Troubleshooting

| Symptom                              | Check                                                                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Consent Overview icon missing        | Enable it in **Admin → Container Settings → Additional Settings**, then Save.                                                              |
| Banner absent on localhost           | Check Cookiebot's domain authorization, not just the app's allowed-host list. Use the registered public hostname for scanning and filming. |
| No GTM loaded                        | Confirm `GtmLoader` is enabled, GTM ID and allowed hosts are correct, and the deployment was rebuilt after env changes.                    |
| Zero receipts even after consent     | Confirm GTM is present; a direct-banner-only experiment contains no GTM demo tags. Then check the event's trigger and consent.             |
| Category tag only works after reload | Check the exact `cookie_consent_update` spelling and additional consent. An All Pages event is not replayed when consent changes.          |
| Works only in Preview                | Publish the GTM container and retest outside Preview.                                                                                      |
| Duplicate events or banners          | Check for a second GTM loader, direct CMP script, duplicate tags or native platform integrations.                                          |
| Side panel says blocked              | Verify the actual tag result in Tag Assistant; the panel's consent label alone isn't execution proof.                                      |

## Adding real Analytics or Meta later

This project intentionally has no measurement destination. For actual reporting, add a separate test GA4 property or Meta setup, configure its event parameters and consent requirements, then verify requests and destination ingestion. The existing receipts don't do that work for you. See the [optional real-tracking extension](RECORDING_GUIDE.md#15-optional-real-ga4-extension).

## For contributors and presenters

- `src/app/layout.tsx` mounts `DemoProvider` and `GtmLoader` globally.
- `src/components/GtmLoader.tsx` contains the single Next.js Script.
- `src/hooks/useDemo.ts` owns demo state/actions; `src/integrations/consent-client.ts` bridges Cookiebot and the data layer.
- `gtm/demo-basic-consent.import.json` contains the exact tag configuration reproduced above.
- [RECORDING_GUIDE.md](RECORDING_GUIDE.md) contains narration, setup screenshots and the filming checklist.

Run `npm run check` for lint, TypeScript, automated tests and a production build. These local tests don't replace the real-banner/Tag Assistant checks.

This is the **GTM tutorial configuration**. The [hosted sandbox](https://fieldnotes-consent-demo-2026.vercel.app/) may be temporarily changed during filming; follow the steps on your own copy rather than assuming the shared site's current setup. Documentation checked on 8 September 2026.
