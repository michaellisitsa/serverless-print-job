const createPdf = require("./createPdf");
const fs = require("fs");

const data = process.argv[2];
if (!data) {
  console.error("Please provide data as a command-line argument.");
  process.exit(1);
}

createPdf(data)
  .then((pdfBytes) => {
    fs.writeFileSync("out/output.pdf", pdfBytes);
    console.log("PDF created successfully.");
  })
  .catch((err) => {
    console.error("Error creating PDF:", err);
  });
