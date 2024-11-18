const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

function drawStar(page, x, y, size, color) {
  const starPath = [
    { x: 0, y: size },
    { x: size * 0.2245, y: size * 0.309 },
    { x: size * 0.951, y: size * 0.309 },
    { x: size * 0.363, y: -size * 0.118 },
    { x: size * 0.588, y: -size * 0.809 },
    { x: 0, y: -size * 0.382 },
    { x: -size * 0.588, y: -size * 0.809 },
    { x: -size * 0.363, y: -size * 0.118 },
    { x: -size * 0.951, y: size * 0.309 },
    { x: -size * 0.2245, y: size * 0.309 },
  ];
  page.drawSvgPath(
    `M ${starPath.map((p) => `${p.x + x} ${p.y + y}`).join(" L ")} Z`
  );
}

module.exports = async function createPdf(data) {
  if (data.length < 1) {
    throw new Error("Data must be at least one character long");
  }
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  // Add a blank page to the document
  const page = pdfDoc.addPage();

  // Get the width and height of the page
  const { width, height } = page.getSize();

  // Draw a string of text toward the top of the page
  const fontSize = 30;
  page.moveTo(100, page.getHeight() - 13);

  // Draw star shapes around the edges of the page
  const starColor = rgb(0.5, 0, 0.5);
  const starSize = 20;

  drawStar(page, width / 2, height / 2, starSize, starColor);
  drawStar(page, width / 2 - 100, height / 2, starSize, starColor);

  const maxLineLength = 30; // Maximum characters per line
  const lines = [];
  let currentLine = "";

  for (const word of data.split(" ")) {
    if ((currentLine + word).length > maxLineLength) {
      lines.push(currentLine.trim());
      currentLine = "";
    }
    currentLine += word + " ";
  }
  lines.push(currentLine.trim());

  const text = lines.join("\n");

  page.drawText(text, {
    x: 50,
    y: height - 4 * fontSize,
    size: fontSize,
    font: timesRomanFont,
    color: rgb(0, 0.53, 0.71),
  });
  // Draw a border around the page
  const borderWidth = 5;
  page.drawRectangle({
    x: borderWidth / 2,
    y: borderWidth / 2,
    width: width - borderWidth,
    height: height - borderWidth,
    borderColor: rgb(1, 0.75, 0.8),
    borderWidth: borderWidth,
  });

  page.moveTo(100, page.getHeight() - 5);

  // Draw the SVG path as a black line
  page.moveDown(25);
  // page.drawSvgPath(
  //   "M 0,20 L 100,160 Q 130,200 150,120 C 190,-40 200,200 300,150 L 400,90"
  // );

  // Draw stars in the middle of the page
  drawStar(page, width / 2 + 100, height / 2, starSize, starColor);
  drawStar(page, width / 2, height / 2 - 100, starSize, starColor);
  drawStar(page, width / 2, height / 2 + 100, starSize, starColor);
  // Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};
