import React, {
  useImperativeHandle,
  forwardRef,
  useRef,
  useEffect,
  useState,
} from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useReactToPrint } from "react-to-print";
import { CheckCircle, Download, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import html2pdf from "html2pdf.js";

interface InvoiceItem {
  id: number;
  name: string;
  hsnSac: string;
  tax: string;
  qty: string;
  ratePerItem: number;
  amount: number;
}

interface TaxBreakdown {
  hsnSac: string;
  taxableValue: number;
  centralTaxRate: number;
  centralTaxAmount: number;
  stateUtTaxRate: number;
  stateUtTaxAmount: number;
  totalTaxAmount: number;
}

interface AdditionalCharge {
  value: string;
  price: string;
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  placeOfSupply: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  dispatchFrom?: string;
  items: InvoiceItem[];
  additionalCharges: AdditionalCharge[];
  taxableAmount: number;
  totalCentralTax: number;
  totalStateTax: number;
  roundOff: number;
  totalAmount: number;
  totalQuantity: number;
  amountInWords: string;
  taxBreakdown: TaxBreakdown[];
  totalTaxAmount: number;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  paymentStatus: string;
  paymentDate: string;
  paymentMethod: string;
  globalDiscount?: number;
  additionalDiscount?: number;
  totalDiscount?: number;
  tds?: {
    enabled: boolean;
    code: string;
    description: string;
    amount: number;
  };
  tdsUnderGst?: {
    enabled: boolean;
    rate: number;
    amount: number;
  };
  tcs?: {
    enabled: boolean;
    rate: number;
    amount: number;
  };
}

type InvoiceCanvasProps = {
  data?: InvoiceData;
  googleTokens: string;
};

// PDF Configuration for A4 at scale 4
const PDF_CONFIG = {
  pageWidth: 3176, // A4 width at 96 DPI * 4
  pageHeight: 4492, // A4 height at 96 DPI * 4
  maxContentHeight: 4200, // Leave margin for headers/footers
  scale: 4,
  pdfWidth: 210, // A4 width in mm
  pdfHeight: 297, // A4 height in mm
};

interface BlockInfo {
  element: HTMLElement;
  height: number;
  index: number;
}

interface PageGroup {
  blocks: BlockInfo[];
  totalHeight: number;
}

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
}

// PDF Generation Utilities
const measureBlocks = (container: HTMLElement): BlockInfo[] => {
  const blocks = container.querySelectorAll(".block-no-break");
  return Array.from(blocks).map((block, index) => ({
    element: block as HTMLElement,
    height: block.getBoundingClientRect().height * PDF_CONFIG.scale,
    index,
  }));
};

const groupBlocksIntoPages = (blocks: BlockInfo[]): PageGroup[] => {
  const pages: PageGroup[] = [];
  let currentPage: PageGroup = { blocks: [], totalHeight: 0 };

  for (const block of blocks) {
    // Check if adding this block would exceed page height
    if (
      currentPage.totalHeight + block.height > PDF_CONFIG.maxContentHeight &&
      currentPage.blocks.length > 0
    ) {
      // Start a new page
      pages.push(currentPage);
      currentPage = { blocks: [], totalHeight: 0 };
    }

    // Add block to current page
    currentPage.blocks.push(block);
    currentPage.totalHeight += block.height;
  }

  // Add the last page if it has blocks
  if (currentPage.blocks.length > 0) {
    pages.push(currentPage);
  }

  return pages;
};

const createPageContainers = (
  container: HTMLElement,
  pageGroups: PageGroup[]
): HTMLElement[] => {
  const pageContainers: HTMLElement[] = [];

  pageGroups.forEach((pageGroup) => {
    // Create page container
    const pageContainer = document.createElement("div");
    pageContainer.className = "page";
    pageContainer.style.cssText = `
      width: ${PDF_CONFIG.pageWidth / PDF_CONFIG.scale}px;
      min-height: ${PDF_CONFIG.maxContentHeight / PDF_CONFIG.scale}px;
      background: white;
      padding: 20px;
      box-sizing: border-box;
      position: absolute;
      top: -9999px;
      left: -9999px;
    `;

    // Clone and append blocks to this page
    pageGroup.blocks.forEach((blockInfo) => {
      const clonedBlock = blockInfo.element.cloneNode(true) as HTMLElement;
      pageContainer.appendChild(clonedBlock);
    });

    // Append to document body temporarily
    document.body.appendChild(pageContainer);
    pageContainers.push(pageContainer);
  });

  return pageContainers;
};

const renderPageToCanvas = async (
  pageContainer: HTMLElement
): Promise<HTMLCanvasElement> => {
  return await html2canvas(pageContainer, {
    scale: PDF_CONFIG.scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    width: PDF_CONFIG.pageWidth / PDF_CONFIG.scale,
    height: PDF_CONFIG.maxContentHeight / PDF_CONFIG.scale,
  });
};

