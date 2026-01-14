# HTML/JS to PDF Exporter for Classic ASP (and more)

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/aa436c5609614f9bbd9050679c3fbb73)](https://app.codacy.com/gh/R0mb0/Html_to_pdf_client_side_classic_asp_demo/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![pages-build-deployment](https://github.com/R0mb0/Html_to_pdf_client_side_classic_asp_demo/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/R0mb0/Html_to_pdf_client_side_classic_asp_demo/actions/workflows/pages/pages-build-deployment)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/R0mb0/Html_to_pdf_client_side_classic_asp_demo)
[![Open Source Love](https://badges.frapsoft.com/os/v3/open-source.svg?v=103)](https://github.com/R0mb0/Html_to_pdf_client_side_classic_asp_demo)
[![MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/license/mit)
[![Donate](https://img.shields.io/badge/PayPal-Donate%20to%20Author-blue.svg)](http://paypal.me/R0mb0)

Client-side HTML/JS to PDF exporter with Classic ASP integration. Generates A4 multi-page PDFs in the browser (using html2canvas + jsPDF), lets users download them locally or send them to a Classic ASP endpoint for server-side storage, with no extra PDF tools installed on the server.

<div align="center">

## 👉 What this repo provides

- A **client-side JavaScript library** (`pdf-export.js`) to export HTML to A4 PDF
- A **pure HTML demo** (no backend required)
- A **Classic ASP demo** showing how to save PDFs on the server

</div>

---

## 🚀 Features

- **Client-side PDF generation** using `html2canvas` + `jsPDF`
- **No server-side PDF tools required** (no wkhtmltopdf, no headless Chrome, no COM components)
- **A4 multi-page layout** with configurable margins
- **Form-aware export**: current values of `<input>`, `<textarea>`, and `<select>` are captured
- **Download PDF locally** (HTML-only demo)
- **Save PDF on the server** via Classic ASP endpoint (no binary parsing complexity)
- **Offline-friendly**: all JS dependencies can be served locally (no CDN required)
- Works on **modern Chrome and Firefox**

---

## 🛠️ How it works

### 1. In the browser

1. You wrap the content you want to export in a container, e.g.:

   ```html
   <div id="print-area">
     <!-- Your content, form fields, tables, etc. -->
   </div>
   ```

2. You call the library:

   ```js
   PdfExport.exportPdf({
     element: document.getElementById('print-area'),
     filename: 'document.pdf',
     orientation: 'p', // 'p' = portrait, 'l' = landscape
     format: 'a4',
     marginMm: 10
   });
   ```

3. Internally, the library:

   - Clones the DOM subtree of `element`
   - Copies current form values into the cloned markup
   - Uses **html2canvas** to render the clone to a canvas
   - Slices the canvas into one or more **A4-height segments**
   - Uses **jsPDF** to add each segment as a page image with the desired margins
   - Produces a PDF `Blob` (and either downloads it or returns it to your code)

### 2. In Classic ASP (optional)

For the Classic ASP scenario, the browser:

1. Generates the PDF as a `Blob`
2. Converts the `Blob` to base64
3. POSTs `fileName` + `pdfData` (base64) to a Classic ASP endpoint, e.g. `save_pdf.asp`

The `save_pdf.asp` script:

1. Reads `Request.Form("fileName")` and `Request.Form("pdfData")`
2. Decodes base64 into binary using MSXML
3. Saves the file into a configured folder (e.g. `D:\inetpub\wwwroot\YourSite\pdf\`)
4. Returns the **public URL** of the saved PDF as plain text

The browser then:

```js
window.open(fileUrlFromServer, '_blank');
```

---

## 🧱 Project structure

```text
/
├─ lib/
│  └─ pdf-export.js          # main library (client-side)
│
├─ vendor/
│  ├─ html2canvas.min.js     # third-party DOM → canvas library
│  └─ jspdf.umd.min.js       # third-party PDF generation library
│
├─ examples/
│  ├─ html-only/
│  │  └─ index.en.html       # HTML demo
│  │
│  └─ classic-asp/
│     ├─ example.asp         # Classic ASP demo
│     └─ save_pdf.asp        # Classic ASP endpoint to save base64 PDF
│
└─ README.md                 # 
```

---

## 💡 Typical use cases

- Modernizing **legacy Classic ASP** applications by:
  - Replacing old unsupported PDF plugins/ActiveX components
  - Avoiding server-installed PDF engines (wkhtmltopdf, headless browsers, etc.)
- Generating **print-friendly A4 PDFs** from complex HTML forms and reports
- Environments where:
  - You **cannot install** additional server software
  - You want most logic in **JavaScript** for easier migration (e.g. to LAMP / Linux later)
- Building **client-side only** tools that export the current page state to PDF

---

## 🔧 Getting started

### 1. Clone or download the repo

```bash
git clone https://github.com/R0mb0/classic-asp-html-pdf-exporter.git
cd classic-asp-html-pdf-exporter
```

### 2. HTML-only demo (no backend)

1. Open `examples/html-only/index.html` or `index.en.html` in **Chrome** or **Firefox**
2. Fill in the form fields
3. Click **"Download PDF"**

The browser will download `demo-html-only.pdf` with the current state of the page rendered in A4.

### 3. Classic ASP demo

1. Copy the project under your IIS web root, e.g.:

   ```text
   D:\inetpub\wwwroot\classic-asp-html-pdf-exporter\
   ```

2. Make sure Classic ASP is enabled in IIS.
3. Create a folder for saved PDFs, e.g.:

   ```text
   D:\inetpub\wwwroot\classic-asp-html-pdf-exporter\pdf\
   ```

   and grant **write permissions** to your IIS user (e.g. `IUSR`, `NETWORK SERVICE`, or the app pool identity).

4. Edit `examples/classic-asp/save_pdf.asp` and set:

   ```asp
   Const PDF_SAVE_PATH = "D:\inetpub\wwwroot\classic-asp-html-pdf-exporter\pdf\"
   Const PDF_URL_BASE  = "/classic-asp-html-pdf-exporter/pdf/"
   ```

5. Open in a browser:

   ```text
   http://your-server/classic-asp-html-pdf-exporter/examples/classic-asp/example.en.asp
   ```

6. Fill in the form and click:

   - **"Download PDF (local)"** → browser download only
   - **"Save PDF on server"** → PDF is stored under `pdf\` and opened in a new tab

---

## 📦 Library usage in your own project

Once you’ve copied the library files into your app, you just need three `<script>` tags and a bit of JS.

### 1. Include scripts

```html
<script src="/path/to/vendor/html2canvas.min.js"></script>
<script src="/path/to/vendor/jspdf.umd.min.js"></script>
<script src="/path/to/lib/pdf-export.js"></script>
```

### 2. Local download example

```html
<div id="print-area">
  <!-- your content -->
</div>

<button id="btn-download-pdf">Download PDF</button>

<script>
  document.getElementById('btn-download-pdf').addEventListener('click', function () {
    PdfExport.exportPdf({
      element: document.getElementById('print-area'),
      filename: 'my-document.pdf',
      orientation: 'p',
      format: 'a4',
      marginMm: 10
    });
  });
</script>
```

### 3. Send PDF to your own server endpoint

```js
PdfExport.generatePdfBase64({
  element: document.getElementById('print-area'),
  orientation: 'p',
  format: 'a4',
  marginMm: 10
}).then(function (base64) {
  const fileName = 'doc_' + new Date().toISOString().replace(/[:.]/g, '-') + '.pdf';

  return fetch('/path/to/your/save_endpoint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    body: 'fileName=' + encodeURIComponent(fileName) +
          '&pdfData=' + encodeURIComponent(base64)
  });
}).then(function (response) {
  return response.text();
}).then(function (url) {
  window.open(url.trim(), '_blank');
});
```

On the server side you can reuse `save_pdf.asp` or adapt the logic to PHP, Node, etc.

---

## ⚠️ Notes & limitations

- The PDF content is based on a **canvas rendering** of your HTML:
  - The visual layout is generally good, but not pixel-perfect compared to native print engines.
  - Text inside the PDF is an image; it won’t be selectable/searchable (unless you add a separate text layer).
- A4 pagination uses a simple slicing strategy:
  - Very long pages are split into multiple A4 pages.
  - Layout is optimized for readability, not for exact typographical control.
- Performance depends on:
  - The complexity of your DOM / CSS
  - The size of the canvas (images, long forms, etc.)
  - The client’s hardware and browser

---

## 🔒 Privacy & security

- All rendering and PDF generation happens **in the browser**.
- When using the HTML-only demo or `exportPdf`, **no data is sent to any server**.
- When using the Classic ASP demo or `generatePdfBase64`, **only the final PDF** is sent to your server endpoint.

---

## 📖 License

This project is released under the **MIT License**.  
See [`LICENSE`](LICENSE) for full text.

Third-party libraries:

- [`html2canvas`](https://github.com/niklasvh/html2canvas) – MIT
- [`jsPDF`](https://github.com/parallax/jsPDF) – MIT

---

## 🙏 Credits & inspiration

- [html2canvas](https://github.com/niklasvh/html2canvas) – for DOM-to-canvas rendering.
- [jsPDF](https://github.com/parallax/jsPDF) – for client-side PDF generation.
- Inspired by the need to keep **legacy Classic ASP** apps alive while:
  - avoiding obsolete server-side PDF plugins,
  - preparing for easier migration to more modern stacks (e.g. LAMP / Linux) with minimal changes.
