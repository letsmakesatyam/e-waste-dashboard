# Circular Lab
Satyam Revgade · 24102A0035 · TE CMPN A · VIT Mumbai  
E-waste & Environmental Management (VEC02) · Semester V · 2026–27  
Faculty: Prof. Aniket Kundu · Vidyalankar Institute of Technology, Mumbai

---

## Open the Project
Extract the complete ZIP first. Double-click `START_WINDOWS.bat` if Python is installed, or run from the project root:

```bash
python serve.py
```

Then open **http://localhost:8000** in any modern web browser.  
No `npm install`, build step, external framework, API key, backend database or paid service is required.  
You can also open `dist/index.html` directly for reading, but running over a local server enables full IndexedDB browser storage and document previews without browser security restrictions.

---

## Dashboard Improvements & Interface Features
The dashboard preserves its signature **forest-green, ivory and lime** design identity while providing high-contrast readability, accessible typography and self-explanatory interactive features.

### 1. Typography & Readability (WCAG Accessible)
- **Body text, descriptions, inputs, dropdowns and buttons:** Minimum 16px (1rem) with 1.65 line-height.
- **Secondary text, metadata, badges and navigation:** Minimum 14px (0.875rem) with bold tags and comfortable contrast ratios (>= 4.5:1).
- **Assignment titles:** Approximately 20–24px (22px on cards, 24–26px in dialogs).
- **Section headings:** Approximately 32–40px with responsive clamp sizing.
- **Hero heading:** Prominent and responsive `Nothing wasted. Everything learned.`.
- **Spacing & Layout:** Removed all tiny labels (<14px) and excessive letter spacing. Generous padding on touch targets (minimum 44px height for interactive buttons). Full mobile readability down to 360px without zoom, clipping or horizontal overflow.
- **200% Browser Zoom Support:** All elements, dialogs and navigation adjust cleanly without clipping or broken layouts.

### 2. Self-Explanatory Buttons & Navigation
Buttons use direct, user-friendly labels with supporting icons:
- **“View assignment”** (replaces “Explore work”)
- **“Upload assignment files”** (replaces “Add evidence”)
- **“Edit assignment and manage files”** (replaces “Edit / attach evidence”)
- **“Download dashboard backup”** (replaces “Export backup”)
- **“Restore dashboard backup”** (replaces “Import backup”)
- **“List view” / “Grid view”** (replaces icon-only layout toggle)
- **“Switch to dark mode” / “Switch to light mode”** (replaces icon-only theme toggle)
- **“Download original file”** (replaces “Download original”)
- **“Clear search and filters”** (instant filter reset)
- **“Remove Course Outcome filter”** (visible pill removal button)

### 3. Academic Assessment Context & Course Outcomes
The dashboard features an integrated, permanently visible **Academic Assessment Guide**:
- **ISA (In-Semester Assessment):** Continuous evaluation coursework (Assignments 00–03) covering course planning foundations, the Rajasthan state e-waste tracker, and elemental material studies.
- **ESE (End-Semester Exam / Assessment):** Comprehensive semester projects (Assignments 04–10) covering circular material recovery, corporate compliance audits, global waste regulations, college campaigns, LEED certification, case studies, and IEEE research analysis.
- **CO1–CO5 (Course Outcomes):** Editorial mapping aligning each assignment to curriculum outcomes defined by Mumbai University / VIT:
  - **CO1:** Understand e-waste management principles, recycling fundamentals, and environmental responsibility.
  - **CO2:** Analyse regulatory frameworks, policies, and corporate Extended Producer Responsibility (EPR) compliance.
  - **CO3:** Evaluate material recovery technologies, advanced processing methods, and recycling monitoring tools.
  - **CO4:** Assess local and global environmental impacts of engineering solutions and municipal waste systems.
  - **CO5:** Practise sustainable habits, college campaigns, and community e-waste collection and safety.
- **Active Course Outcome Banner:** Displays the current outcome title, description and an easy one-click removal button.

### 4. Assignment Previews & Details Dialog
- **Readable Metadata:** Clearly displays assignment number (00–10), assessment group, course outcome, category, description, and attached file summary.
- **File Selector:** Explicitly labeled **“Choose a file to preview”** with individual file badges showing readable names, file extensions (PDF, DOCX, XLSX, PPTX, PNG, MP4), and human-formatted sizes (e.g. `530.7 KB`, `1.44 MB`).
- **Preview Distinctions & Explanations:**
  - **Page Previews (PDF):** Explains that rendered page images are displayed and provides a prominent button to download the searchable vector original.
  - **Text & Table Previews (DOCX, PPTX, XLSX):** Explains that extracted text and tables are shown for in-browser reading, while full formulas, animations and original formatting are preserved in the downloadable file.
  - **Image & Video:** Native inline display with camera resolution download options.
  - **Unsupported Formats:** Displays a clear, friendly notification that native desktop software is required, accompanied by a prominent **“Download original file”** button.
