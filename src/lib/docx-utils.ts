import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
  LevelFormat,
  ImageRun,
} from "docx";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import katex from "katex";
import { toPng } from "html-to-image";

async function renderMathToImage(latex: string, isBlock: boolean): Promise<ImageRun | null> {
  try {
    const container = document.createElement("div");
    // Ensure container is in the document but not visible
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.padding = "10px"; // Add some padding to avoid clipping
    container.style.background = "white";
    container.style.display = "inline-block";
    container.style.color = "#C026D3"; // Set color directly on container
    document.body.appendChild(container);
    
    katex.render(latex, container, {
      displayMode: isBlock,
      throwOnError: false,
    });
    
    // Wait a frame for rendering
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    const dataUrl = await toPng(container, { 
      backgroundColor: "white", 
      pixelRatio: 3, // Higher quality
      skipFonts: false
    });
    
    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    
    // Convert dataUrl to Uint8Array manually to be safer
    const base64 = dataUrl.split(',')[1];
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Scale back the dimensions based on pixelRatio
    const width = img.width / 3;
    const height = img.height / 3;
    
    document.body.removeChild(container);
    
    return new ImageRun({
      data: bytes,
      transformation: {
        width: width,
        height: height
      },
      type: "png"
    } as any);
  } catch (e) {
    console.error("Math rendering failed", e);
    return null;
  }
}

export async function markdownToDocx(markdown: string, title: string): Promise<Blob> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath);
  
  const ast = processor.parse(markdown);
  const children: any[] = [];

  // Helper to process nodes
  async function processNodes(nodes: any[]): Promise<any[]> {
    const result: any[] = [];
    for (const node of nodes) {
      if (node.type === "text") {
        result.push(new TextRun({ text: node.value }));
      } else if (node.type === "strong") {
        const children = await processNodes(node.children);
        result.push(...children.map(run => {
          if (run instanceof TextRun) {
            return new TextRun({ ...run as any, bold: true });
          }
          return run;
        }));
      } else if (node.type === "emphasis") {
        const children = await processNodes(node.children);
        result.push(...children.map(run => {
          if (run instanceof TextRun) {
            return new TextRun({ ...run as any, italics: true });
          }
          return run;
        }));
      } else if (node.type === "inlineCode") {
        result.push(new TextRun({ 
          text: node.value, 
          font: "Courier New",
          shading: { fill: "F3F4F6" }
        }));
      } else if (node.type === "inlineMath" || node.type === "math") {
        const mathImage = await renderMathToImage(node.value, node.type === "math");
        if (mathImage) {
          result.push(mathImage);
        } else {
          result.push(new TextRun({ 
            text: node.value, 
            italics: true,
            color: "C026D3",
            font: "Cambria Math"
          }));
        }
      } else if (node.type === "link") {
        const children = await processNodes(node.children);
        result.push(...children.map(run => {
          if (run instanceof TextRun) {
            return new TextRun({ ...run as any, color: "2563EB", underline: {} });
          }
          return run;
        }));
      }
    }
    return result;
  }

  // Walk the top-level AST
  for (const node of (ast as any).children) {
    if (node.type === "heading") {
      let level: any = HeadingLevel.HEADING_1;
      if (node.depth === 2) level = HeadingLevel.HEADING_2;
      if (node.depth === 3) level = HeadingLevel.HEADING_3;
      
      children.push(new Paragraph({
        heading: level,
        children: await processNodes(node.children),
        spacing: { before: 400, after: 200 },
      }));
    } else if (node.type === "paragraph") {
      children.push(new Paragraph({
        children: await processNodes(node.children),
        spacing: { after: 200 },
      }));
    } else if (node.type === "list") {
      for (const listItem of node.children) {
        children.push(new Paragraph({
          children: await processNodes(listItem.children[0].children),
          bullet: node.ordered ? undefined : { level: 0 },
          numbering: node.ordered ? { reference: "ordered-list", level: 0 } : undefined,
          spacing: { after: 100 },
        }));
      }
    } else if (node.type === "table") {
      const rows = [];
      for (const row of node.children) {
        const cells = [];
        for (const cell of row.children) {
          cells.push(new TableCell({
            children: [new Paragraph({ children: await processNodes(cell.children) })],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
            width: { size: 100 / row.children.length, type: WidthType.PERCENTAGE },
          }));
        }
        rows.push(new TableRow({ children: cells }));
      }
      
      children.push(new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      }));
      // Add spacing after table using an empty paragraph
      children.push(new Paragraph({ spacing: { after: 400 } }));
    } else if (node.type === "thematicBreak") {
      children.push(new Paragraph({
        border: { bottom: { color: "E5E7EB", space: 1, style: BorderStyle.SINGLE, size: 6 } },
        spacing: { before: 400, after: 400 },
      }));
    } else if (node.type === "blockquote") {
      children.push(new Paragraph({
        children: await processNodes(node.children[0].children),
        indent: { left: 720 },
        border: { left: { color: "E5E7EB", space: 1, style: BorderStyle.SINGLE, size: 24 } },
        spacing: { before: 200, after: 200 },
      }));
    } else if (node.type === "code") {
      children.push(new Paragraph({
        children: [new TextRun({ text: node.value, font: "Courier New" })],
        shading: { fill: "F3F4F6" },
        indent: { left: 360 },
        spacing: { before: 200, after: 200 },
      }));
    }
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "ordered-list",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },
    sections: [{
      properties: {},
      children: children,
    }],
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: {
            font: "Microsoft YaHei",
            size: 24, // 12pt
          },
        },
      ],
    },
  });

  return await Packer.toBlob(doc);
}
