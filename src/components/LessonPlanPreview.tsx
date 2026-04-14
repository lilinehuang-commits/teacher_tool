import React, { useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkBreaks from "remark-breaks";
import "katex/dist/katex.min.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Printer, RefreshCw, Copy, Check, FileText } from "lucide-react";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, ImageRun } from "docx";

interface Props {
  content: string;
  onReset: () => void;
}

export function LessonPlanPreview({ content, onReset }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;

    try {
      // Ensure fonts and styles are loaded
      await document.fonts.ready;
      
      const dataUrl = await toPng(printRef.current, {
        quality: 1,
        pixelRatio: 3, // Higher pixel ratio for better clarity
        backgroundColor: "#ffffff",
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      });
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = pdfHeight;
      let position = 0;

      // Add first page
      pdf.addImage(dataUrl, "PNG", 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Add subsequent pages
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(`教案_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handleDownloadWord = async () => {
    if (!printRef.current) return;

    try {
      // Ensure fonts and styles are loaded
      await document.fonts.ready;
      
      // Capture the rendered content as a high-quality image
      const dataUrl = await toPng(printRef.current, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: "#ffffff",
      });

      // Convert dataUrl to Uint8Array for docx
      const base64 = dataUrl.split(',')[1];
      const binaryString = window.atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Get original dimensions
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => img.onload = resolve);
      
      // Calculate dimensions for Word (A4 width is ~170mm after margins)
      const wordWidth = 600; // docx points
      const wordHeight = (img.height / img.width) * wordWidth;

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: 720, // 0.5 inch
                right: 720,
                bottom: 720,
                left: 720,
              },
            },
          },
          children: [
            new Paragraph({
              children: [
                new ImageRun({
                  data: bytes,
                  transformation: {
                    width: wordWidth,
                    height: wordHeight,
                  },
                  type: "png",
                } as any),
              ],
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `教案_${new Date().getTime()}.docx`);
    } catch (error) {
      console.error("Error generating Word document:", error);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onReset} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> 重新生成
          </Button>
          <Button variant="outline" onClick={handleCopy} className="flex items-center gap-2 min-w-[100px]">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? "已复制" : "复制文本"}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownloadPDF} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" /> 导出 PDF
          </Button>
          <Button onClick={handleDownloadWord} className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> 导出 Word
          </Button>
          <Button variant="secondary" onClick={() => window.print()} className="flex items-center gap-2">
            <Printer className="w-4 h-4" /> 打印
          </Button>
        </div>
      </div>

      <Card className="shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          <div 
            ref={printRef} 
            className="bg-paper p-12 min-h-[1123px] w-full prose prose-slate max-w-none prose-headings:font-bold prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-code:text-pink-600"
            style={{ 
              fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
              lineHeight: "1.6"
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
              rehypePlugins={[rehypeKatex]}
              components={{
                h1: ({ children }) => <h1 className="text-3xl font-bold text-center mb-8 pb-4 border-b-2 border-primary">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-bold mt-8 mb-4 text-primary flex items-center gap-2 border-l-4 border-primary pl-4">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-semibold mt-6 mb-2 text-slate-800">{children}</h3>,
                p: ({ children }) => <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-6 mb-6 space-y-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-6 mb-6 space-y-2">{children}</ol>,
                li: ({ children }) => <li className="text-gray-700">{children}</li>,
                code: ({ children }) => <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600">{children}</code>,
                pre: ({ children }) => <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto mb-6 font-mono text-sm leading-normal">{children}</pre>,
                blockquote: ({ children }) => <blockquote className="border-l-4 border-slate-200 pl-4 italic text-slate-600 mb-6">{children}</blockquote>,
                table: ({ children }) => <div className="overflow-x-auto mb-6"><table className="min-w-full border-collapse border border-slate-200">{children}</table></div>,
                th: ({ children }) => <th className="border border-slate-200 bg-slate-50 px-4 py-2 text-left font-semibold">{children}</th>,
                td: ({ children }) => <td className="border border-slate-200 px-4 py-2">{children}</td>,
                hr: () => <hr className="my-10 border-t-2 border-slate-100" />,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
