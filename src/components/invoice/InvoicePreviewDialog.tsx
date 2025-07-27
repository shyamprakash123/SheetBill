import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import Button from "../ui/Button";
import toast from "react-hot-toast";
import html2pdf from "html2pdf.js";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import Temp1 from "../templates/temp_1";
import InvoiceCanvas from "../templates/temp_pages";
import { Image } from "lucide-react";
import { Settings } from "../../lib/backend-service";
import { useAuthStore } from "../../store/auth";

interface InvoicePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  settings: Settings;
  googleTokens: string;
}

const calculateTotalDiscount = (
  subtotal,
  globalDiscount = 0,
  additionalDiscount = 0
) => {
  const globalDiscountAmount =
    globalDiscount.type === "percentage"
      ? (subtotal * globalDiscount.value) / 100
      : globalDiscount.value;

  const discountedSubtotal = globalDiscountAmount + additionalDiscount;

  return {
    globalDiscountAmount,
    additionalDiscount,
    discountedSubtotal,
  };
};

function getFileId(url: string): string | null {
  if (!url) return null;
  const regex = /\/d\/([a-zA-Z0-9_-]{10,})/;
  const match = url.match(regex);
  const fileId = match ? match[1] : null;
  // return `https://drive.google.com/file/d/${fileId}/preview`;
  return fileId;
  // return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
}

const generateQRString = (upiId: string, amount: string) => {
  const upiString = `upi://pay?pa=${upiId}&am=${amount}&cu=INR`;
  return upiString;
};