export type InvoiceCanvasHandle = {
  downloadAsPDF: () => void;
  printInvoice: () => void;
  downloadAsImage: () => void;
};

const getBase64FromImageUrl = (
  url: string = "https://drive.google.com/uc?id=1-mr5UWZu67XjzTpP81ZcPuhgDoaIyS73"
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Important for CORS
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject("Canvas context not available");
        return;
      }

      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      resolve(dataURL);
    };

    img.onerror = (err) => reject(err);
  });
};

const fetchDriveImage = async (fileId: string, accessToken: string) => {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const blob = await response.blob();
  return URL.createObjectURL(blob); // can use in <img>
};

export const InvoiceCanvas = forwardRef<
  InvoiceCanvasHandle,
  InvoiceCanvasProps
>(({ data, googleTokens }, ref) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [base64Logo, setBase64Logo] = useState<string>("");
  const [base64Signature, setBase64Signature] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const base64 = await fetchDriveImage(data.companyLogo, googleTokens);
        setBase64Logo(base64); // save it in state
        const base64Fetched = await fetchDriveImage(
          data.signature,
          googleTokens
        );
        setBase64Signature(base64Fetched);
      } catch (err) {
        console.error("Failed to convert image to base64:", err);
      }
    })();
  }, []);

  // React-to-print hook
  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${data.invoiceNumber}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 0in 0in 0in 0in;
      }
      
      @media print {
        body {
          font-family: 'Arial', 'Helvetica', sans-serif !important;
          font-size: 12pt !important;
          line-height: 1.4 !important;
          color: #000 !important;
          background: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        // .invoice-container {
        //   width: 100% !important;
        //   max-width: none !important;
        //   margin: 0 !important;
        //   padding: 0 !important;
        //   box-shadow: none !important;
        //   border: 2px solid #000 !important;
        //   background: white !important;
        // }

        // table, th, td {
        //   border-collapse: collapse !important;
        //   border: 1px solid #000 !important;
        // }

        // th, td {
        //   padding: 4pt !important;
        //   font-size: 11pt !important;
        // }

        // .company-logo {
        //   background-color: #f97316 !important;
        //   color: white !important;
        //   -webkit-print-color-adjust: exact !important;
        //   print-color-adjust: exact !important;
        // }

        // .signature-circle {
        //   border: 2px solid #2563eb !important;
        //   border-radius: 50% !important;
        // }

        .no-print {
          display: none !important;
        }

        * {
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
        }
      }
    `,
    onAfterPrint: () => {
      console.log("Print completed");
    },
  });

  const downloadAsPDF3 = async () => {
    if (!invoiceRef.current) return;

    try {
      // Create canvas with high DPI settings
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 4, // Higher scale for better quality
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        width: invoiceRef.current.scrollWidth,
        height: invoiceRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: invoiceRef.current.scrollWidth,
        windowHeight: invoiceRef.current.scrollHeight,
      });

      // Create PDF
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(
        imgData,
        "JPEG",
        imgX,
        imgY,
        imgWidth * ratio,
        imgHeight * ratio
      );
      pdf.save(`invoice-${data.invoiceNumber}.pdf`);
      //   pdf.output("dataurlnewwindow");
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const downloadAsPDF = () => {
    if (!invoiceRef.current) return;

    const opt = {
      margin: 0,
      filename: `invoice-${data.invoiceNumber}.pdf`,
      image: { type: "jpeg", quality: 1.0 },
      html2canvas: {
        scale: 4,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: invoiceRef.current.scrollWidth,
        windowHeight: invoiceRef.current.scrollHeight,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: {
        mode: ["avoid-all", "css", "legacy"], // respect CSS + avoid breaks inside elements
        avoid: [".block-no-break"], // class of elements you don’t want to split
        before: [".page-break-before"], // force page break before
        after: [".page-break-after"], // force after
      },
    };

    html2pdf().set(opt).from(invoiceRef.current).save();
  };

  const handleDownloadPDF = async (
    invoiceContainer: HTMLElement,
    filename: string = "invoice.pdf",
    onProgress?: (progress: number) => void
  ): Promise<void> => {
    try {
      onProgress?.(0);

      // Step 1: Measure all blocks
      const blocks = measureBlocks(invoiceContainer);
      onProgress?.(10);

      // Step 2: Group blocks into pages
      const pageGroups = groupBlocksIntoPages(blocks);
      console.log(
        `Generated ${pageGroups.length} pages from ${blocks.length} blocks`
      );
      onProgress?.(20);

      // Step 3: Create temporary page containers
      const pageContainers = createPageContainers(invoiceContainer, pageGroups);
      onProgress?.(30);

      // Step 4: Initialize PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Step 5: Render each page to canvas and add to PDF
      for (let i = 0; i < pageContainers.length; i++) {
        const pageContainer = pageContainers[i];

        // Render page to canvas
        const canvas = await renderPageToCanvas(pageContainer);

        // Convert canvas to image data
        const imgData = canvas.toDataURL("image/jpeg");

        // Add page to PDF (first page is already created)
        if (i > 0) {
          pdf.addPage();
        }

        // Add image to PDF page
        pdf.addImage(
          imgData,
          "PNG",
          0,
          0,
          PDF_CONFIG.pdfWidth,
          PDF_CONFIG.pdfHeight
        );

        // Update progress
        onProgress?.(30 + ((i + 1) / pageContainers.length) * 60);
      }

      // Step 6: Clean up temporary containers
      pageContainers.forEach((container) => {
        document.body.removeChild(container);
      });

      onProgress?.(95);

      // Step 7: Download PDF
      pdf.save(filename);
      onProgress?.(100);
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    }
  };

  const downloadAsPDF1 = async () => {
    if (!invoiceRef.current) return;

    //  setIsGenerating(true);
    //  setProgress(0);

    try {
      await handleDownloadPDF(
        invoiceRef.current,
        `invoice-${data.invoiceNumber}.pdf`
        //  setProgress
      );
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      //  setIsGenerating(false);
      //  setProgress(0);
    }
  };

  const downloadAsPDF2 = async () => {
    if (!invoiceRef.current) return;

    //  setIsGenerating(true);
    //  setProgress(0);

    try {
      await handleDownloadPDF(
        invoiceRef.current,
        `invoice-${data.invoiceNumber}.pdf`
        //  setProgress
      );
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      //  setIsGenerating(false);
      //  setProgress(0);
    }
  };

  const downloadAsImage = async () => {
    if (!invoiceRef.current) return;

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 4, // Even higher scale for image
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        width: invoiceRef.current.scrollWidth,
        height: invoiceRef.current.scrollHeight,
      });

      const link = document.createElement("a");
      link.download = `invoice-${data.invoiceNumber}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    } catch (error) {
      console.error("Error generating image:", error);
    }
  };

  useImperativeHandle(ref, () => ({
    downloadAsPDF,
    printInvoice: handlePrint,
    downloadAsImage,
  }));

  const thStyle = {
    borderRight: "1px solid #000",
    padding: "2px",
    fontWeight: "bold",
  };

  const tdLeft = {
    borderRight: "1px solid #000",
    padding: "1px",
    paddingLeft: "4px",
    textAlign: "left",
    fontWeight: "bold",
  };

  const tdRight = {
    borderRight: "1px solid #000",
    padding: "1px",
    paddingRight: "4px",
    textAlign: "right",
    fontWeight: "bold",
  };

  const tdCenter = {
    borderRight: "1px solid #000",
    padding: "1px",
    textAlign: "center",
    fontWeight: "bold",
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-10">
      {/* Action Buttons */}
      {/* <div className="flex justify-center gap-4 mb-6 no-print">
        <button
          onClick={downloadAsPDF}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
        <button
          onClick={downloadAsImage}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Image
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div> */}

      {/* Invoice Content - Optimized for html2canvas */}
      <div
        ref={invoiceRef}
        className="invoice-container"
        style={{
          width: "794px", // A4 width at 96 DPI
          maxHeight: "1123px", // A4 height at 96 DPI
          height: "1123px", // Fixed height to prevent overflow
          minHeight: "1123px",
          backgroundColor: "#ffffff",
          fontFamily: "Arial, sans-serif",
          fontSize: "13px",
          lineHeight: "1.4",
          color: "#000000",
          margin: "0 auto",
          padding: "20px 40px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",

          // justifyContent: "space-between", // 🟢 Ensures vertical spacing between sections
        }}
      >
        {/* Header Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            alignItems: "center",
          }}
        >
          <div></div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <h1
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                letterSpacing: "0.10em",
                color: "blue",
              }}
            >
              TAX INVOICE
            </h1>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              fontSize: "14px",
              fontWeight: "initial",
            }}
          >
            ORIGINAL FOR RECIPIENT
          </div>
        </div>

        {/* Main Invoice Container */}
        <div
          style={{
            border: "2px solid #000000",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            pageBreakAfter: "always",
          }}
        >
          {/* Company Header */}
          <div
            className="block-no-break"
            style={{
              borderBottom: "1px solid #000000",
              padding: "2px",
              display: "grid",
              gridTemplateColumns: "1fr 2fr 1fr", // single-column layout
              // justifyItems: "center", // horizontal centering
              alignItems: "center", // vertical centering
            }}
          >
            <div className="company-logo">
              <img
                src={base64Logo}
                alt="Company Logo"
                style={{
                  height: "100px",
                  width: "100px",
                  objectFit: "contain",
                  display: "block",
                  imageRendering: "crisp-edges",
                  borderRadius: "4px",
                }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/placeholder-logo.png";
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                justifyItems: "center",
                alignItems: "center",
                textAlign: "center",
                lineHeight: "1.2",
              }}
            >
              <div style={{ fontSize: "18px", fontWeight: "bolder" }}>
                {data.companyName}
              </div>

              {data.companyGSTIN && (
                <div style={{ fontSize: "13px", fontWeight: "bolder" }}>
                  GSTIN: {data.companyGSTIN}
                </div>
              )}

              <div
                style={{
                  fontSize: "13px",
                  whiteSpace: "pre-line",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                }}
                dangerouslySetInnerHTML={{
                  __html: data.companyAddress?.replace(/\n/g, "<br />") || "",
                }}
              ></div>

              <div
                className="flex space-x-2"
                style={{ fontSize: "13px", gap: "8px" }}
              >
                {data.companyEmail && (
                  <p style={{ fontWeight: "bold" }}>
                    Email:{" "}
                    <span style={{ fontWeight: "normal" }}>
                      {data.companyEmail}
                    </span>
                  </p>
                )}
                {data.companyPhone && (
                  <p style={{ fontWeight: "bold" }}>
                    Mobile:{" "}
                    <span style={{ fontWeight: "normal" }}>
                      {data.companyPhone}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Customer and Invoice Details */}
          <div
            className="block-no-break"
            style={{ borderBottom: "1px solid #000000", display: "flex" }}
          >
            <div
              style={{
                borderRight: "1px solid #000000",
                paddingTop: "2px",
                paddingLeft: "5px",
                width: "50%",
                boxSizing: "border-box",
                lineHeight: "1.2",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "14px",
                }}
              >
                Customer Details:
              </div>
              <div style={{ fontSize: "13px" }}>
                <div style={{ fontWeight: "bold", marginBottom: "1px" }}>
                  {data.customerName}
                </div>
                {data.customerGSTIN && (
                  <div style={{ marginBottom: "1px", fontWeight: "bold" }}>
                    GSTIN: {data.customerGSTIN}
                  </div>
                )}
                {data.customerPhone && (
                  <div style={{ marginBottom: "1px" }}>
                    Phone: {data.customerPhone}
                  </div>
                )}
                {data.customerEmail && (
                  <div style={{ marginBottom: "1px" }}>
                    Email: {data.customerEmail}
                  </div>
                )}
                <div
                  style={{
                    fontWeight: "bold",
                    marginTop: "1px",
                    marginBottom: "1px",
                  }}
                >
                  Billing Address:
                </div>
                <div style={{ whiteSpace: "pre-line" }}>
                  {data.customerAddress}
                </div>
              </div>
            </div>

            <div
              style={{
                paddingTop: "2px",
                paddingLeft: "5px",
                paddingRight: "5px",
                width: "50%",
                boxSizing: "border-box",
                lineHeight: "1.2",
              }}
            >
              <div style={{ fontSize: "13px", lineHeight: "1.2" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>Invoice #:</span>
                  <span style={{ fontWeight: "bold" }}>
                    {data.invoiceNumber}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>Invoice Date:</span>
                  <span style={{ fontWeight: "bold" }}>{data.invoiceDate}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>Due Date:</span>
                  <span style={{ fontWeight: "bold" }}>{data.dueDate}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>Place of Supply:</span>
                  <span style={{ fontWeight: "bold" }}>
                    {data.placeOfSupply}
                  </span>
                </div>
                {data.dispatchFrom && (
                  <>
                    <div
                      style={{
                        marginBottom: "1px",
                        fontWeight: "bold",
                      }}
                    >
                      <span>Dispatch From:</span>
                    </div>
                    <div
                      style={{
                        marginTop: "2px",
                        fontSize: "13px",
                      }}
                    >
                      {data.dispatchFrom}
                    </div>
                  </>
                )}

                {data.shippingAddress && (
                  <>
                    <div
                      style={{
                        marginBottom: "1px",
                        fontWeight: "bold",
                      }}
                    >
                      <span>Shipping Address:</span>
                    </div>
                    <div
                      style={{
                        marginTop: "2px",
                        fontSize: "13px",
                      }}
                    >
                      {data.shippingAddress}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div
            style={{
              borderBottom: "1px solid #000000",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "stretch",
            }}
          >
            <table
              style={{
                width: "100%",
                height: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
                lineHeight: "1.3",
                pageBreakInside: "avoid",
              }}
            >
              <thead className="block-no-break">
                <tr style={{ borderBottom: "1px solid #000000" }}>
                  <th
                    style={{
                      borderRight: "1px solid #000000",
                      padding: "4px 4px",
                      textAlign: "left",
                      width: "4%",
                      fontWeight: "bold",
                    }}
                  >
                    #
                  </th>
                  <th
                    style={{
                      borderRight: "1px solid #000000",
                      padding: "4px 4px",
                      textAlign: "left",
                      fontWeight: "bold",
                      width: "38%",
                    }}
                  >
                    Item
                  </th>
                  <th
                    style={{
                      borderRight: "1px solid #000000",
                      padding: "4px 4px",
                      textAlign: "right",
                      width: "12%",
                      fontWeight: "bold",
                    }}
                  >
                    HSN/SAC
                  </th>
                  <th
                    style={{
                      borderRight: "1px solid #000000",
                      padding: "4px 4px",
                      textAlign: "right",
                      width: "10%",
                      fontWeight: "bold",
                    }}
                  >
                    Tax
                  </th>
                  <th
                    style={{
                      borderRight: "1px solid #000000",
                      padding: "4px 4px",
                      textAlign: "right",
                      width: "11%",
                      fontWeight: "bold",
                    }}
                  >
                    Qty
                  </th>
                  <th
                    style={{
                      borderRight: "1px solid #000000",
                      padding: "4px 4px",
                      textAlign: "right",
                      width: "12%",
                      fontWeight: "bold",
                    }}
                  >
                    Rate/Item
                  </th>
                  <th
                    style={{
                      padding: "4px 4px",
                      textAlign: "right",
                      width: "13%",
                      fontWeight: "bold",
                    }}
                  >
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.items.map((item) => (
                  <tr
                    className="block-no-break"
                    key={item.id}
                    style={{ height: "2px" }}
                  >
                    <td
                      style={{
                        borderRight: "1px solid #000000",
                        padding: "4px",
                        paddingTop: "1px",
                        paddingBottom: "0px",
                        fontWeight: "bold",
                      }}
                    >
                      {item.id}
                    </td>
                    <td
                      style={{
                        borderRight: "1px solid #000000",
                        padding: "4px",
                        paddingTop: "1px",
                        paddingBottom: "0px",
                        fontWeight: "bold",
                      }}
                    >
                      {item.name}
                    </td>
                    <td
                      style={{
                        borderRight: "1px solid #000000",
                        padding: "4px",
                        paddingTop: "1px",
                        paddingBottom: "0px",
                        textAlign: "right",
                      }}
                    >
                      {item.hsnSac}
                    </td>
                    <td
                      style={{
                        borderRight: "1px solid #000000",
                        padding: "4px",
                        paddingTop: "1px",
                        paddingBottom: "0px",
                        textAlign: "right",
                        fontWeight: "bold",
                      }}
                    >
                      {item.tax}
                    </td>
                    <td
                      style={{
                        borderRight: "1px solid #000000",
                        padding: "4px",
                        paddingTop: "1px",
                        paddingBottom: "0px",
                        textAlign: "right",
                      }}
                    >
                      {item.qty}
                    </td>
                    <td
                      style={{
                        borderRight: "1px solid #000000",
                        padding: "4px",
                        paddingTop: "1px",
                        paddingBottom: "0px",
                        textAlign: "right",
                        fontWeight: "bold",
                      }}
                    >
                      {item.ratePerItem}
                    </td>
                    <td
                      style={{
                        padding: "4px",
                        paddingTop: "1px",
                        paddingBottom: "0px",
                        textAlign: "right",
                      }}
                    >
                      {item.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}

                <tr className="block-no-break" style={{ paddingBottom: "2px" }}>
                  <td
                    style={{
                      borderRight: "1px solid #000000",
                      padding: "4px",
                      paddingTop: "1px",
                      paddingBottom: "0px",
                    }}
                  ></td>
                  <td
                    style={{
                      padding: "4px",
                      paddingTop: "1px",
                      paddingBottom: "0px",
                      textAlign: "right",
                      borderRight: "1px solid #000000",
                      fontWeight: "bold",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        height: "100%",
                      }}
                    >
                      {data.additionalCharges.length > 0 && (
                        <div style={{ paddingBottom: "10px" }}>
                          {data.additionalCharges.map((charge, idx) => (
                            <div key={idx} style={{ marginBottom: "1px" }}>
                              {charge.value}
                            </div>
                          ))}
                        </div>
                      )}
                      {data?.tds?.enabled && (
                        <div>
                          TDS - {data?.tds.code} ({data.tds.description})
                        </div>
                      )}
                      {data?.tdsUnderGst?.enabled && (
                        <div>TDS under GST - {data?.tdsUnderGst.rate}%</div>
                      )}
                      {data?.tcs?.enabled && <div>TCS - {data?.tcs.rate}%</div>}
                      {data.globalDiscount && <div>Global Discount</div>}
                      {data.additionalDiscount && (
                        <div>Additional Discount</div>
                      )}
                      {data.totalDiscount && <div>Total Discount</div>}
                    </div>
                  </td>

                  <td
                    style={{
                      borderRight: "1px solid #000000",
                      padding: "4px",
                      paddingTop: "1px",
                      paddingBottom: "0px",
                    }}
                  ></td>
                  <td
                    style={{
                      borderRight: "1px solid #000000",
                      padding: "4px",
                      paddingTop: "1px",
                      paddingBottom: "0px",
                    }}
                  ></td>
                  <td
                    style={{
                      borderRight: "1px solid #000000",
                      padding: "4px",
                      paddingTop: "1px",
                      paddingBottom: "0px",
                    }}
                  ></td>
                  <td
                    style={{
                      borderRight: "1px solid #000000",
                      padding: "4px",
                      paddingTop: "1px",
                      paddingBottom: "0px",
                    }}
                  ></td>
                  <td
                    style={{
                      padding: "4px",
                      paddingTop: "1px",
                      paddingBottom: "0px",
                      textAlign: "right",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        height: "100%",
                      }}
                    >
                      {data.additionalCharges.length > 0 && (
                        <div style={{ paddingBottom: "10px" }}>
                          {data.additionalCharges.map((charge, idx) => (
                            <div key={idx} style={{ marginBottom: "1px" }}>
                              {parseFloat(charge.price).toFixed(2)}
                            </div>
                          ))}
                        </div>
                      )}
                      {data?.tds?.enabled && (
                        <div>{data?.tds.amount.toFixed(2)}</div>
                      )}
                      {data?.tdsUnderGst?.enabled && (
                        <div>-{data?.tdsUnderGst.amount.toFixed(2)}</div>
                      )}
                      {data?.tcs?.enabled && (
                        <div>-{data?.tcs.amount.toFixed(2)}</div>
                      )}
                      {data.globalDiscount && (
                        <div>-{data.globalDiscount.toFixed(2)}</div>
                      )}
                      {data.additionalDiscount && (
                        <div>-{data.additionalDiscount.toFixed(2)}</div>
                      )}
                      {data.totalDiscount && (
                        <div>-{data.totalDiscount.toFixed(2)}</div>
                      )}
                    </div>
                  </td>
                </tr>
                {/* Total Row */}
                <tr
                  className="block-no-break"
                  style={{
                    borderTop: "1px solid #000000",
                    fontWeight: "bold",
                    fontSize: "15px",
                    height: "3px",
                  }}
                >
                  <td
                    style={{
                      borderRight: "1px solid #000000",
                      padding: "4px",
                      paddingTop: "1px",
                      paddingBottom: "0px",
                    }}
                  ></td>
                  <td
                    style={{
                      borderRight: "1px solid #000000",
                      padding: "4px",
                      paddingTop: "1px",
                      paddingBottom: "0px",
                      textAlign: "right",
                    }}
                  >
                    Total
                  </td>
                  <td
                    style={{
                      borderRight: "1px solid #000000",
                      padding: "4px",
                      paddingTop: "1px",
                      paddingBottom: "0px",
                    }}
                  ></td>
                  <td
                    style={{
                      borderRight: "1px solid #000000",
                      padding: "4px",
                      paddingTop: "1px",
                      paddingBottom: "0px",
                    }}
                  ></td>
                  <td
                    style={{
                      borderRight: "1px solid #000000",
                      padding: "4px",
                      paddingTop: "1px",
                      paddingBottom: "0px",
                      textAlign: "right",
                    }}
                  >
                    {data.totalQuantity}.000
                  </td>
                  <td
                    style={{
                      borderRight: "1px solid #000000",
                      padding: "4px",
                      paddingTop: "1px",
                      paddingBottom: "0px",
                    }}
                  ></td>
                  <td
                    style={{
                      padding: "4px",
                      paddingTop: "px",
                      paddingBottom: "0px",
                      textAlign: "right",
                    }}
                  >
                    ₹{data.totalAmount.toFixed(2)}
                  </td>
                </tr>
                {/* Fill empty rows */}
                {/* {Array.from({ length: emptyRows > 0 ? emptyRows : 0 }).map(
                  (_, idx) => (
                    <tr key={`empty-${idx}`}>
                      <td
                        style={{
                          borderRight: "1px solid #000000",
                          padding: "4px",
                          paddingTop: "1px",
                          paddingBottom: "0px",
                          height: "20px",
                        }}
                      >
                        &nbsp;
                      </td>
                      <td
                        style={{
                          borderRight: "1px solid #000000",
                          padding: "4px",
                          paddingTop: "1px",
                          paddingBottom: "0px",
                        }}
                      >
                        &nbsp;
                      </td>
                      <td
                        style={{
                          borderRight: "1px solid #000000",
                          padding: "4px",
                          paddingTop: "1px",
                          paddingBottom: "0px",
                        }}
                      >
                        &nbsp;
                      </td>
                      <td
                        style={{
                          borderRight: "1px solid #000000",
                          padding: "4px",
                          paddingTop: "1px",
                          paddingBottom: "0px",
                        }}
                      >
                        &nbsp;
                      </td>
                      <td
                        style={{
                          borderRight: "1px solid #000000",
                          padding: "4px",
                          paddingTop: "1px",
                          paddingBottom: "0px",
                        }}
                      >
                        &nbsp;
                      </td>
                      <td
                        style={{
                          borderRight: "1px solid #000000",
                          padding: "4px",
                          paddingTop: "1px",
                          paddingBottom: "0px",
                        }}
                      >
                        &nbsp;
                      </td>
                      <td
                        style={{
                          padding: "4px",
                          paddingTop: "1px",
                          paddingBottom: "0px",
                        }}
                      >
                        &nbsp;
                      </td>
                    </tr>
                  )
                )} */}
              </tbody>
            </table>
          </div>

          {/* Amount in Words */}
          <div
            className="block-no-break"
            style={{ borderBottom: "1px solid #000000", padding: "4px" }}
          >
            <div style={{ fontSize: "13px" }}>
              <span style={{ fontWeight: "bold" }}>
                Amount Chargeable (in words):{" "}
              </span>
              {data.amountInWords}
            </div>
          </div>

          {/* Tax Summary */}
          <div
            className="block-no-break"
            style={{ borderBottom: "1px solid #000000" }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
                lineHeight: "1.2",
              }}
            >
              <thead>
                <tr style={{ height: "3px" }}>
                  <th
                    style={{
                      borderRight: "1px solid #000",
                      padding: "4px",
                      paddingTop: "2px",
                      paddingBottom: "0px",
                      fontWeight: "bold",
                      width: "200px",
                      textAlign: "left",
                    }}
                  >
                    HSN/SAC
                  </th>
                  <th
                    style={{
                      borderRight: "1px solid #000",
                      padding: "4px",
                      paddingTop: "2px",
                      paddingBottom: "0px",
                      fontWeight: "bold",
                      width: "140px",
                      textAlign: "right",
                    }}
                  >
                    Taxable Value
                  </th>
                  <th style={{ ...thStyle, textAlign: "center" }} colSpan={2}>
                    Central Tax
                  </th>
                  <th style={{ ...thStyle, textAlign: "center" }} colSpan={2}>
                    State/UT Tax
                  </th>
                  <th
                    style={{
                      padding: "2px",
                      fontWeight: "bold",
                      textAlign: "center",
                      width: "200px",
                    }}
                  >
                    Total Tax Amount
                  </th>
                </tr>
                <tr>
                  <th style={thStyle}></th>
                  <th style={thStyle}></th>
                  <th
                    style={{
                      borderRight: "1px solid #000",
                      borderTop: "1px solid #000",
                      padding: "2px",
                      fontWeight: "bold",
                      textAlign: "center",
                      width: "100px",
                    }}
                  >
                    Rate
                  </th>
                  <th
                    style={{
                      borderRight: "1px solid #000",
                      borderTop: "1px solid #000",
                      padding: "2px",
                      fontWeight: "bold",
                      textAlign: "center",
                      width: "100px",
                    }}
                  >
                    Amount
                  </th>
                  <th
                    style={{
                      borderRight: "1px solid #000",
                      borderTop: "1px solid #000",
                      padding: "2px",
                      fontWeight: "bold",
                      textAlign: "center",
                      width: "100px",
                    }}
                  >
                    Rate
                  </th>
                  <th
                    style={{
                      borderRight: "1px solid #000",
                      borderTop: "1px solid #000",
                      padding: "2px",
                      fontWeight: "bold",
                      textAlign: "center",
                      width: "100px",
                    }}
                  >
                    Amount
                  </th>
                  <th
                    style={{
                      padding: "2px",
                      fontWeight: "bold",
                    }}
                  ></th>
                </tr>
              </thead>
              <tbody>
                {data.taxBreakdown.map((tax) => (
                  <tr key={tax.hsnSac} style={{ borderTop: "1px solid #000" }}>
                    <td style={tdLeft}>{tax.hsnSac}</td>
                    <td style={tdRight}>{tax.taxableValue.toFixed(2)}</td>
                    <td style={tdCenter}>{tax.centralTaxRate}%</td>
                    <td style={tdCenter}>{tax.centralTaxAmount.toFixed(2)}</td>
                    <td style={tdCenter}>{tax.stateUtTaxRate}%</td>
                    <td style={tdCenter}>{tax.stateUtTaxAmount.toFixed(2)}</td>
                    <td
                      style={{
                        paddingRight: "1px",
                        fontWeight: "bold",
                        textAlign: "right",
                      }}
                    >
                      {tax.totalTaxAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr
                  style={{
                    borderTop: "1px solid #000",
                    fontWeight: "bold",
                    fontSize: "15px",
                  }}
                >
                  <td style={tdRight}>TOTAL</td>
                  <td style={tdRight}>{data.taxableAmount.toFixed(2)}</td>
                  <td style={tdCenter}></td>
                  <td style={tdCenter}>{data.totalCentralTax.toFixed(2)}</td>
                  <td style={tdCenter}></td>
                  <td style={tdCenter}>{data.totalStateTax.toFixed(2)}</td>
                  <td
                    style={{
                      paddingRight: "4px",
                      fontWeight: "bold",
                      textAlign: "right",
                    }}
                  >
                    {data.totalTaxAmount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Status */}
          {data.paymentStatus === "paid" && (
            <div
              className="block-no-break"
              style={{
                borderBottom: "1px solid #000000",
                padding: "4px",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "end",
                    fontWeight: "bold",
                    fontSize: "14px",
                    marginBottom: "4px",
                    justifyContent: "flex-end",
                  }}
                >
                  <CheckCircle
                    style={{
                      height: "20px",
                      width: "20px",
                      //   backgroundColor: "green",
                      color: "green",
                      //   padding: "2px",
                      borderRadius: "20px",
                      marginRight: "4px",
                    }}
                  />
                  Amount Paid
                </div>
                <div style={{ fontSize: "13px", fontWeight: "bold" }}>
                  ₹{data.totalAmount.toFixed(2)} Paid via {data.paymentMethod}{" "}
                  on {data.paymentDate}
                </div>
              </div>
            </div>
          )}

          {/* Footer Section */}
          <div
            className="block-no-break"
            style={{ borderBottom: "1px solid #000000" }}
          >
            <div style={{ display: "flex" }}>
              {/* Bank Details */}
              <div
                style={{
                  width: "40%",
                  padding: "8px",
                  paddingTop: "1px",
                  paddingBottom: "1px",
                }}
              >
                <div style={{ fontSize: "13px" }}>
                  {data?.bankName && (
                    <>
                      <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                        Bank Details:
                      </div>
                      <div style={{ display: "flex" }}>
                        <div style={{ marginRight: "18px" }}>
                          <div style={{ marginBottom: "1px" }}>
                            <span>Bank:</span>
                          </div>
                          <div style={{ marginBottom: "1px" }}>
                            <span>Account #:</span>
                          </div>
                          <div style={{ marginBottom: "1px" }}>
                            <span>IFSC Code:</span>
                          </div>
                          <div style={{ marginBottom: "8px" }}>
                            <span>Branch:</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ marginBottom: "1px" }}>
                            <span style={{ fontWeight: "bold" }}>
                              {" "}
                              {data.bankName}
                            </span>
                          </div>
                          <div style={{ marginBottom: "1px" }}>
                            <span style={{ fontWeight: "bold" }}>
                              {" "}
                              {data.accountNumber}
                            </span>
                          </div>
                          <div style={{ marginBottom: "1px" }}>
                            <span style={{ fontWeight: "bold" }}>
                              {" "}
                              {data.ifscCode}
                            </span>
                          </div>
                          <div style={{ marginBottom: "8px" }}>
                            <span style={{ fontWeight: "bold" }}>
                              {" "}
                              {data.branch}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  {data.paymentNotes && (
                    <>
                      <div style={{ fontWeight: "bold", marginBottom: "1px" }}>
                        Notes:
                      </div>
                      <div style={{ fontSize: "10px" }}>
                        {data.paymentNotes}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* QR Code */}
              <div
                style={{
                  display: "flex",
                  width: "20%",
                  padding: "8px",
                  paddingBottom: "1px",
                  paddingTop: "1px",
                  textAlign: "left",
                  borderRight: "1px solid #000000",
                  flexDirection: "column",
                  justifyContent: "left",
                  alignItems: "left",
                }}
              >
                <div style={{ fontSize: "13px", marginBottom: "2px" }}>
                  Pay using UPI:
                </div>
                <QRCodeSVG value={data.qrcode} size={120} />
              </div>

              {/* Signature */}
              <div
                style={{ width: "40%", padding: "8px", paddingBottom: "1px" }}
              >
                <div style={{ textAlign: "right" }}>
                  <div style={{ marginBottom: "8px" }}>
                    For {data.companyName}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div className="signature-logo">
                        <img
                          src={base64Signature}
                          alt="Signature"
                          style={{
                            height: "100px",
                            width: "100px",
                            objectFit: "contain", // Maintains aspect ratio
                            display: "block", // Removes extra space below image
                            imageRendering: "crisp-edges", // Ensures best quality
                            borderRadius: "4px", // Optional: soft corner rounding
                          }}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/placeholder-logo.png"; // fallback logo
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ fontSize: "10px", textAlign: "right" }}>
                      Authorized Signatory
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div style={{ padding: "8px", fontSize: "10px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "1px" }}>
              Terms and Conditions:
            </div>
            <div style={{ marginBottom: "1px" }}>{data.notes}</div>
          </div>

          {/* Page Footer */}
          <div
            style={{
              borderTop: "1px solid #000000",
              padding: "4px",
              fontSize: "10px",
              textAlign: "center",
            }}
          >
            Page 1/1 • This is a digitally signed document.
          </div>
        </div>
      </div>
    </div>
  );
});

export default InvoiceCanvas;
