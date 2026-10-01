import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

async function waitForImages(element) {
  const images = Array.from(element.querySelectorAll('img'));
  const imageReady = Promise.all(images.map((img) => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    if (img.decode) return img.decode().catch(() => {});
    return new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  }));
  await Promise.race([
    imageReady,
    new Promise((resolve) => setTimeout(resolve, 1500))
  ]);
}

export async function createPdfFile(element, fileName = 'Odo Walls.pdf', options = {}) {
  const scale = options.scale || 3;
  const pageSelector = options.pageSelector;
  await waitForImages(element);
  if (pageSelector) return createFlowPdfFile(element, fileName, { scale, pageSelector });

  const canvas = await html2canvas(element, {
    scale,
    backgroundColor: '#ffffff',
    useCORS: true
  });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 16;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let y = 8;

  if (imgHeight <= pageHeight - 16) {
    pdf.addImage(imgData, 'PNG', 8, y, imgWidth, imgHeight);
  } else {
    let remaining = imgHeight;
    let position = 0;
    while (remaining > 0) {
      pdf.addImage(imgData, 'PNG', 8, y - position, imgWidth, imgHeight);
      remaining -= pageHeight - 16;
      position += pageHeight - 16;
      if (remaining > 0) pdf.addPage();
    }
  }

  const blob = pdf.output('blob');
  return new File([blob], fileName, { type: 'application/pdf' });
}

function addCanvasSlice(pdf, canvas, sourceY, sourceHeight, x, y, width, height) {
  const slice = document.createElement('canvas');
  slice.width = canvas.width;
  slice.height = sourceHeight;
  const context = slice.getContext('2d');
  context.drawImage(
    canvas,
    0,
    sourceY,
    canvas.width,
    sourceHeight,
    0,
    0,
    canvas.width,
    sourceHeight
  );
  pdf.addImage(slice.toDataURL('image/png'), 'PNG', x, y, width, height);
}

async function captureElement(element, scale) {
  return html2canvas(element, {
    scale,
    backgroundColor: '#ffffff',
    useCORS: true
  });
}

async function createFlowPdfFile(element, fileName, options) {
  const sections = Array.from(element.querySelectorAll(options.pageSelector));
  const targets = sections.length ? sections : [element];
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const sectionGap = 4;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;
  let cursorY = margin;

  for (let index = 0; index < targets.length; index += 1) {
    const canvas = await captureElement(targets[index], options.scale);
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const remainingHeight = pageHeight - margin - cursorY;

    if (imgHeight <= contentHeight) {
      if (cursorY > margin && imgHeight > remainingHeight) {
        pdf.addPage();
        cursorY = margin;
      }
      pdf.addImage(imgData, 'PNG', margin, cursorY, imgWidth, imgHeight);
      cursorY += imgHeight + sectionGap;
      continue;
    }

    let sourceY = 0;
    let availableHeight = pageHeight - margin - cursorY;
    while (sourceY < canvas.height) {
      if (availableHeight <= 0) {
        pdf.addPage();
        cursorY = margin;
        availableHeight = contentHeight;
      }

      const sourceHeight = Math.min(
        canvas.height - sourceY,
        Math.floor((availableHeight * canvas.width) / imgWidth)
      );
      if (sourceHeight <= 0) {
        pdf.addPage();
        cursorY = margin;
        availableHeight = contentHeight;
        continue;
      }
      const sliceHeight = (sourceHeight * imgWidth) / canvas.width;
      addCanvasSlice(pdf, canvas, sourceY, sourceHeight, margin, cursorY, imgWidth, sliceHeight);
      sourceY += sourceHeight;
      cursorY += sliceHeight;

      if (sourceY < canvas.height) {
        pdf.addPage();
        cursorY = margin;
        availableHeight = contentHeight;
      }
    }

    cursorY += sectionGap;
  }

  const blob = pdf.output('blob');
  return new File([blob], fileName, { type: 'application/pdf' });
}

export function downloadFile(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
