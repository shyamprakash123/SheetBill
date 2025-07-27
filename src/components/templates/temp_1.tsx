import React from "react";
import { CheckCircle, CheckCircle2, CheckCircle2Icon } from "lucide-react";

interface InvoiceItem {
  id: number;
  item: string;
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

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  placeOfSupply: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: InvoiceItem[];
  deliveryCharges: number;
  packagingCharges: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
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
}

const sampleInvoiceData: InvoiceData = {
  invoiceNumber: "INV-3",
  invoiceDate: "12 Apr 2025",
  dueDate: "12 Apr 2025",
  placeOfSupply: "29-KARNATAKA",
  customerName: "Kishore Biyani",
  customerPhone: "9999999999",
  customerAddress: "64, Whitefield Main Rd\nBengaluru, KARNATAKA, 560066",
  items: [
    {
      id: 1,
      item: "Haldirams Samosa 200g",
      hsnSac: "392310",
      tax: "5%",
      qty: "3 NOS",
      ratePerItem: 61.9,
      amount: 185.7,
    },
    {
      id: 2,
      item: "Britania Whole Wheat Bread",
      hsnSac: "392310",
      tax: "5%",
      qty: "2 NOS",
      ratePerItem: 42.86,
      amount: 85.72,
    },
    {
      id: 3,
      item: "Surf Excel Easy Wash Detergent Powder 1 Kg",
      hsnSac: "392310",
      tax: "5%",
      qty: "1 KGS",
      ratePerItem: 122.03,
      amount: 122.03,
    },
    {
      id: 4,
      item: "Sanitizer",
      hsnSac: "392310",
      tax: "5%",
      qty: "3 NOS",
      ratePerItem: 127.12,
      amount: 381.36,
    },
    {
      id: 5,
      item: "Utensils Set",
      hsnSac: "76151030",
      tax: "12%",
      qty: "1 NOS",
      ratePerItem: 1784.82,
      amount: 1784.82,
    },
    {
      id: 6,
      item: "Kitchen Towel Set",
      hsnSac: "392310",
      tax: "5%",
      qty: "5 NOS",
      ratePerItem: 94.29,
      amount: 471.43,
    },
    {
      id: 7,
      item: "Green Cotton Bedsheet",
      hsnSac: "392310",
      tax: "5%",
      qty: "5 NOS",
      ratePerItem: 339.29,
      amount: 1696.43,
    },
    {
      id: 8,
      item: "Premium Medjool Dates",
      hsnSac: "392310",
      tax: "5%",
      qty: "1 KGS",
      ratePerItem: 1875.0,
      amount: 1875.0,
    },
    {
      id: 9,
      item: "Fortune Sunflower Oil",
      hsnSac: "392310",
      tax: "5%",
      qty: "2 LTR",
      ratePerItem: 200.0,
      amount: 400.0,
    },
    {
      id: 10,
      item: "Haldiram's Bhujia Sev",
      hsnSac: "8708",
      tax: "5%",
      qty: "10 NOS",
      ratePerItem: 190.48,
      amount: 1904.76,
    },
  ],
  deliveryCharges: 100.0,
  packagingCharges: 100.0,
  taxableAmount: 9107.25,
  cgst: 178.06,
  sgst: 178.06,
  roundOff: 0.45,
  totalAmount: 9678.0,
  totalQuantity: 33,
  amountInWords:
    "INR Nine Thousand, Six Hundred And Seventy-Eight Rupees Only. E & O.E",
  taxBreakdown: [
    {
      hsnSac: "392310",
      taxableValue: 5217.67,
      centralTaxRate: 2.5,
      centralTaxAmount: 130.44,
      stateUtTaxRate: 2.5,
      stateUtTaxAmount: 130.44,
      totalTaxAmount: 260.88,
    },
    {
      hsnSac: "76151030",
      taxableValue: 1784.82,
      centralTaxRate: 6,
      centralTaxAmount: 107.09,
      stateUtTaxRate: 6,
      stateUtTaxAmount: 107.09,
      totalTaxAmount: 214.18,
    },
    {
      hsnSac: "8708",
      taxableValue: 1904.76,
      centralTaxRate: 2.5,
      centralTaxAmount: 47.62,
      stateUtTaxRate: 2.5,
      stateUtTaxAmount: 47.62,
      totalTaxAmount: 95.24,
    },
  ],
  totalTaxAmount: 570.3,
  bankName: "YES BANK",
  accountNumber: "6678999922445",
  ifscCode: "YESBIN4567",
  branch: "Kodihalli",
  paymentStatus: "Paid",
  paymentDate: "12-04-2025",
  paymentMethod: "UPI",
};

