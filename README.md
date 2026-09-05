# Fieldnotes — Cookiebot + GTM demo

A notebook shop that makes cookie consent visible: **shop actions still work, but tracking tags wait for permission.**

[Try the live demo](https://fieldnotes-consent-demo-2026.vercel.app/?mode=after) · **[Sign up for Cookiebot](https://usercentrics.sjv.io/sonnysangha)**

The signup link is Sonny’s affiliate/referral link.

GTM really runs or blocks the demo tags. Orders are simulated, and the tags report back to the page. **This project sends no analytics events to GA4, Google Ads or Meta.**

## What you’re setting up

| Part | Its job |
|---|---|
| Cookiebot | Collect the visitor’s consent choices. |
| Google Tag Manager | Run a tag only when its event and consent rules allow it. |
| The shop’s side panel | Show which shop actions produced an actual tag receipt. |

This README takes you through the **quick setup using the included GTM imports**. Follow the steps in order.

**Filming the setup?** Use the [recording guide](RECORDING_GUIDE.md#7-build-the-after-container-on-camera) to create the tags manually, with screenshots and ready-to-read explanations. It also explains [direct script vs GTM](RECORDING_GUIDE.md#choose-the-installation-before-opening-gtm) and [Basic vs Advanced Consent Mode](RECORDING_GUIDE.md#where-google-consent-mode-fits).

## 1. Copy and deploy the shop

You need Git, a current Node.js LTS release, and accounts for Cookiebot, GTM and a static website host.

```bash
git clone https://github.com/sonnysangha/fieldnotes-cookiebot-gtm-demo.git
cd fieldnotes-cookiebot-gtm-demo
npm run dev
```

Open `http://127.0.0.1:4173/`. There are no npm dependencies to install. The shop works, but tracking stays disconnected until you add your IDs below.

Deploy your copy to get a public hostname. With Vercel, import the repository and use its included configuration: build command `npm run build`, output directory `dist`.

**Keep the deployed URL handy.** Use a demo domain, separate from your business website.

## 2. Register the site in Cookiebot

1. [Open Cookiebot](https://usercentrics.sjv.io/sonnysangha).
2. Add your deployed hostname under **Domains & Aliases**.
3. Configure the banner for your demo and recording location. Start optional categories off.
4. Copy the **Domain Group ID** from the Implementation page.

**Don’t paste the direct Cookiebot script into this project.** The GTM template will load the banner in step 4.

## 3. Create one GTM container

In a dedicated demo GTM account, create one **Web** container named `Fieldnotes - Cookiebot Demo`. Copy its `GTM-…` ID.

You will demonstrate denied, granted and withdrawn consent in this same container. No second container is needed for these tests.

## 4. Import the tags

1. In the empty demo container, open **Admin → Import Container**.
2. Choose [demo-basic-consent.import.json](gtm/demo-basic-consent.import.json) and select your workspace.
3. Use **Merge** and review the preview: it should add **5 tags and 2 custom triggers**.
4. Confirm the import. Importing does not publish it.

Keep this import out of production containers.

In the **Cookiebot Demo** container, open **Variables → Demo - Cookiebot Domain Group ID**. Replace the placeholder with your Cookiebot ID and save.

The After tag list should look like this:

![The five After tags and their triggers](screenshots/gtm/01-after-tags.jpg)

**Why this works:** Cookiebot runs first on Consent Initialization. The optional demo tags have consent requirements. For example, the shop receipt tag matches `add_to_cart` or `purchase`, but it can only run when `analytics_storage` is granted.

## 5. Connect the shop to your IDs

Edit [`public/config.js`](https://github.com/sonnysangha/fieldnotes-cookiebot-gtm-demo/blob/main/public/config.js):

```javascript
window.DEMO_CONFIG = {
  baselineGtmId: '',
  gtmId: 'GTM-YOUR-AFTER-ID',
  gtmRevision: '1',
  cookiebotId: 'YOUR-COOKIEBOT-DOMAIN-GROUP-ID',
  allowedHosts: ['localhost', '127.0.0.1', 'your-site.vercel.app']
};
```

Leave `baselineGtmId` empty; it is only for the optional Before comparison. Replace the other placeholders with your actual IDs and hostname. Use the same Cookiebot ID as step 4. The hostname has no `https://` or path.

Redeploy the site and use **With Cookiebot** (`?mode=after`) throughout this walkthrough. Its loader already installs the selected GTM container, so **don’t add another GTM snippet**.

## 6. Test before publishing

In the After container, click **Preview** and connect to your deployed URL with `?mode=after`.

Open the site’s **Behind the banner** panel. Start with no saved grant; use **Withdraw consent** if needed and let the page reload.

| Test | What to do | What you should see |
|---|---|---|
| Denied | Deny optional consent. Add one notebook and place a demo order. | £18 confirmation; **2 shop actions / 0 tracked actions**. |
| Granted | Allow **Statistics only**. Add one more notebook and order again on the same page. | £18 confirmation; **4 shop actions / 2 tracked actions**, with Tag fired badges for the new actions. |
| Withdrawn | Withdraw consent, wait for reload, then add one and order again. | £18 confirmation; **2 shop actions / 0 tracked actions**. |

In **Tag Assistant**, select a `purchase` event and inspect `Demo - Consented shop event receipt`. Verify its trigger matched but consent blocked it in the denied test. Select the new purchase after granting Statistics and verify that the tag fired.

A `purchase → dataLayer` entry means the shop recorded an internal action. **It does not mean a tracker fired.** The separate Tag fired receipt is the evidence in this demo.

For the full checking sequence, see [Tag Assistant verification](RECORDING_GUIDE.md#10-preview-and-verify-in-tag-assistant).

## 7. Publish and repeat the test

Once Preview passes, **Submit → Publish** the container. Give the version a clear name, then repeat the denied → granted → withdrawn test outside Preview.

That’s the core demonstration: shopping continues to work, while consent determines whether tracking tags run.

<details>
<summary>Optional: show the site before a banner was installed</summary>

The hosted reference also has a separate **Before** container for an unrestricted comparison. Only one container loads per page. This extra container is a filming convenience, not a normal installation requirement.

To reproduce it, create a second empty Web container, import [demo-before-banner.import.json](gtm/demo-before-banner.import.json), enter its ID in `baselineGtmId`, redeploy, preview and publish. See the [Before setup](RECORDING_GUIDE.md#8-build-the-before-container).

For that take, select Before, add twice and order: expect 3 shop actions / 3 tracked actions and £36. Click Clear demo cookies before switching back to With Cookiebot, then withdraw any saved consent before the denied take.

</details>

## Finish the Cookiebot setup

Check the domain scan in Cookiebot, review the classifications and any issues, then open **Cookie declaration** from the shop footer. A displayed declaration is not proof that the scan has finished.

For real Google Analytics or Meta tracking, you must add and verify those destinations separately. This demo’s receipt badges prove local GTM tag execution only.

## If something looks wrong

| Problem | First check |
|---|---|
| No banner | Correct hostname and Cookiebot ID; banner applies to your location. |
| No GTM connection | Your `gtmId`, Cookiebot ID and `allowedHosts` in `public/config.js`; redeploy after edits. |
| Works only in Preview | Publish the container and retest outside Preview. |
| Cookies remain after Before | Use Clear demo cookies before the After take. |
| Purchase appears after denying | Internal shop events are expected. Check whether the tracking tag fired. |

**More detail:** [manual setup and screenshots](RECORDING_GUIDE.md#7-build-the-after-container-on-camera) · [recording script](RECORDING_GUIDE.md#11-record-the-before-and-after-demonstration) · [installation choices](RECORDING_GUIDE.md#choose-the-installation-before-opening-gtm) · [tag code](RECORDING_GUIDE.md#18-copy-and-paste-tag-code)
