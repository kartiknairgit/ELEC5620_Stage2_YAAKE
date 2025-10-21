const { Document, Packer, Paragraph, TextRun } = require('docx');

async function exportDocx({ body, title = 'Cover Letter' }) {
  const paragraphs = body.split(/\n{2,}/).map(block => new Paragraph({
    children: [new TextRun({ text: block, font: 'Times New Roman', size: 24 })],
    spacing: { after: 200 }
  }));

  const doc = new Document({
    sections: [{
      properties: {},
      children: [new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 28 })] }), new Paragraph({})].concat(paragraphs)
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

module.exports = {
  exportDocx
};