export const Temp1: React.FC<{ data?: InvoiceData }> = ({
  data = sampleInvoiceData,
}) => {
  const totalRows = 20;
  const emptyRows = totalRows - data.items.length;

  return (
    <div className="max-w-4xl mx-auto bg-white print:max-w-none print:mx-0 print:bg-white">
      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0.5in;
          }
          
          body {
            font-size: 11px !important;
            line-height: 1.3 !important;
          }
          
          .print\\:text-xs {
            font-size: 10px !important;
          }
          
          .print\\:text-sm {
            font-size: 11px !important;
          }
          
          .print\\:p-2 {
            padding: 8px !important;
          }
          
          .print\\:border {
            border: 1px solid black !important;
          }
          
          .print\\:bg-orange-500 {
            background-color: #f97316 !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .print\\:text-white {
            color: white !important;
          }
          
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div className="flex flex-col ">
        <div className="grid grid-flow-row grid-cols-3 items-center ">
          <div></div>
          <div className="flex justify-center">
            <h1 className="text-2xl font-bold print:text-lg tracking-wide">
              TAX INVOICE
            </h1>
          </div>
          <div className="flex justify-end print:text-sm">
            ORIGINAL FOR RECIPIENT
          </div>
        </div>

        <div className="border-2 border-black print:border">
          {/* Header */}
          <div className="border-b border-black print:border-b">
            <div className="flex justify-between px-2 print:px-2">
              <div className="flex items-center space-x-4">
                <div className="bg-orange-500 text-white px-4 py-2 print:bg-orange-500 print:text-white">
                  <div className="font-bold text-lg print:text-sm">BIG</div>
                  <div className="font-bold text-lg print:text-sm">BAZAAR</div>
                  <div className="text-xs">EVERYTHING STORE</div>
                </div>
              </div>

              <div className="text-center px-4 pb-0 print:p-2">
                <div className="font-bold text-xl print:text-lg">
                  BIG BAZAAR
                </div>
                <div className="text-sm print:text-xs">
                  GSTIN: 27ABCCT2727Q1ZX
                </div>
                <div className="text-sm print:text-xs">
                  64, Whitefield Main Rd , Palm Meadows
                </div>
                <div className="text-sm print:text-xs">KARNATAKA, 560066</div>
                <div className="text-sm print:text-xs">
                  Mobile: +91 9999999999
                </div>
              </div>
            </div>
          </div>

          {/* Customer and Invoice Details */}
          <div className="border-b border-black print:border-b">
            <div className="grid grid-cols-2">
              <div className="border-r border-black p-1 print:py-[1px] print:border-r">
                <div className="font-semibold  print:text-sm">
                  Customer Details:
                </div>
                <div className="text-sm print:text-xs">
                  <div className="font-semibold">{data.customerName}</div>
                  <div>Phone: {data.customerPhone}</div>
                  <div>Email: {data.customerEmail}</div>
                  <div className="mt-1 font-semibold">Billing Address:</div>
                  <div className="whitespace-pre-line">
                    {data.customerAddress}
                  </div>
                </div>
              </div>

              <div className="p-1 print:py-[1px]">
                <div className=" text-sm print:text-xs">
                  <div className="grid grid-cols-2">
                    <span>Invoice #:</span>
                    <span className="font-semibold">{data.invoiceNumber}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span>Invoice Date:</span>
                    <span className="font-semibold">{data.invoiceDate}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span>Due Date:</span>
                    <span className="font-semibold">{data.dueDate}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span>Place of Supply:</span>
                    <span className="font-semibold">{data.placeOfSupply}</span>
                  </div>
                  {data.dispatchFrom && (
                    <>
                      <div className="grid grid-cols-2">
                        <span>Dispatch From:</span>
                      </div>
                      <div className="text-xs print:text-xs mt-1">
                        {data.dispatchFrom}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border-b border-black print:border-b">
            <table className="w-full text-xs print:text-xs">
              <thead>
                <tr className="border-b border-black print:border-b">
                  <th className="border-r border-black p-2 print:py-[1px] print:border-r text-center w-8">
                    #
                  </th>
                  <th className="border-r border-black p-2 print:py-[1px] print:border-r text-left">
                    Item
                  </th>
                  <th className="border-r border-black p-2 print:py-[1px] print:border-r text-center w-20">
                    HSN/SAC
                  </th>
                  <th className="border-r border-black p-2 print:py-[1px] print:border-r text-center w-16">
                    Tax
                  </th>
                  <th className="border-r border-black p-2 print:py-[1px] print:border-r text-center w-16">
                    Qty
                  </th>
                  <th className="border-r border-black p-2 print:py-[1px] print:border-r text-center w-20">
                    Rate/Item
                  </th>
                  <th className="p-2 print:py-[1px] text-center w-20">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id} className=" border-gray-300 leading-tight">
                    <td className="border-r border-black px-1 py-[1px] print:py-[1px] print:border-r text-start font-semibold">
                      {item.id}
                    </td>
                    <td className="border-r border-black px-1 py-[1px] print:py-[1px] print:border-r font-semibold">
                      {item.name}
                    </td>
                    <td className="border-r border-black px-1 py-[1px] print:py-[1px] print:border-r text-end">
                      {item.hsnSac}
                    </td>
                    <td className="border-r border-black px-1 py-[1px] print:py-[1px] print:border-r text-end font-semibold">
                      {item.tax}
                    </td>
                    <td className="border-r border-black px-1 py-[1px] print:py-[1px] print:border-r text-end">
                      {item.qty}
                    </td>
                    <td className="border-r border-black px-1 py-[1px] print:py-[1px] print:border-r text-end font-semibold">
                      {item.ratePerItem.toFixed(2)}
                    </td>
                    <td className="px-1  py-[1px] print:py-[1px] text-right">
                      {item.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}

                {/* Fill empty rows to make 20 */}
                {Array.from({ length: emptyRows > 0 ? emptyRows : 0 }).map(
                  (_, idx) => (
                    <tr key={`empty-${idx}`}>
                      <td className="border-r border-black px-1 print:py-[1px] print:border-r text-right font-semibold">
                        &nbsp;
                      </td>
                      <td className="border-r border-black px-1 print:py-[1px] print:border-r text-right font-semibold">
                        &nbsp;
                      </td>
                      <td className="border-r border-black px-1 print:py-[1px] print:border-r text-right font-semibold">
                        &nbsp;
                      </td>
                      <td className="border-r border-black px-1 print:py-[1px] print:border-r text-right font-semibold">
                        &nbsp;
                      </td>
                      <td className="border-r border-black px-1 print:py-[1px] print:border-r text-right font-semibold">
                        &nbsp;
                      </td>
                      <td className="border-r border-black px-1 print:py-[1px] print:border-r text-right font-semibold">
                        &nbsp;
                      </td>
                      <td className=" border-black px-1 print:py-[1px] text-right font-semibold">
                        &nbsp;
                      </td>
                    </tr>
                  )
                )}

                {/* Charges and Totals */}
                <tr>
                  <td className="border-r border-black px-1 print:py-[1px] print:border-r text-right font-semibold"></td>
                  <td className="border-r border-black px-1 print:py-[1px] print:border-r text-right font-semibold">
                    {data.additionalCharges.map((charge, idx) => (
                      <div key={idx}>{charge.value}</div>
                    ))}
                  </td>
                  <td className="border-r border-black px-1 print:py-[1px] print:border-r text-right font-semibold"></td>
                  <td className="border-r border-black px-1 print:py-[1px] print:border-r text-right font-semibold"></td>
                  <td className="border-r border-black px-1 print:py-[1px] print:border-r text-right font-semibold"></td>
                  <td className="border-r border-black px-1 print:py-[1px] print:border-r text-right font-semibold"></td>
                  <td className="border-l px-1 print:py-[1px] text-right">
                    {data.additionalCharges.map((charge, idx) => (
                      <div key={idx}>{parseFloat(charge.price).toFixed(2)}</div>
                    ))}
                  </td>
                </tr>

                <tr>
                  <td className="border-r border-black px-1 print:py-[1px] print:border-r text-right font-semibold"></td>
                  <td className="border-r border-black px-1 print:py-[1px] print:border-r text-right font-semibold">
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
                    {data.additionalDiscount && <div>Additional Discount</div>}
                    {data.totalDiscount && <div>Total Discount</div>}
                  </td>
                  <td className="border-r border-black px-1 print:py-[1px] print:border-r text-right font-semibold"></td>
                  <td className="border-r border-black px-1 print:py-[1px] print:border-r text-right font-semibold"></td>
                  <td className="border-r border-black px-1 print:py-[1px] print:border-r text-right font-semibold"></td>
                  <td className="border-r border-black px-1 print:py-[1px] print:border-r text-right font-semibold"></td>
                  <td className="px-1 print:py-[1px] text-right">
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
                  </td>
                </tr>

                {/* <tr>
                  <td className="border-r border-black p-2 print:py-[1px] print:border-r text-right font-semibold"></td>
                  <td className="border-r border-black p-2 print:py-[1px] print:border-r text-right font-semibold">
                    Round Off
                  </td>
                  <td className="border-r border-black p-2 print:py-[1px] print:border-r text-right font-semibold"></td>
                  <td className="border-r border-black p-2 print:py-[1px] print:border-r text-right font-semibold"></td>
                  <td className="border-r border-black p-2 print:py-[1px] print:border-r text-right font-semibold"></td>
                  <td className="border-r border-black p-2 print:py-[1px] print:border-r text-right font-semibold"></td>
                  <td className="p-2 print:py-[1px] text-right">
                    {data.roundOff.toFixed(2)}
                  </td>
                </tr> */}

                <tr className="border-t border-black font-bold">
                  <td className="border-r border-black p-2 print:py-[1px] print:border-r text-right font-semibold"></td>
                  <td className="border-r border-black p-1 print:py-[1px] print:border-r text-end">
                    Total
                  </td>
                  <td className="border-r border-black p-2 print:py-[1px] print:border-r text-right font-semibold"></td>
                  <td className="border-r border-black p-2 print:py-[1px] print:border-r text-right font-semibold"></td>
                  <td className="border-r border-black p-2 print:py-[1px] print:border-r text-center">
                    {data.totalQuantity}.000
                  </td>
                  <td className="border-r border-black p-2 print:py-[1px] print:border-r text-right font-semibold"></td>
                  <td className="p-2 print:py-[1px] text-right">
                    ₹{data.totalAmount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount in Words */}
          <div className="border-b border-black px-2 print:px-2 print:border-b">
            <div className="text-sm print:text-xs">
              <span className="font-semibold">
                Amount Chargeable (in words):{" "}
              </span>
              {data.amountInWords}
            </div>
          </div>

          {/* Tax Summary */}
          <div className="border-b border-black print:border-b">
            <table className="w-full text-xs print:text-xs">
              <thead>
                <tr className="border-black">
                  <th className="border-r border-black p-2 print:py-[1px] print:border-r">
                    HSN/SAC
                  </th>
                  <th className="border-r border-black p-2 print:py-[1px] print:border-r">
                    Taxable Value
                  </th>
                  <th
                    className="border-r border-black p-2 print:py-[1px] print:border-r"
                    colSpan={2}
                  >
                    Central Tax
                  </th>
                  <th
                    className="border-r border-black p-2 print:py-[1px] print:border-r"
                    colSpan={2}
                  >
                    State/UT Tax
                  </th>
                  <th className="p-2 print:py-[1px]">Total Tax Amount</th>
                </tr>

                <tr className="border-b border-black print:border-b">
                  <th className="border-r border-black p-1 print:border-r"></th>
                  <th className="border-r border-black p-1 print:border-r"></th>
                  <th className="border-r border-t border-black p-1 print:border-r print:border-t">
                    Rate
                  </th>
                  <th className="border-r border-t border-black p-1 print:border-r print:border-t">
                    Amount
                  </th>
                  <th className="border-r border-t border-black p-1 print:border-r print:border-t">
                    Rate
                  </th>
                  <th className="border-r border-t border-black p-1 print:border-r print:border-t">
                    Amount
                  </th>
                  <th className="p-1"></th>
                </tr>
              </thead>
              <tbody>
                {data.taxBreakdown.map((tax) => (
                  <tr key={tax.hsnSac} className="border-b border-gray-300">
                    <td className="border-r border-black px-2 py-[1px] print:py-[1px] print:border-r text-start">
                      {tax.hsnSac}
                    </td>
                    <td className="border-r border-black px-2 py-[1px] print:py-[1px] print:border-r text-right">
                      {tax.taxableValue.toFixed(2)}
                    </td>
                    <td className="border-r border-black px-2 py-[1px] print:py-[1px] print:border-r text-center">
                      {tax.centralTaxRate}%
                    </td>
                    <td className="border-r border-black px-2 py-[1px] print:py-[1px] print:border-r text-center">
                      {tax.centralTaxAmount.toFixed(2)}
                    </td>
                    <td className="border-r border-black px-2  py-[1px] print:py-[1px] print:border-r text-center">
                      {tax.stateUtTaxRate}%
                    </td>
                    <td className="border-r border-black px-2 py-[1px] print:py-[1px] print:border-r text-center">
                      {tax.stateUtTaxAmount.toFixed(2)}
                    </td>
                    <td className="px-2  py-[1px] print:py-[1px] text-right">
                      {tax.totalTaxAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-black font-bold">
                  <td className="border-r border-black p-2 print:py-[1px] print:border-r text-end">
                    TOTAL
                  </td>
                  <td className="border-r border-black p-2 print:py-[1px] print:border-r text-right">
                    {data.taxableAmount.toFixed(2)}
                  </td>
                  <td className="border-r border-black p-2 print:py-[1px] print:border-r"></td>
                  <td className="border-r border-black p-2 print:py-[1px] print:border-r text-center">
                    {data.totalCentralTax.toFixed(2)}
                  </td>
                  <td className="border-r border-black p-2 print:py-[1px] print:border-r"></td>
                  <td className="border-r border-black p-2 print:py-[1px] print:border-r text-center">
                    {data.totalStateTax.toFixed(2)}
                  </td>
                  <td className="p-2 print:py-[1px] text-right">
                    {data.totalTaxAmount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {data.paymentStatus === "paid" && (
            <div className="flex justify-end border-b border-black print:border-b items-center">
              <div className="mx-1">
                <div className="flex font-bold text-lg print:text-sm text-end justify-end items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-end">Amount Paid</p>
                </div>
                <div className="text-sm font-semibold print:text-xs">
                  <div>
                    ₹{data.totalAmount.toFixed(2)} Paid via {data.paymentMethod}{" "}
                    on {data.paymentDate}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Details */}
          <div className="border-b border-black print:border-b">
            <div className="grid grid-cols-3">
              <div className="border-black px-2 print:px-2">
                <div className="text-sm print:text-xs">
                  <div className="font-semibold mb-1">Bank Details:</div>
                  <div>
                    <span className="font-semibold">Bank:</span> {data.bankName}
                  </div>
                  <div>
                    <span className="font-semibold">Account #:</span>{" "}
                    {data.accountNumber}
                  </div>
                  <div>
                    <span className="font-semibold">IFSC Code:</span>{" "}
                    {data.ifscCode}
                  </div>
                  <div>
                    <span className="font-semibold">Branch:</span> {data.branch}
                  </div>
                </div>
                <div className="mt-2 text-sm print:text-xs">
                  <div className="font-semibold">Notes:</div>
                  <div>
                    Thank you for shopping with us! We appreciate your business.
                  </div>
                </div>
              </div>

              <div className="border-r border-black p-2 print:p-2 print:border-r text-center">
                <div className="text-sm print:text-xs mb-2">Pay using UPI:</div>
                <div className="bg-gray-200 w-32 h-32 mx-auto flex items-center justify-center">
                  <div className="text-xs">QR CODE</div>
                </div>
              </div>

              <div className="p-1 print:p-1">
                <div className="text-right">
                  <div className="">For BIG BAZAAR</div>
                  <div className="flex flex-col mt-2 items-end justify-end">
                    <div className="w-20 h-20 rounded-full border-2 border-blue-600 flex items-center justify-center">
                      <div className="text-xs text-blue-600 text-right">
                        <div>SIGNATURE</div>
                      </div>
                    </div>
                    <div className="text-xs text-right mt-2">
                      Authorized Signatory
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="p-4 print:p-2 text-xs print:text-xs">
            <div className="font-semibold mb-2">Terms and Conditions:</div>
            <div>
              1. All disputes must be reported within 15 days of invoice
              receipt.
            </div>
            <div>
              2. Accepted payment methods include bank transfer, credit card,
              and PayPal.
            </div>
            <div>3. In case of exchange, we only accept original receipt.</div>
          </div>

          {/* Footer */}
          <div className="border-t border-black p-2 print:py-[1px] print:border-t text-xs print:text-xs text-center">
            Page 1/1 • This is a digitally signed document.
          </div>
        </div>
      </div>

      {/* Print Button */}
      <div className="no-print text-center mt-6">
        <button
          onClick={() => window.print()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold"
        >
          Print Invoice
        </button>
      </div>
    </div>
  );
};

export default Temp1;
