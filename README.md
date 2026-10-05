# Art of Stat Student Hub

A student guide for STAT C1000, adapted from the instructor’s **Art of Stat Guide**. Includes 18 tools, original video links and relevant screenshots, search, task filters, expandable instructions, and a guided tool chooser.

## Preview first

Open **dist/index.html** in a browser. It works directly from your computer, including search and the chooser. Keep its **assets** folder beside it for screenshots. No installation or account is needed to preview.

## Publish once with GitHub + Netlify

1. Unzip this package.
2. Create a GitHub repository, for example **art-of-stat-hub**.
3. Upload the **contents** of the `art-of-stat-hub` folder to the repository root. You should see `netlify.toml`, `README.md`, `data`, `scripts`, `site`, and `dist` at the root, rather than one extra enclosing folder.
4. To include the optional `.github/workflows/validate.yml` check, ensure the `.github` folder is uploaded too. Windows may treat dot-prefixed folders differently; GitHub's web upload may require uploading that file separately at its exact path. The site can deploy without this optional check.
5. In Netlify, choose **Add new project → Import an existing project → GitHub**, authorize the repository, and select it.
6. Use these settings (also supplied by `netlify.toml`):

| Setting | Value |
| --- | --- |
| Production branch | `main` (or the branch you actually use) |
| Base directory | Leave blank |
| Build command | `node scripts/build.mjs` |
| Publish directory | `dist` |
| Node version | `22` (configured in the file) |

7. Publish. Confirm that students can access the resulting address without signing in; Netlify teams can have different access settings.
8. Share the Netlify address in Canvas. That same address remains the student entry point for future updates.

Official instructions: https://docs.netlify.com/start/quickstarts/deploy-from-repository/
Configuration reference: https://docs.netlify.com/build/configure-builds/file-based-configuration/

## The routine update process

**Edit the content → commit in GitHub → Netlify builds and deploys → check the live page.**

For a changed video, note, or instruction:

1. Open **data/tools.json** in GitHub and choose Edit.
2. Find the tool by its `id` or `title`.
3. Change its video URL, steps, course note, or description. Keep JSON punctuation intact: double quotes, commas between items, no trailing comma.
4. Update `site.updated` with the review date in `YYYY-MM-DD` format.
5. Commit the change to the production branch with a clear message, such as **Update paired t-test video**.
6. Wait for Netlify’s deploy to finish, then check the changed card. If validation fails, read the error and fix the content; no successful new deployment will replace the previous page until the issue is resolved.

**Do not edit dist/index.html for routine updates.** It is generated from the source and overwritten during the next build.

### A new resource for an existing tool

Add an object to that tool’s `videos` array:

```json
{
  "label": "Watch another example",
  "url": "https://your-real-video-url"
}
```

Use a descriptive label and a real HTTPS link. Multiple videos appear together on the same card.

### Add a new tool

Copy an existing object in `tools`, give it a unique `id`, and update its content. **data/example-tool.json** shows the full shape but is not part of the live content; replace its placeholder URL before copying it. Category choices: `describe`, `probability`, `estimate`, `test`, `relationships`.

Every tool needs these fields:

| Field | What you edit |
| --- | --- |
| `id` | Unique lowercase identifier with hyphens; keep it stable for direct links |
| `category` | One of the category IDs above |
| `title` | Student-facing tool title |
| `useWhen` | The task this tool helps with |
| `appName` | Exact app name students should look for |
| `appUrl` | HTTPS link; currently the official web-app directory |
| `location` | Directory section where the app is located |
| `inputs` | Information the student should have ready |
| `steps` | An array of short instructions |
| `interpret` | How to explain the result in context |
| `courseNote` | Required settings or reminder; use `""` if none |
| `videos` | Array of labeled HTTPS links; use `[]` if none |
| `screenshots` | Array of image paths and meaningful alt text; use `[]` if none |
| `keywords` | Extra words that should find the tool in search |
| `objectiveCodes` | Learning objective codes; use `[]` until confirmed |
| `resources` | Optional extra labeled links |

New tools automatically appear in their category and become searchable after the build. **Adding a card does not automatically change the chooser.** Follow the next section to route a chooser answer to it.

### Update “Not sure which tool?”

Open **data/chooser.json**. Each node is either a question with labeled options or a result with tool IDs. The `next` field points to another node.

A result looks like this:

```json
"r-new-tool": {
  "tools": ["your-new-tool-id"],
  "explanation": "Explain why this is a useful starting point."
}
```

Add a reachable option to an appropriate question:

```json
{
  "label": "A clear student-facing answer",
  "next": "r-new-tool"
}
```