- **Empty Assignments:** Open slots display:
  > *“No files added yet. Upload your work for this assignment.”*  
  along with an immediate **“Upload assignment files now”** action button.
- **Partial Assignments:** Prominently highlights missing components in a dedicated warning callout (e.g. Assignment 06 notes missing startup proposal; Assignment 10 notes missing original IEEE publication).
- **Submission Integrity Disclaimer:** Clarifies that file availability represents uploaded coursework resources and does not imply verified faculty grading, completion, or formal submission.

### 5. Adding & Editing Assignments
- Clear field labels with required indicators (`*`) and helpful placeholder examples.
- Pre-upload explanation of supported formats (PDF, PNG, JPG, JPEG, WEBP, MP4, DOCX, PPTX, XLSX, TXT) and upload limits (150 MB total per batch).
- **Staged File Management:** Newly selected files are displayed in a staged queue with names, sizes and individual `[✕ Remove]` buttons before committing changes to storage.
- **Interactive Saving State:** Form submit button displays **“Saving assignment…”** and disables to prevent duplicate submissions.
- **Storage Transparency:** Form and dashboard clearly state:
  > *“Changes are saved only in this browser. Download a backup to keep a copy or move your changes to another device.”*
  > *“A backup does not automatically update the published website.”*

---

## Assignment Mapping & Academic Inventory

| No. | Assessment | Course Outcome | Activity Title | Evidence Attached |
|:---:|:---:|:---:|---|---|
| **00** | ISA | CO1 | AAP / course insights | Course insights PDF + academic plan DOCX |
| **01** | ISA | CO4 | Rajasthan · state e-waste tracker | Rajasthan FY2025–26 report PDF (modelled data) |
| **02** | ISA | CO3 | Elemental blueprint | *Awaiting files (no supplied submission)* |
| **03** | ISA | CO4 | State tracker · presentation | *Awaiting files (no supplied submission)* |
| **04** | ESE | CO3 | Reimagining material recovery | Automated laser + molten-salt concept poster PNG |
| **05** | ESE | CO2 | Five companies. One responsibility. | Five-company corporate compliance study DOCX |
| **06** | ESE | CO2 | Startup ideas & waste regulations | Rules comparison PDF *(partial: startup proposal pending)* |
| **07** | ESE | CO5 | Small gadgets. Big responsibility. | College campaign poster PNG + creative MP4 film |
| **08** | ESE | CO4 | LEED · building a better baseline | Scorecard XLSX + LEED v5 BD+C reference PDF |
| **09** | ESE | CO4 | Systems worth studying | Original report DOCX + 5 case studies presentation PPTX |
| **10** | ESE | CO3 | Research into real barriers | In-class paper analysis PDF *(partial: IEEE source pending)* |

---

## Incorporating Backups into the Distributable Site
Browser changes are saved in the client browser’s IndexedDB (`circular-lab-v1`). They do not alter the source files on disk or automatically update a live static host.

To incorporate a downloaded backup into the distributable project:

1. Click **“Download dashboard backup”** in the header or storage card to save `circular-lab-backup.json`.
2. Run the integration script from your terminal:
   ```bash
   python apply_backup.py path/to/circular-lab-backup.json
   ```
3. This updates `dist/data.js` and writes any newly uploaded files into `dist/assets/`.
4. Deploy the contents of `dist/` to Netlify, GitHub Pages, Vercel, or any static host.

---

## Project Structure
- `dist/index.html` — Accessible markup, semantic sections, guides, native dialogs and forms.
- `dist/style.css` — High-contrast stylesheet adhering to >=16px body/inputs/buttons and >=14px secondary text.
- `dist/app.js` — Client-side interactions, IndexedDB persistence, file staging, backups, and modal viewers.
- `dist/data.js` — Initial bundled assignment dataset (`window.SEED`).
- `dist/assets/` — Preserved original coursework submissions, reports, spreadsheets and campaign media.
- `dist/previews/` — Extracted text/table and page previews for in-browser inspection.
- `mapping.json` — Human-readable inventory and resource metadata.
- `apply_backup.py` — Python utility for incorporating client backups into the static distributable site.
- `serve.py` — Lightweight local HTTP development server.
