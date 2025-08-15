import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "./DatePickerComponent/Drawer";
import Card from "./ui/Card";
import { Button } from "./DatePickerComponent/components/Button";
import { Customer, CustomerLedger } from "../lib/backend-service";
import { useState } from "react";
import { Banknote } from "lucide-react";
import CircularProgress from "@mui/material/CircularProgress";
import { format } from "date-fns";
import { Badge } from "./DatePickerComponent/Badge";

type TransactionDetailsProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transactionType: any;
  customer: Customer;
  customerLedger: CustomerLedger;
};

const statusToVariant = {
  pending: "warning", // yellow
  "partially paid": "default", // choose neutral or create custom if needed
  paid: "success", // green
  failed: "error", // red (if needed)
};

const getStatusColor = (balance) => {
  if (balance > 0) {
    return "text-green-500 dark:text-green-400";
  } else if (balance < 0) {
    return "text-red-600 dark:text-red-400";
  } else {
    return "text-gray-800 dark:text-gray-400";
  }
};

const formatCurrency = (amount) => {
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  });

  // Get an array of the formatted parts (e.g., [{type: 'currency', value: '₹'}, {type: 'integer', value: '50,000'}])
  const parts = formatter.formatToParts(amount || 0);

  // Find the currency symbol and add a space, then join the parts back together
  return parts
    .map((part) => {
      if (part.type === "currency") {
        return `${part.value} `; // Add the space here
      }
      return part.value;
    })
    .join("");
};

const TransactionDetailsDrawer: React.FC<TransactionDetailsProps> = ({
  isOpen,
  onOpenChange,
  transactionType,
  customer,
  customerLedger,
}) => {
  const [loading, setLoading] = useState(false);

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
      }}
    >
      <DrawerContent className="sm:max-w-3xl overflow-hidden flex flex-col h-full">
        <DrawerHeader className="flex-shrink-0 px-6 py-2" disabled={loading}>
          <DrawerTitle>
            {transactionType?.toUpperCase()}
            {customerLedger?.document_id && ` - ${customerLedger?.document_id}`}
          </DrawerTitle>
          <DrawerDescription className="mt-1 text-base">
            {customer?.companyDetails.companyName || customer?.name}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="flex-grow overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <CircularProgress size={40} color="primary" />
              <p className="ml-2 text-gray-500">Processing...</p>
            </div>
          ) : (
            <div>
              <div>
                <div className="flex items-center justify-between mb-4 mx-6 bg-orange-50 dark:bg-teal-900/10 rounded-md p-2">
                  <div className="flex items-center space-x-2">
                    <Banknote className="w-6 h-6 text-gray-500" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Balance
                    </h2>
                  </div>
                  <p
                    className={`flex px-2 py-1  text-lg font-semibold tracking-wide text-right ${getStatusColor(
                      customer?.balance
                    )}`}
                  >
                    {formatCurrency(Math.abs(customer?.balance))}
                  </p>
                </div>
              </div>
              <Card
                className="flex-grow justify-between space-y-4 mx-6"
                padding="sm"
              >
                {/* Transaction Details - 2 Column Grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {/* Amount */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Amount
                    </label>
                    <p
                      className={`text-lg font-semibold ${
                        customerLedger?.amount < 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {formatCurrency(Math.abs(customerLedger?.amount))}
                    </p>
                  </div>

                  {/* Date */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Date
                    </label>
                    {customerLedger?.date && (
                      <p className="text-lg font-semibold text-gray-900">
                        <div className="text-sm text-gray-900">
                          {format(new Date(customerLedger?.date), "dd-MM-yyyy")}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(
                            new Date(customerLedger?.date),
                            "d MMM yy, h:mm aaa"
                          )
                            .replace("am", "AM")
                            .replace("pm", "PM")}
                        </div>
                      </p>
                    )}
                  </div>

                  {/* Bank */}
                  <div className="space-y-1">
                    {customerLedger?.bank_account?.id !== "cash" ? (
                      <>
                        <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          Bank
                        </label>
                        <p className="text-lg font-semibold text-gray-900">
                          <div>
                            <p>{customerLedger?.bank_account?.value}</p>
                            <p className="text-sm text-gray-500">
                              ACC No: {customerLedger?.bank_account?.id}
                            </p>
                            <p className="text-sm text-gray-500">
                              IFSC:{" "}
                              {customerLedger?.bank_account?.others
                                ?.bank_ifscCode || "Not Available"}
                            </p>
                          </div>
                        </p>
                      </>
                    ) : customerLedger?.bank_account?.id === "cash" ? (
                      <>
                        <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          Cash
                        </label>
                        <p className="text-lg ">
                          <div className="flex items-center space-x-1 text-green-800">
                            <Banknote className="w-6 h-6 " />
                            <p className="font-semibold ">Cash</p>
                          </div>
                        </p>
                      </>
                    ) : (
                      <>
                        <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          Transaction
                        </label>
                        <p className="text-lg text-gray-900">Not Available</p>
                      </>
                    )}
                  </div>

                  {/* Mode */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Mode
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {customerLedger?.paymentMode ? (
                        <span className="inline-flex px-2 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded">
                          {customerLedger.paymentMode}
                        </span>
                      ) : (
                        "Not Available"
                      )}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200"></div>

                {/* Status and Notes Section */}
                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    {customerLedger?.status && (
                      <Badge
                        className="text-base w-full text-center flex justify-center"
                        variant={
                          statusToVariant[customerLedger?.status] || "neutral"
                        }
                      >
                        {customerLedger?.status?.toUpperCase()}
                      </Badge>
                    )}
                  </div>

                  {/* Notes */}
                  {customerLedger?.notes && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Notes
                      </label>
                      <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {customerLedger?.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </DrawerBody>
        <DrawerFooter className="flex-shrink-0 px-6 py-4">
          <DrawerClose asChild>
            <Button
              className="mt-2 w-full sm:mt-0 sm:w-fit"
              variant="secondary"
            >
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default TransactionDetailsDrawer;