For example, after adding a one-sample t-test card with ID `one-mean-test`, replace the `missing-one-mean-test` node’s empty `tools` array with `["one-mean-test"]` and update its explanation. The existing question already routes to that node.

The build checks for missing tool IDs, broken node references, cycles, unreachable nodes, duplicate IDs, missing local images, and malformed JSON. It checks URL syntax, not whether an external service is available. Check updated video and app links yourself.

### Add a screenshot

1. Put the image in **site/assets/** with a short filename without spaces.
2. Add a screenshot object, for example:

```json
{
  "src": "assets/paired-example.png",
  "alt": "Describe the controls or results shown in the screenshot."
}
```

The build copies it into `dist/assets`. Avoid sharing student identifiers in screenshots.

## Working with ChatGPT on future changes

Share the current repository files or ZIP and say, for example:

> Add a one-sample t-test resource to the Art of Stat Hub. Here is my video link and course procedure. Add its card to data/tools.json, connect the existing one-mean-test chooser path, update the date, and return the changed files with a tested build.

Or:

> Replace the normal-percentile video and revise these steps. Keep the tool ID and the rest of the page intact.

You can replace only the changed source files in GitHub, then commit. Netlify rebuilds from those sources. The generated `dist` folder is included in this initial package for local preview and optional manual deployment.

## Optional local development

Requires Node 22 or newer. No third-party dependencies, package installation, or build framework.

```bash
node scripts/build.mjs
```

Then open `dist/index.html`. For a server preview, from the project folder:

```bash
python -m http.server 8000 --directory dist
```

Open http://localhost:8000.

## File map

- **data/tools.json** — cards, links, settings, steps, and optional objective codes.
- **data/chooser.json** — decision guide questions and recommendations.
- **site/index.template.html** — page structure.
- **site/styles.css** — layout and colors.
- **site/app.js** — chooser, search, and filters.
- **site/assets/** — relevant screenshots extracted from the source guide.
- **scripts/build.mjs** — content validation and static page generation.
- **netlify.toml** — hosting build settings.
- **.github/workflows/validate.yml** — optional automatic check on pushes and pull requests.
- **dist/** — ready-to-preview/deploy output.

## Content notes

- Original videos, timestamps, the regression example explanation, and applicable WALD/SCORE reminders are retained. Repeated links in the original document are consolidated.
- All “Open Art of Stat” buttons go to the official app directory; directions identify the section and app. Direct app URLs were not guessed.
- Navigation names were cross-checked against the official directory. Original screenshots and video demonstrations may show an earlier interface.
- The written “use when” and interpretation prompts are instructional additions. Source-only video entries have concise orientation steps; video procedures were not independently verified.
- Objective-code arrays are intentionally empty until the instructor confirms alignment.
- The chooser provides a starting point, not an automatic check of sample assumptions. Missing one-mean test and two-mean/paired interval tutorials explicitly refer students to the instructor.
- The page has no accounts, student data collection, tracking scripts, or embedded videos. Links open externally.

## Verification for this package

The build passed content and chooser validation. Interaction checks exercised the actual page JavaScript in a DOM harness across all 25 possible chooser paths, back/restart, each category filter, search, no-result recovery, and recommendation links that reveal a previously hidden card. Generated HTML checks passed for unique IDs, local image references, alt text, and internal anchors.

A browser executable was unavailable in the creation environment, so visual layout, real-browser keyboard behavior, and mobile rendering were not independently verified. Before sharing with students, open `dist/index.html` on your computer and phone (via the deployed address), check the chooser, and try your class videos. The page has responsive layout rules, visible keyboard focus, a skip link, native expandable instructions, and reduced-motion support.

## Screenshot update — October 4, 2026

Five supplied images now appear directly on the Summary Statistics, Graphs, Categorical Data, Expected Value, and One-Mean Interval cards. The generically named screenshot duplicated the one-mean image and is not displayed twice. Each new image has descriptive alt text and a full-size link. Instructions were refined using visible controls in the screenshots, and the normal-percentile tab name was corrected to **Find Percentile/Quantile**.

The new `screenshots` fields `featured: true` and optional `caption` make an image visible on the card. Without `featured`, the screenshot stays inside the expandable directions.

**dist/preview.html** is a self-contained visual preview with embedded images. It works without the asset folder; full-size screenshots open in a dialog. **dist/index.html** is the production page with ordinary image files. Both are generated by the build.

Screenshot-based instruction review confirms the displayed configuration; it is not an independent test of every calculator mode or assumption. The one-mean screenshot uses a built-in textbook dataset rather than the student's own data. Expected-value instructions explicitly separate the population mean from sampling simulations.
