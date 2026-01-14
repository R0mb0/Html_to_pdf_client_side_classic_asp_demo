// pdf-export.js
// Libreria per generare PDF A4 da un elemento HTML usando html2canvas + jsPDF.
// Richiede:
//   - html2canvas (window.html2canvas)
//   - jsPDF UMD (window.jspdf.jsPDF)
//
// Espone l'oggetto globale window.PdfExport con le funzioni:
//   - exportPdf(options): genera il PDF e avvia il download locale.
//   - generatePdfBlob(options): restituisce una Promise<Blob>.
//   - generatePdfBase64(options): restituisce una Promise<string> (base64 "puro").
//
// Le opzioni accettate sono:
//   {
//     element: HTMLElement,   // nodo radice da esportare
//     filename: string,       // nome file (usato solo da exportPdf)
//     orientation: 'p' | 'l', // portrait / landscape
//     format: 'a4',           // per ora solo 'a4'
//     marginMm: number        // margini in mm
//   }

(function (global) {
  'use strict';

  if (!global.html2canvas) {
    console.error('pdf-export.js richiede html2canvas caricato prima di questo script.');
  }
  if (!global.jspdf || !global.jspdf.jsPDF) {
    console.error('pdf-export.js richiede jspdf.umd.min.js caricato prima di questo script.');
  }

  var jsPDF = global.jspdf && global.jspdf.jsPDF;

  function defaultOptions(opts) {
    opts = opts || {};
    if (!opts.element) {
      throw new Error('PdfExport: options.element è obbligatorio');
    }
    return {
      element: opts.element,
      filename: opts.filename || 'document.pdf',
      orientation: opts.orientation || 'p',
      format: opts.format || 'a4',
      marginMm: typeof opts.marginMm === 'number' ? opts.marginMm : 10
    };
  }

  // Clona il nodo e "fissa" i valori degli input, textarea, select
  function cloneNodeWithFormValues(element) {
    var clone = element.cloneNode(true);

    // mappa originale -> clone
    var origInputs = element.querySelectorAll('input, textarea, select');
    var cloneInputs = clone.querySelectorAll('input, textarea, select');

    for (var i = 0; i < origInputs.length; i++) {
      var orig = origInputs[i];
      var copy = cloneInputs[i];

      if (!copy) continue;

      if (orig.tagName === 'INPUT') {
        var type = (orig.type || '').toLowerCase();
        if (type === 'checkbox' || type === 'radio') {
          copy.checked = orig.checked;
        } else {
          copy.value = orig.value;
          copy.setAttribute('value', orig.value);
        }
      } else if (orig.tagName === 'TEXTAREA') {
        copy.value = orig.value;
        copy.textContent = orig.value;
      } else if (orig.tagName === 'SELECT') {
        copy.value = orig.value;
        var selectedIndex = orig.selectedIndex;
        if (selectedIndex >= 0) {
          copy.selectedIndex = selectedIndex;
        }
      }
    }

    return clone;
  }

  // Genera un canvas dall'elemento (clonato) usando html2canvas
  function renderElementToCanvas(element) {
    // Rende il clone "offscreen" per evitare di disturbare il layout
    var hiddenContainer = document.createElement('div');
    hiddenContainer.style.position = 'fixed';
    hiddenContainer.style.left = '-10000px';
    hiddenContainer.style.top = '0';
    hiddenContainer.style.zIndex = '-1';
    hiddenContainer.style.background = 'white';

    var clone = cloneNodeWithFormValues(element);
    hiddenContainer.appendChild(clone);
    document.body.appendChild(hiddenContainer);

    return global.html2canvas(clone, {
      scale: 2, // maggiore qualità
      useCORS: true
    }).then(function (canvas) {
      document.body.removeChild(hiddenContainer);
      return canvas;
    }).catch(function (err) {
      document.body.removeChild(hiddenContainer);
      throw err;
    });
  }

  // Genera un PDF A4 multipagina da un canvas e restituisce un Blob
  function canvasToPdfBlob(canvas, opts) {
    opts = defaultOptions(opts);

    // Dimensioni pagina A4 in mm
    var pageWidthMm = 210;
    var pageHeightMm = 297;

    if (opts.orientation === 'l') {
      var tmp = pageWidthMm;
      pageWidthMm = pageHeightMm;
      pageHeightMm = tmp;
    }

    var marginMm = opts.marginMm;

    var pdf = new jsPDF({
      orientation: opts.orientation,
      unit: 'mm',
      format: opts.format
    });

    var pageInnerWidthMm = pageWidthMm - marginMm * 2;
    var pageInnerHeightMm = pageHeightMm - marginMm * 2;

    var imgWidthPx = canvas.width;
    var imgHeightPx = canvas.height;

    // Calcolo scala per adattare la larghezza
    var pxPerMm = imgWidthPx / pageInnerWidthMm;
    var imgHeightMm = imgHeightPx / pxPerMm;

    var remainingHeightMm = imgHeightMm;
    var positionYmm = marginMm;

    var pageData = canvas.toDataURL('image/png');

    // Se l'immagine è più alta di una pagina, spezzala in più pagine
    // Strategia semplice: ogni "fetta" verticale è alta pageInnerHeightMm
    var currentPage = 0;

    while (remainingHeightMm > 0) {
      if (currentPage > 0) {
        pdf.addPage();
      }

      var sliceHeightMm = Math.min(remainingHeightMm, pageInnerHeightMm);
      var sliceHeightPx = sliceHeightMm * pxPerMm;

      // Creiamo un canvas temporaneo per la fetta
      var sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = imgWidthPx;
      sliceCanvas.height = sliceHeightPx;
      var ctx = sliceCanvas.getContext('2d');

      // offset verticale in px
      var sy = (imgHeightMm - remainingHeightMm) * pxPerMm;

      ctx.drawImage(
        canvas,
        0,
        sy,
        imgWidthPx,
        sliceHeightPx,
        0,
        0,
        imgWidthPx,
        sliceHeightPx
      );

      var sliceData = sliceCanvas.toDataURL('image/png');

      pdf.addImage(
        sliceData,
        'PNG',
        marginMm,
        marginMm,
        pageInnerWidthMm,
        sliceHeightMm,
        undefined,
        'FAST'
      );

      remainingHeightMm -= sliceHeightMm;
      currentPage++;
    }

    // Ritorna Blob
    return new Promise(function (resolve) {
      pdf.save = pdf.save || pdf.output; // fallback vecchie versioni
      var blob = pdf.output('blob');
      resolve(blob);
    });
  }

  // Converte un Blob in base64 "puro"
  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onloadend = function () {
        var dataUrl = reader.result; // es: "data:application/pdf;base64,AAAA..."
        var base64 = dataUrl.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // API pubbliche

  function generatePdfBlob(options) {
    var opts = defaultOptions(options);
    return renderElementToCanvas(opts.element).then(function (canvas) {
      return canvasToPdfBlob(canvas, opts);
    });
  }

  function generatePdfBase64(options) {
    return generatePdfBlob(options).then(function (blob) {
      return blobToBase64(blob);
    });
  }

  function exportPdf(options) {
    var opts = defaultOptions(options);
    return generatePdfBlob(opts).then(function (blob) {
      var blobUrl = URL.createObjectURL(blob);

      var a = document.createElement('a');
      a.href = blobUrl;
      a.download = opts.filename || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Facoltativo: revocare l'URL dopo un po'
      setTimeout(function () {
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    });
  }

  // Espone nel global
  global.PdfExport = {
    generatePdfBlob: generatePdfBlob,
    generatePdfBase64: generatePdfBase64,
    exportPdf: exportPdf
  };

})(window);