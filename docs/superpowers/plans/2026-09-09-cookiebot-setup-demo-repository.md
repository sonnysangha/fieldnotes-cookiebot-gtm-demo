# Cookiebot Setup Demo Repository Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the existing public GitHub repository and make the README introduce it as the companion project for the Cookiebot setup YouTube video.

**Architecture:** Keep the existing Git history and GitHub repository, rename it in place, and update the local remote to the canonical renamed URL. Limit tracked-file changes to README copy and clone instructions; retain the existing referral URL and all tutorial content below the introduction.

**Tech Stack:** Markdown, Git, GitHub CLI, npm, Next.js project checks

## Global Constraints

- The repository must remain public.
- The repository name must be `Cookiebot-Setup-Demo`.
- Keep `https://usercentrics.sjv.io/sonnysangha` unchanged and prominent.
- Do not add a YouTube URL because none was provided.
- Do not create or delete a second GitHub repository.
- Preserve the existing repository history and tutorial content.

---

### Task 1: Update the README introduction

**Files:**
- Modify: `README.md:1-7`
- Modify: `README.md:27-29`

**Interfaces:**
- Consumes: the existing Cookiebot referral URL and tutorial text.
- Produces: a video-companion introduction and working clone instructions for the renamed repository.

- [ ] **Step 1: Run a content assertion before editing**

Run:

```bash
node --input-type=module <<'EOF'
import { readFileSync } from "node:fs";

const readme = readFileSync("README.md", "utf8");

if (!readme.startsWith("# Cookiebot Setup Demo\n")) {
  throw new Error("README heading is not updated");
}
EOF
```

Expected: FAIL with `README heading is not updated`.

- [ ] **Step 2: Replace the heading and opening copy**

Set the start of `README.md` to:

```markdown
# Cookiebot Setup Demo

This repository accompanies our YouTube video, where we walk through setting up Cookiebot and explore the benefits of using it for consent management with Google Tag Manager.

Follow along by building a notebook shop where visitors can shop normally while optional tracking waits for consent. The demo uses **one GTM Web container**, the official Cookiebot CMP template, and four small demonstration tags.

**[Sign up for Cookiebot by Usercentrics](https://usercentrics.sjv.io/sonnysangha)**

The signup link is Sonny's affiliate/referral link.
```

Change the clone instructions to:

```bash
git clone https://github.com/sonnysangha/Cookiebot-Setup-Demo.git
cd Cookiebot-Setup-Demo
npm ci
npm run dev
```

- [ ] **Step 3: Verify the README content**

Run:

```bash
node --input-type=module <<'EOF'
import { readFileSync } from "node:fs";

const readme = readFileSync("README.md", "utf8");
const requiredText = [
  "# Cookiebot Setup Demo",
  "This repository accompanies our YouTube video",
  "benefits of using it for consent management with Google Tag Manager",
  "https://usercentrics.sjv.io/sonnysangha",
  "git clone https://github.com/sonnysangha/Cookiebot-Setup-Demo.git",
  "cd Cookiebot-Setup-Demo",
];

for (const text of requiredText) {
  if (!readme.includes(text)) {
    throw new Error(`README is missing: ${text}`);
  }
}

console.log("README checks passed");
EOF
git diff --check
```

Expected: `README checks passed`, followed by exit code 0 from `git diff --check`.

- [ ] **Step 4: Run the project checks**

Run:

```bash
npm run check
```

Expected: lint, typecheck, tests, and production build all exit successfully.

- [ ] **Step 5: Commit the README**

Run:

```bash
git add README.md
git commit -m "docs: introduce Cookiebot video companion"
```

Expected: one commit containing only the README update.

### Task 2: Rename and publish the existing GitHub repository

**Files:**
- Modify locally: `.git/config` through `git remote set-url` (not tracked)
- Modify externally: GitHub repository metadata for `sonnysangha/fieldnotes-cookiebot-gtm-demo`

**Interfaces:**
- Consumes: the authenticated `sonnysangha` GitHub CLI session and the existing public repository.
- Produces: `https://github.com/sonnysangha/Cookiebot-Setup-Demo` as the canonical public repository URL.

- [ ] **Step 1: Verify the source repository and target name**

Run:

```bash
gh auth status
gh repo view sonnysangha/fieldnotes-cookiebot-gtm-demo --json nameWithOwner,visibility,url
if gh repo view sonnysangha/Cookiebot-Setup-Demo >/dev/null 2>&1; then
  echo "Target repository already exists" >&2
  exit 1
fi
```

Expected: GitHub authentication succeeds, the source reports `PUBLIC`, and the target-name check exits 0 without output.

- [ ] **Step 2: Rename the repository in place**

Run:

```bash
gh repo rename -R sonnysangha/fieldnotes-cookiebot-gtm-demo Cookiebot-Setup-Demo --yes
```

Expected: exit code 0.

- [ ] **Step 3: Update the local remote and push**

Run:

```bash
git remote set-url origin https://github.com/sonnysangha/Cookiebot-Setup-Demo.git
git push -u origin main
```

Expected: `main` is up to date on the renamed repository and tracks `origin/main`.

- [ ] **Step 4: Verify the final public repository**

Run:

```bash
gh repo view sonnysangha/Cookiebot-Setup-Demo --json nameWithOwner,visibility,url,defaultBranchRef
git remote get-url origin
git status --short
```

Expected:

```text
{"defaultBranchRef":{"name":"main"},"nameWithOwner":"sonnysangha/Cookiebot-Setup-Demo","url":"https://github.com/sonnysangha/Cookiebot-Setup-Demo","visibility":"PUBLIC"}
https://github.com/sonnysangha/Cookiebot-Setup-Demo.git
```

`git status --short` must produce no output.
