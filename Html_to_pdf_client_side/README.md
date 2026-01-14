# HTML/JS to PDF Exporter for Classic ASP (and more)

## Project goal

This project provides a **portable, client‑side solution with no server‑side PDF tools** required, to:

1. **Export to PDF** the content of a web page (HTML + CSS + current form values) in a way that is:
   - readable,
   - reasonably laid out in **A4 format**,
   - split across **multiple A4 pages** if needed.

2. **Download the PDF locally** (pure HTML/JS demo).

3. **Save the PDF into a folder on the server** (Classic ASP demo) and:
   - store it on disk at a configurable path,
   - open it in a **new browser tab** for the user.

The solution targets:

- Existing **Classic ASP** applications (IIS/Windows Server) where:
  - you cannot install extra server components (wkhtmltopdf, Chromium headless, etc.),
  - you want to remove dependencies on old, unsupported plugins/ActiveX.
- Any web application that wants to use **plain HTML + JS**, independently of ASP.

---

## High‑level architecture

The architecture is intentionally simple and split into two independent parts.

### 1. Client side (browser) – PDF generation

The heavy work is done **in the browser, via JavaScript**, using third‑party libraries shipped locally with the project.

Main technologies:

- [`html2canvas`](https://github.com/niklasvh/html2canvas)  
  Captures the rendering of an HTML element as an image (canvas), including current styles.

- [`jsPDF`](https://github.com/parallax/jsPDF)  
  Creates a PDF document, and lets you:
  - set **A4 page size**,
  - add images to pages,
  - handle **multiple pages** and margins.

- **Custom project library**: `pdf-export.js`  
  A small wrapper that:
  - clones the DOM,
  - “freezes” form values into the cloned markup,
  - calls `html2canvas` and `jsPDF` with the appropriate parameters,
  - exposes a simple API for developers.

> Note: all JS libraries are meant to be loaded from **local files** (no CDN), so you can work offline and control versions explicitly.

### 2. Server side (Classic ASP) – File saving only

In a **Classic ASP** environment, the server does **not** generate the PDF.  
The PDF is created **in the browser** and then sent to the server already complete.

Flow:

1. The user clicks a “Save PDF on server” button.
2. JS:
   - generates a PDF `Blob` (using `pdf-export.js`),
   - converts it to base64 (to simplify the ASP side),
   - sends base64 and desired file name to a Classic ASP page (e.g. `save_pdf.asp`) via `POST`.

3. `save_pdf.asp`:
   - receives the base64 string,
   - decodes it to binary,
   - saves the `.pdf` file into a folder on the server (configurable path),
   - builds the public URL to the file,
   - returns that URL to the client (as plain text or JSON).

4. JS, after receiving the URL:
   - opens the PDF in a **new tab** (`window.open(url, '_blank')`),
   - optionally displays a confirmation message.

---

## Example configuration

Example configuration in `save_pdf.asp`:

```asp
Const PDF_SAVE_PATH = "D:\inetpub\wwwroot\YourSite\pdf\"
Const PDF_URL_BASE  = "/pdf/"
```

---

## Desired user experience

### Scenario 1 – Standalone HTML/JS page

Context: a simple HTML page (e.g. `examples/html-only/index.html`) showing a form with several fields.

Behavior:

1. The user fills in:
   - text inputs,
   - textareas,
   - selects, radio buttons, checkboxes, etc.
2. Clicks **“Save as PDF (download)”**.
3. JS:
   - reads the content of a container (e.g. `<div id="print-area">`),
   - clones the DOM and “locks” form values into the cloned HTML, so the PDF shows exactly what is on screen,
   - generates an A4 PDF, with multiple pages if needed,
   - starts a **local download** of the file (e.g. `document.pdf`).

Result:

- The PDF is saved on the user’s machine.
- Form values are visible.
- The layout is A4‑oriented, with sensible margins and no major content truncation.

### Scenario 2 – Classic ASP page

Context: an ASP page (e.g. `examples/classic-asp/example.asp`) with standard server‑side logic that renders a form.

Behavior:

1. The user fills in the form.
2. Clicks **“Save PDF on server”**.
3. JS (in the browser):
   - generates the PDF as in the HTML‑only case,
   - encodes it into base64,
   - posts the result to `save_pdf.asp`.
4. `save_pdf.asp`:
   - saves the PDF file to disk,
   - returns the URL to the client.
5. JS:
   - opens the PDF in a new tab,
   - or displays a link such as “Open saved PDF”.

Result:

- The PDF is stored in a server folder for later use (archive, email, download, etc.).
- The user immediately sees the generated PDF as visual feedback.

---

## Project structure (proposed)

```text
/
├─ lib/
│  ├─ pdf-export.js        # main project library
│  └─ pdf-export.d.ts      # (optional) TypeScript declarations / API docs
│
├─ vendor/
│  ├─ html2canvas.min.js   # external library to capture DOM
│  └─ jspdf.umd.min.js     # external library to generate PDF
│
├─ examples/
│  ├─ html-only/
│  │  └─ index.html        # standalone demo (HTML+JS only)
│  │
│  └─ classic-asp/
│     ├─ example.asp       # ASP page with form and buttons
│     └─ save_pdf.asp      # receives base64 PDF, saves it, returns URL
│
└─ README.en.md            # this documentation file
```

---

## `pdf-export.js` library details

The goal of the library is to hide technical details (html2canvas, jsPDF) behind a simple API.

### Library goals

- **Backend independence**: no direct reference to ASP/PHP/etc.
- **Layout control**:
  - support for `A4` format,
  - configurable margins,
  - multi‑page support.
- **Form values included**:
  - clone the DOM and inject current form values into the cloned nodes, so the snapshot reflects the current state of the form.

### Conceptual API

```js
// Basic export options
const options = {
  element: document.getElementById('print-area'), // root node to export
  filename: 'document.pdf',                       // default file name
  orientation: 'p',                               // 'p' = portrait, 'l' = landscape
  format: 'a4',                                   // page format
  marginMm: 10                                    // margin in millimetres
};

// 1. Direct download
PdfExport.exportPdf(options);

// 2. Generate a Blob (to send it to the server)
PdfExport.generatePdfBlob(options).then(function(blob) {
  // e.g. convert to base64 and send to an ASP endpoint
});

// 3. Directly get base64
PdfExport.generatePdfBase64(options).then(function(base64) {
  // send base64 via fetch/XHR to save_pdf.asp
});
```

Internal steps:

1. Clone `options.element` (to avoid touching the live DOM).
2. For each input/textarea/select in the clone, copy the current value into text/attributes, so html2canvas “sees” it correctly.
3. Use `html2canvas(clone, {...})` to get a canvas.
4. Compute scale and dimensions to fit into an A4 page with the required margins.
5. If content is taller than one page, slice the canvas into vertical pieces or use offset and `jsPDF.addPage()` for multiple pages.
6. Return:
   - a direct download (exportPdf), or
   - a `Blob`/base64 (generatePdfBlob / generatePdfBase64).

---

## `save_pdf.asp` details

Goal: receive the PDF in base64, decode it, and save it to disk.

### Basic flow

1. JS sends a POST request with:
   - `pdfData`: base64 string (without the `data:application/pdf;base64,` prefix),
   - `fileName`: suggested file name (e.g. `document_20260113_101500.pdf`).

2. `save_pdf.asp`:
   - reads `pdfData` and `fileName` from `Request.Form`,
   - decodes base64 to binary,
   - composes physical path: `PDF_SAVE_PATH & fileName`,
   - saves the bytes to disk,
   - builds public URL: `PDF_URL_BASE & fileName`,
   - returns a response:
     - JSON `{ "url": "/pdf/document_20260113_101500.pdf" }`, or
     - plain text URL.

3. JS, upon receiving the URL:
   - calls `window.open(url, '_blank')` to show the PDF.

### Why base64?

- In Classic ASP, handling raw binary via `Request.BinaryRead` is possible but more complex and verbose.
- With base64:
  - ASP code is easier to read,
  - simpler to maintain,
  - the overhead in CPU/space is acceptable for normal‑sized documents.

If you ever need more efficiency, you can later add a second ASP endpoint that accepts raw binary, keeping the base64 version as the “simple” one.

---

## Benefits

- **Portability**: no dependency on server PDF components (useful in restricted or shared environments, or where servers change often).
- **Longevity**: by pushing PDF generation to the client, it’s easier to:
  - upgrade the backend (e.g. move from Classic ASP to LAMP / Linux),
  - keep compatibility over time (just update local JS libraries).
- **Easy integration**:
  - few simple JS functions,
  - very small Classic ASP file to save PDFs.
- **Useful for other developers**:
  - shows how to modernize a Classic ASP codebase,
  - pattern can be reused with other backends (PHP, Node, etc.) by changing only the save endpoint.

---

## How to use this in another Classic ASP application

In short:

1. Copy:
   - `lib/pdf-export.js`,
   - the `vendor/` folder (with `html2canvas.min.js` and `jspdf.umd.min.js`),
   - `save_pdf.asp`.

2. In your `.asp` page with the form:
   - include the JS files,
   - wrap the content you want in a container (e.g. `<div id="print-area">`),
   - add a button that calls `generatePdfBase64(...)` and posts it to `save_pdf.asp`.

3. In `save_pdf.asp`:
   - update `PDF_SAVE_PATH` and `PDF_URL_BASE` to match your IIS environment.

4. Test and adjust your CSS layout to get a clean, A4‑friendly output.

---