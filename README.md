# Fieldnotes — Cookiebot + GTM demo

A Next.js 16 + TypeScript notebook shop that makes cookie consent visible: **shop actions still work, but tracking tags wait for permission.**

[Try the live demo](https://fieldnotes-consent-demo-2026.vercel.app/) · **[Sign up for Cookiebot](https://usercentrics.sjv.io/sonnysangha)**

The signup link is Sonny’s affiliate/referral link.

GTM really runs or blocks the demo tags. Orders are simulated, and the tags report back to the page. **This project sends no analytics events to GA4, Google Ads or Meta.**

## What you’re setting up

| Part | Its job |
|---|---|
| Cookiebot | Collect the visitor’s consent choices. |
| Google Tag Manager | Run a tag only when its event and consent rules allow it. |
| The shop’s side panel | Show which shop actions produced an actual tag receipt. |

This README takes you through the **quick setup using the included GTM import**. Follow the steps in order.

**Filming the setup?** Use the [recording guide](RECORDING_GUIDE.md#7-build-the-container-on-camera) to create the tags manually, with screenshots and ready-to-read explanations. It also explains [direct script vs GTM](RECORDING_GUIDE.md#choose-the-installation-before-opening-gtm) and [Basic vs Advanced Consent Mode](RECORDING_GUIDE.md#where-google-consent-mode-fits).

### Which Cookiebot instructions does this use?

**Cookiebot → Implementation → CMP Banner → Google Tag Manager** is the installation route for this project. Follow the [official GTM deployment guide](https://support.cookiebot.com/hc/en-us/articles/360003793854-Google-Tag-Manager-deployment).

The official Cookiebot CMP template loads the banner and sets Consent Mode defaults and updates. This project does **not** also embed the direct auto-blocking snippet or the GCM tab’s inline default script. The GTM consent requirements below control the demo tags; the banner alone does not automatically block every arbitrary script in a React app.

## 1. Copy and deploy the shop

You need Git, Node.js 24.15+, and accounts for Cookiebot, GTM and a Next.js website host.

```bash
git clone https://github.com/sonnysangha/fieldnotes-cookiebot-gtm-demo.git
cd fieldnotes-cookiebot-gtm-demo
npm install
npm run dev
```

Open `http://127.0.0.1:4173/`. The app uses the Next.js App Router. The shop works, but tracking stays disconnected until you add your IDs below.

Deploy your copy to get a public hostname. With Vercel, import the repository and use its included configuration: the Next.js framework preset and build command `npm run build`.

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

The tag list should look like this:

![The five tags and their triggers](screenshots/gtm/01-after-tags.jpg)

**Why this works:** Cookiebot runs first on Consent Initialization. The optional demo tags have consent requirements. For example, the shop receipt tag matches `add_to_cart` or `purchase`, but it can only run when `analytics_storage` is granted.

## 5. Connect the shop to your IDs

Copy `.env.example` to `.env.local` and fill in your public identifiers:

```dotenv
NEXT_PUBLIC_GTM_ID=GTM-YOURID
NEXT_PUBLIC_COOKIEBOT_ID=YOUR-COOKIEBOT-DOMAIN-GROUP-ID
NEXT_PUBLIC_ALLOWED_HOSTS=localhost,127.0.0.1,your-site.vercel.app
```

Use the same Cookiebot ID as step 4. Hostnames have no `https://` or path. Add these same variables in **Vercel → Project Settings → Environment Variables**, then redeploy. Restart `npm run dev` after changing `.env.local`.

The app renders **one `next/script` component with `strategy="afterInteractive"`** after validating the hostname and preparing `dataLayer`. Cookiebot loads from the official CMP tag inside GTM. **Do not paste another GTM or Cookiebot banner script into the app.**

## 6. Test before publishing

In the container, click **Preview** and connect to your deployed URL without any special mode parameter.

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


## Finish the Cookiebot setup

Check the domain scan in Cookiebot, review the classifications and any issues, then open **Cookie declaration** from the shop footer. A displayed declaration is not proof that the scan has finished.

For real Google Analytics or Meta tracking, you must add and verify those destinations separately. This demo’s receipt badges prove local GTM tag execution only.

## If something looks wrong

| Problem | First check |
|---|---|
| No banner | Correct hostname and Cookiebot ID; banner applies to your location. |
| No GTM connection | The three `NEXT_PUBLIC_…` environment variables above; redeploy after edits. |
| Works only in Preview | Publish the container and retest outside Preview. |
| Purchase appears after denying | Internal shop events are expected. Check whether the tracking tag fired. |

**More detail:** [manual setup and screenshots](RECORDING_GUIDE.md#7-build-the-container-on-camera) · [recording script](RECORDING_GUIDE.md#11-record-the-consent-demonstration) · [installation choices](RECORDING_GUIDE.md#choose-the-installation-before-opening-gtm) · [tag code](RECORDING_GUIDE.md#18-copy-and-paste-tag-code)

## Project structure

- `src/app/` — App Router page, root layout and metadata.
- `src/components/Storefront.tsx` — Server Component for the static storefront; uses `next/image`.
- `src/components/ShopControls.tsx` — small client components for shopping and consent actions.
- `src/App.tsx` — client provider, dialogs and the single **Next Script GTM loader**.
- `src/hooks/useDemo.ts` — typed reducer and action handlers; SDK subscriptions clean up on unmount.
- `src/domain/` — pure state transitions, product data and cart calculations.
- `src/integrations/consent-client.ts` — typed Cookiebot/dataLayer bridge. It never creates the GTM script or owns UI state.
- `.env.example` — public configuration variable names; actual `.env.local` stays untracked.
- `gtm/demo-basic-consent.import.json` — the five-tag container import.

Run `npm run check` for Next.js/React lint, strict TypeScript checks, interaction and integration tests, and the production build. `npm run format` formats the source. Use `npm run build && npm start` to test the production server locally.

React Strict Mode is enabled. The server renders the storefront; only interactive controls and the live inspector need client code. The app does not mutate `document.body`, use `classList`, or force updates with `flushSync`. Native dialog/focus APIs use React refs. The cookie declaration SDK receives one isolated host because Cookiebot renders that document itself.

Local tests use a receipt test double; they do not claim that Google Analytics or Meta received data. Use the real Cookiebot banner and Tag Assistant walkthrough above for deployed verification.

Verified on 7 September 2026: `npm run check` passed (12 tests). The deployed Next.js app returned **2/0 → 4/2 → 2/0** shop/tracked actions through denied, Statistics granted and withdrawn consent. Exactly one GTM script loaded with `data-nscript="afterInteractive"`; the cookie declaration rendered successfully.
