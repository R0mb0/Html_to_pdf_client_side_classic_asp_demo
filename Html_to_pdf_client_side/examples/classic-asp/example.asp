<%
' example.en.asp
' Classic ASP demo page using pdf-export.js to:
'  - Download the page as a PDF (client-side only)
'  - Save the PDF on the server by calling save_pdf.asp
%>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Classic ASP Demo - Save page as PDF</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f4f4f4;
    }

    .page-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 20px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }

    h1, h2 {
      margin-top: 0;
    }

    .form-row {
      margin-bottom: 12px;
    }

    .form-row label {
      display: block;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .form-row input[type="text"],
    .form-row textarea,
    .form-row select {
      width: 100%;
      padding: 6px;
      box-sizing: border-box;
    }

    .buttons {
      margin-top: 20px;
      text-align: right;
    }

    .buttons button {
      padding: 8px 16px;
      margin-left: 8px;
      cursor: pointer;
    }

    .note {
      font-size: 0.9em;
      color: #666;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="page-container" id="print-area">
    <h1>Classic ASP Demo: Save page as PDF</h1>
    <p>Fill in the fields, then try both local download and saving to the server.</p>

    <h2>Order details</h2>

    <div class="form-row">
      <label for="orderNo">Order number</label>
      <input type="text" id="orderNo" name="orderNo" value="ORD-2026-0001" />
    </div>

    <div class="form-row">
      <label for="customer">Customer</label>
      <input type="text" id="customer" name="customer" value="Example Company Ltd." />
    </div>

    <div class="form-row">
      <label for="description">Order description</label>
      <textarea id="description" name="description" rows="5">Detailed order description...</textarea>
    </div>

    <div class="form-row">
      <label for="status">Status</label>
      <select id="status" name="status">
        <option value="draft" selected>Draft</option>
        <option value="confirmed">Confirmed</option>
        <option value="shipped">Shipped</option>
      </select>
    </div>

    <p class="note">
      Note: this is a simplified example. In a real app you may include tables, summaries, etc.
    </p>
  </div>

  <div class="buttons">
    <button id="btn-download-pdf">Download PDF (local)</button>
    <button id="btn-save-server">Save PDF on server</button>
  </div>

  <script src="../../vendor/html2canvas.min.js"></script>
  <script src="../../vendor/jspdf.umd.min.js"></script>
  <script src="../../lib/pdf-export.js"></script>

  <script>
    const printArea = document.getElementById('print-area');

    document.getElementById('btn-download-pdf').addEventListener('click', function () {
      window.PdfExport.exportPdf({
        element: printArea,
        filename: 'demo-classic-asp-local.pdf',
        orientation: 'p',
        format: 'a4',
        marginMm: 10
      }).catch(function (err) {
        console.error('PDF generation error:', err);
        alert('Error while generating the PDF (see console).');
      });
    });

    document.getElementById('btn-save-server').addEventListener('click', function () {
      window.PdfExport.generatePdfBase64({
        element: printArea,
        orientation: 'p',
        format: 'a4',
        marginMm: 10
      }).then(function (base64) {
        const fileName = 'order_' + new Date().toISOString().replace(/[:.]/g, '-') + '.pdf';

        return fetch('save_pdf.asp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
          },
          body: 'fileName=' + encodeURIComponent(fileName) +
                '&pdfData=' + encodeURIComponent(base64)
        });
      }).then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP error: ' + response.status);
        }
        return response.text();
      }).then(function (text) {
        const url = text.trim();
        if (url) {
          window.open(url, '_blank');
        } else {
          alert('File was saved, but server response was empty.');
        }
      }).catch(function (err) {
        console.error('Server save error:', err);
        alert('Error while saving the PDF on the server (see console).');
      });
    });
  </script>
</body>
</html>