const InvoicePreviewDialog: React.FC<InvoicePreviewDialogProps> = ({
  isOpen,
  onClose,
  invoice,
  settings,
  googleTokens,
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const childRef = useRef(null);

  // Transform invoice data to match Temp1 component format
  const transformInvoiceData = (invoiceData: any) => {
    if (!invoiceData) return null;

    const taxBreakdown = invoiceData.items.reduce(
      (acc, item) => {
        const taxRate = item.product.taxRate;
        const hsnSac = item.product.hsnCode || "N/A";
        const taxableValue = item.unitPrice * item.quantity;
        const centralTaxAmount = item.taxAmount / 2;
        const stateUtTaxAmount = item.taxAmount / 2;
        const totalTaxAmount = item.taxAmount;

        const existing = acc.breakdown.find(
          (entry) => entry.taxRate === taxRate && entry.hsnSac === hsnSac
        );

        if (existing) {
          existing.taxableValue += taxableValue;
          existing.centralTaxAmount += centralTaxAmount;
          existing.stateUtTaxAmount += stateUtTaxAmount;
          existing.totalTaxAmount += totalTaxAmount;
        } else {
          acc.breakdown.push({
            hsnSac,
            taxableValue,
            centralTaxRate: taxRate / 2,
            centralTaxAmount,
            stateUtTaxRate: taxRate / 2,
            stateUtTaxAmount,
            totalTaxAmount,
            taxRate,
          });
        }

        acc.totalCentralTax += centralTaxAmount;
        acc.totalStateTax += stateUtTaxAmount;

        return acc;
      },
      {
        breakdown: [],
        totalCentralTax: 0,
        totalStateTax: 0,
      }
    );

    const { globalDiscountAmount, additionalDiscount, discountedSubtotal } =
      calculateTotalDiscount(
        invoice.subtotal,
        invoice.globalDiscount,
        invoice.extraDiscount
      );

    return {
      companyName: settings.companyDetails.name,
      companyAddress: `${settings.companyDetails.billing_address}, \n ${settings.companyDetails.billing_city}, ${settings.companyDetails.billing_state}, ${settings.companyDetails.billing_country}, ${settings.companyDetails.billing_pincode}.`,
      companyGSTIN: settings.companyDetails.gstin,
      companyPhone: settings.companyDetails.phone,
      companyEmail: settings.companyDetails.email,
      companyLogo: getFileId(settings.companyDetails.logo),
      invoiceNumber: invoiceData.id || "",
      invoiceDate: invoiceData.invoiceDate
        ? new Date(invoiceData.invoiceDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "",
      dueDate: invoiceData.dueDate
        ? new Date(invoiceData.dueDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "",
      placeOfSupply: "29-KARNATAKA",
      customerName:
        invoiceData.customer?.value || invoiceData.customerName || "",
      customerPhone: invoiceData.customer?.phone || null,
      customerEmail: invoiceData.customer?.email || null,
      customerAddress: invoiceData.shipping?.value.replace(/\n/g, "") || null,
      customerGSTIN: invoiceData.customer?.gstin || null,
      dispatchFrom:
        invoiceData.dispatchFromAddress?.value.replace(/\n/g, "") || null,
      shippingAddress: invoiceData.shipping?.value.replace(/\n/g, "") || null,
      items:
        invoiceData.items?.map((item: any, index: number) => ({
          id: index + 1,
          item: item,
          name: item.product.name || "",
          hsnSac: item.hsnCode || null,
          tax: `${item.product.taxRate || 0}%`,
          qty: `${item.quantity || 1} ${item.product.unit || "NOS"}`,
          ratePerItem: (
            (item.product.price || 0) *
            (1 + (item.product.taxRate || 0) / 100)
          ).toFixed(2),
          amount: item.total || 0,
        })) || [],
      additionalCharges: invoiceData.additionalCharges || null,
      globalDiscount: globalDiscountAmount,
      additionalDiscount: additionalDiscount,
      totalDiscount: discountedSubtotal,
      tds: invoiceData.tds || null,
      tdsUnderGst: invoiceData.tdsUnderGst || null,
      tcs: invoiceData.tcs || null,
      taxableAmount: invoiceData.subtotal || 0,
      cgst: (invoiceData.taxAmount || 0) / 2,
      sgst: (invoiceData.taxAmount || 0) / 2,
      roundOff: 0,
      totalAmount: invoiceData.total || 0,
      totalQuantity:
        invoiceData.items?.reduce(
          (sum: number, item: any) => sum + (item.quantity || 1),
          0
        ) || 0,
      amountInWords: `INR ${convertNumberToWords(
        invoiceData.total || 0
      )} Only. E & O.E`,
      taxBreakdown: taxBreakdown.breakdown,
      totalCentralTax: taxBreakdown.totalCentralTax,
      totalStateTax: taxBreakdown.totalStateTax,
      totalTaxAmount: invoiceData.taxAmount || 0,
      bankName: invoiceData.bankAccount?.value || null,
      accountNumber: invoiceData.bankAccount?.id || null,
      ifscCode: invoiceData.bankAccount?.others.bank_ifscCode || null,
      branch: invoiceData.bankAccount?.others.bank_branch || null,
      qrcode:
        generateQRString(
          invoice.bankAccount?.others?.bank_upi,
          invoiceData.total
        ) || null,
      paymentNotes: invoiceData.paymentNotes,
      notes: invoiceData.notes.note,
      signature: getFileId(invoiceData.signature.sig),
      paymentStatus: invoiceData.status === "Paid" ? "Paid" : "Pending",
      paymentDate:
        invoiceData.status === "Paid"
          ? new Date().toLocaleDateString("en-GB")
          : "",
      paymentMethod: "UPI",
    };
  };

  // Simple number to words conversion (basic implementation)
  const convertNumberToWords = (num: number): string => {
    if (num === 0) return "Zero";

    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
    const thousands = ["", "Thousand", "Lakh", "Crore"];

    const convertHundreds = (n: number): string => {
      let result = "";
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + " Hundred ";
        n %= 100;
      }
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + " ";
        n %= 10;
      } else if (n >= 10) {
        result += teens[n - 10] + " ";
        return result;
      }
      if (n > 0) {
        result += ones[n] + " ";
      }
      return result;
    };

    if (num < 1000) {
      return convertHundreds(num).trim();
    }

    let result = "";
    let thousandIndex = 0;

    while (num > 0) {
      if (num % 1000 !== 0) {
        result =
          convertHundreds(num % 1000) + thousands[thousandIndex] + " " + result;
      }
      num = Math.floor(num / 1000);
      thousandIndex++;
    }

    return result.trim();
  };

  const handlePrint = () => {
    childRef.current?.printInvoice();
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      childRef.current?.downloadAsPDF();
      // In a real implementation, you would use a library like jsPDF or html2pdf
      // For now, we'll simulate the PDF generation

      //   const element = printRef.current;

      //   html2pdf()
      //     .set({
      //       margin: 5,
      //       filename: "invoice.pdf",
      //       html2canvas: {
      //         scale: 10, // higher scale = better resolution
      //         useCORS: true,
      //         allowTaint: true,
      //         logging: true,
      //       },
      //       image: { type: "jpeg", quality: 1 },
      //       jsPDF: { unit: "px", format: "a4", orientation: "portrait" },
      //     })
      //     .from(element)
      //     .save();

      //   if (!element) {
      //     console.log("no");
      //     return;
      //   }

      //   const canvas = await html2canvas(element, {
      //     scale: 2,
      //   });
      //   const data = canvas.toDataURL("image/png");

      //   const pdf = new jsPDF({
      //     orientation: "portrait",
      //     unit: "px",
      //     format: "a4",
      //   });

      //   const imgProperties = pdf.getImageProperties(data);
      //   const pdfWidth = pdf.internal.pageSize.getWidth();
      //   const pdfHeight = (imgProperties.height * pdfWidth) / imgProperties.width;

      //   pdf.addImage(data, "PNG", 0, 0, pdfWidth, pdfHeight);
      //   pdf.save("invoice.pdf");

      toast.success("PDF generated successfully");
    } catch (error) {
      toast.error("Failed to generate PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadImage = async () => {
    setIsGeneratingImage(true);
    try {
      childRef.current?.downloadAsImage();

      toast.success("Image generated successfully");
    } catch (error) {
      toast.error("Failed to generate Image");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleShareWhatsApp = () => {
    const message = `Invoice ${invoice?.id} for ${
      invoice?.customer?.value || "Customer"
    } - Amount: ₹${invoice?.total || 0}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    toast.success("WhatsApp share opened");
  };

  const transformedData = transformInvoiceData(invoice);

  if (!transformedData) return null;

  // if (!googleToken) return <div>Loading token...</div>;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 overflow-hidden"
          style={{ top: "0px", padding: "0px" }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-4 bg-white rounded-lg shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Invoice Preview
                  </h2>
                  <p className="text-sm text-gray-500">
                    {invoice?.id} • {invoice?.customer?.value}
                  </p>
                </div>
              </div>

              <div className="flex no-print items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="flex items-center space-x-2"
                >
                  <PrinterIcon className="h-4 w-4" />
                  <span>Print</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="flex items-center space-x-2"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span>
                    {isGeneratingPDF ? "Generating..." : "Download PDF"}
                  </span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadImage}
                  disabled={isGeneratingImage}
                  className="flex items-center space-x-2"
                >
                  <Image className="h-4 w-4" />
                  <span>
                    {isGeneratingImage ? "Generating..." : "Download Image"}
                  </span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareWhatsApp}
                  className="flex items-center space-x-2 text-green-600 border-green-600 hover:bg-green-50"
                >
                  <ShareIcon className="h-4 w-4" />
                  <span>Share</span>
                </Button>

                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              <div className="flex mx-auto bg-white text-black">
                <InvoiceCanvas
                  ref={childRef}
                  data={transformedData}
                  googleTokens={googleTokens}
                />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InvoicePreviewDialog;
