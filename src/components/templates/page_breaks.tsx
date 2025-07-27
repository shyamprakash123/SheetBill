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
  const [pages, setPages] = useState<JSX.Element[]>([]);
  const [isMultiPage, setIsMultiPage] = useState(false);

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

  // Calculate if content needs multiple pages
  useEffect(() => {
    if (data && invoiceRef.current) {
      const contentHeight = calculateContentHeight();
      const maxPageHeight = 1123 - 80; // Account for padding

      if (contentHeight > maxPageHeight) {
        setIsMultiPage(true);
        generatePages();
      } else {
        setIsMultiPage(false);
      }
    }
  }, [data, base64Logo, base64Signature]);

  const calculateContentHeight = () => {
    // Estimate heights of different sections
    const headerHeight = 60;
    const companyHeaderHeight = 120;
    const customerDetailsHeight = 100;
    const itemsHeaderHeight = 40;
    const itemRowHeight = 25;
    const taxSummaryHeight = 80;
    const footerHeight = 200;

    const itemsHeight = data.items.length * itemRowHeight;
    const additionalChargesHeight = data.additionalCharges.length * 20;

    return (
      headerHeight +
      companyHeaderHeight +
      customerDetailsHeight +
      itemsHeaderHeight +
      itemsHeight +
      additionalChargesHeight +
      taxSummaryHeight +
      footerHeight
    );
  };

  const generatePages = () => {
    const maxItemsPerPage = 15; // Adjust based on your needs
    const itemsPerFirstPage = 12; // Less items on first page due to header
    const itemsPerSubsequentPage = maxItemsPerPage;

    const totalItems = data.items.length;
    const pagesNeeded =
      Math.ceil((totalItems - itemsPerFirstPage) / itemsPerSubsequentPage) + 1;

    const generatedPages: JSX.Element[] = [];

    for (let pageIndex = 0; pageIndex < pagesNeeded; pageIndex++) {
      const isFirstPage = pageIndex === 0;
      const isLastPage = pageIndex === pagesNeeded - 1;

      let startIndex, endIndex;
      if (isFirstPage) {
        startIndex = 0;
        endIndex = Math.min(itemsPerFirstPage, totalItems);
      } else {
        startIndex =
          itemsPerFirstPage + (pageIndex - 1) * itemsPerSubsequentPage;
        endIndex = Math.min(startIndex + itemsPerSubsequentPage, totalItems);
      }

      const pageItems = data.items.slice(startIndex, endIndex);

      generatedPages.push(
        <div
          key={pageIndex}
          style={{
            width: "794px",
            height: "1123px",
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
            pageBreakAfter: isLastPage ? "auto" : "always",
          }}
        >
          {renderPageHeader(pageIndex + 1, pagesNeeded)}
          {isFirstPage && renderCompanyHeader()}
          {isFirstPage && renderCustomerDetails()}
          {renderItemsTable(pageItems, isFirstPage, isLastPage)}
          {isLastPage && renderTaxSummary()}
          {isLastPage && renderFooter()}
        </div>
      );
    }

    setPages(generatedPages);
  };

  const renderPageHeader = (currentPage: number, totalPages: number) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        alignItems: "center",
        marginBottom: "10px",
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
        {currentPage === 1
          ? "ORIGINAL FOR RECIPIENT"
          : `Page ${currentPage}/${totalPages}`}
      </div>
    </div>
  );

  const renderCompanyHeader = () => (
    <div
      style={{
        border: "2px solid #000000",
        borderBottom: "1px solid #000000",
        padding: "2px",
        display: "grid",
        gridTemplateColumns: "1fr 2fr 1fr",
        alignItems: "center",
        marginBottom: "0px",
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
              <span style={{ fontWeight: "normal" }}>{data.companyEmail}</span>
            </p>
          )}
          {data.companyPhone && (
            <p style={{ fontWeight: "bold" }}>
              Mobile:{" "}
              <span style={{ fontWeight: "normal" }}>{data.companyPhone}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderCustomerDetails = () => (
    <div
      style={{
        border: "2px solid #000000",
        borderTop: "none",
        borderBottom: "1px solid #000000",
        display: "flex",
        marginBottom: "0px",
      }}
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
          <div style={{ whiteSpace: "pre-line" }}>{data.customerAddress}</div>
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
            <span style={{ fontWeight: "bold" }}>{data.invoiceNumber}</span>
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
            <span style={{ fontWeight: "bold" }}>{data.placeOfSupply}</span>
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
  );

  const renderItemsTable = (
    items: InvoiceItem[],
    isFirstPage: boolean,
    isLastPage: boolean
  ) => (
    <div
      style={{
        border: isFirstPage ? "2px solid #000000" : "2px solid #000000",
        borderTop: isFirstPage ? "none" : "2px solid #000000",
        borderBottom: isLastPage ? "1px solid #000000" : "none",
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "13px",
          lineHeight: "1.3",
          flex: 1,
        }}
      >
        <thead>
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
          {items.map((item) => (
            <tr key={item.id} style={{ height: "2px" }}>
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

          {isLastPage && (
            <>
              <tr style={{ paddingBottom: "2px" }}>
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
                    {data.additionalDiscount && <div>Additional Discount</div>}
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
              <tr
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
            </>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderTaxSummary = () => (
    <>
      <div
        style={{
          border: "2px solid #000000",
          borderTop: "none",
          borderBottom: "1px solid #000000",
          padding: "4px",
        }}
      >
        <div style={{ fontSize: "13px" }}>
          <span style={{ fontWeight: "bold" }}>
            Amount Chargeable (in words):{" "}
          </span>
          {data.amountInWords}
        </div>
      </div>
      <div
        style={{
          border: "2px solid #000000",
          borderTop: "none",
          borderBottom: "1px solid #000000",
        }}
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
    </>
  );

  const renderFooter = () => (
    <>
      {data.paymentStatus === "paid" && (
        <div
          style={{
            border: "2px solid #000000",
            borderTop: "none",
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
                  color: "green",
                  borderRadius: "20px",
                  marginRight: "4px",
                }}
              />
              Amount Paid
            </div>
            <div style={{ fontSize: "13px", fontWeight: "bold" }}>
              ₹{data.totalAmount.toFixed(2)} Paid via {data.paymentMethod} on{" "}
              {data.paymentDate}
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          border: "2px solid #000000",
          borderTop: "none",
          borderBottom: "1px solid #000000",
        }}
      >
        <div style={{ display: "flex" }}>
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
                  <div style={{ fontSize: "10px" }}>{data.paymentNotes}</div>
                </>
              )}
            </div>
          </div>
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
          <div style={{ width: "40%", padding: "8px", paddingBottom: "1px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ marginBottom: "8px" }}>For {data.companyName}</div>
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
                </div>
                <div style={{ fontSize: "10px", textAlign: "right" }}>
                  Authorized Signatory
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          border: "2px solid #000000",
          borderTop: "none",
          padding: "8px",
          fontSize: "10px",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "1px" }}>
          Terms and Conditions:
        </div>
        <div style={{ marginBottom: "1px" }}>{data.notes}</div>
      </div>
    </>
  );
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

  const downloadAsPDF = async () => {
    if (!invoiceRef.current) return;

    const targetElement = isMultiPage
      ? (document.querySelector(".multi-page-container") as HTMLElement)
      : invoiceRef.current;

    if (!targetElement) return;

    try {
      // Create canvas with high DPI settings
      const canvas = await html2canvas(targetElement, {
        scale: 4, // Higher scale for better quality
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        width: targetElement.scrollWidth,
        height: targetElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: targetElement.scrollWidth,
        windowHeight: targetElement.scrollHeight,
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

  const downloadAsImage = async () => {
    if (!invoiceRef.current) return;

    const targetElement = isMultiPage
      ? (document.querySelector(".multi-page-container") as HTMLElement)
      : invoiceRef.current;

    if (!targetElement) return;

    try {
      const canvas = await html2canvas(targetElement, {
        scale: 4, // Even higher scale for image
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        width: targetElement.scrollWidth,
        height: targetElement.scrollHeight,
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
      {/* Render single page or multi-page layout */}
      {isMultiPage ? (
        <div className="multi-page-container">{pages}</div>
      ) : (
        <div
          ref={invoiceRef}
          className="invoice-container"
          style={{
            width: "794px",
            maxHeight: "1123px",
            height: "1123px",
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
            justifyContent: "space-between",
          }}
        >
          {renderPageHeader(1, 1)}
          <div
            style={{
              border: "2px solid #000000",
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            {renderCompanyHeader()}
            {renderCustomerDetails()}
            {renderItemsTable(data.items, true, true)}
          </div>
          {renderTaxSummary()}
          {renderFooter()}
        </div>
      )}
    </div>
  );
});

export default InvoiceCanvas;
