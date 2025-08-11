import { DatePicker } from "./DatePickerComponent/DatePicker";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./DatePickerComponent/Drawer";
import {
  RadioCardGroup,
  RadioCardItem,
  RadioCardIndicator,
} from "./DatePickerComponent/RadioCardGroup";
import { Textarea } from "./DatePickerComponent/TextArea";
import Card from "./ui/Card";
import { Button } from "./DatePickerComponent/components/Button";
import { BankDetails, Customer } from "../lib/backend-service";
import { useEffect, useState } from "react";
import { Label } from "./DatePickerComponent/Label";
import { Input } from "./DatePickerComponent/Input";
import { Switch } from "./DatePickerComponent/Switch";
import SearchableDropdown from "./ui/SearchableDropdown";
import { useInvoiceStore } from "../store/invoice";
import { Banknote } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import { isSameDay } from "date-fns";
import UIButton from "./ui/Button";

type PaymentTransactionProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transactionType: "payIn" | "payOut";
  customer: Customer;
};

function formatBanksList(banks: BankDetails[]): string {
  const parsedBanks = JSON.parse(banks.banks);
  const mappedBanks = parsedBanks.map((bank, index) => {
    const { bank_name, bank_accountNumber, ...others } = bank;
    return { value: `${bank_name}`, id: bank_accountNumber, others };
  });
  return [...mappedBanks, { value: "Cash", id: "cash" }];
}

const PaymentTransaction: React.FC<PaymentTransactionProps> = ({
  isOpen,
  onOpenChange,
  transactionType,
  customer,
}) => {
  const { settings, fetchAllSettings, createTransaction } = useInvoiceStore();

  const navigate = useNavigate();

  const paymentTypes = ["Card", "Cash", "Cheque", "EMI", "Net Banking", "UPI"];

  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const defaultbankAccount = settings?.banks
    ? (() => {
        const defaultBank = JSON.parse(settings.banks.banks).find(
          (bank) => bank.isDefault
        );
        if (!defaultBank) return null;

        const { bank_name, bank_accountNumber, ...others } = defaultBank;
        return {
          value: bank_name,
          id: bank_accountNumber,
          others,
        };
      })()
    : null;
  const [bankAccount, setBankAccount] = useState(defaultbankAccount);
  const [paymentType, setPaymentType] = useState(paymentTypes[0]);
  const [notes, setNotes] = useState("");

  const [isInputError, setIsInputError] = useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        const fetchedSettings = await fetchAllSettings();
      } catch (error) {
        console.error("Error initializing sales data:", error);
      }
    };
    if (!settings) initData();
  }, []);

  function onAddBankAccount() {
    navigate("/app/settings?subtab=financial&tab=banks");
  }

  const handleAddPayment = async () => {
    if (!amount) {
      setIsInputError(true);
      return;
    }

    setIsInputError(false);

    try {
      setLoading(true);
      const success = await createTransaction(
        customer,
        parseFloat(amount),
        transactionType,
        paymentDate,
        paymentType,
        bankAccount,
        notes
      );
      setLoading(false);
      if (success) {
        // Optionally, reset the form or redirect
        onOpenChange(false);
      } else {
      }
    } catch (error) {
      console.error("Error adding payment:", error);
      setLoading(false);
    }
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !loading) {
          if (
            amount.trim() !== "" ||
            !isSameDay(paymentDate, new Date()) ||
            bankAccount?.id !== defaultbankAccount?.id ||
            paymentType !== paymentTypes[0] ||
            notes.trim() !== ""
          ) {
            setConfirmationDialogOpen(true);
            return;
          }
          setConfirmationDialogOpen(false);
          setAmount("");
          setPaymentDate(new Date());
          setBankAccount(defaultbankAccount);
          setPaymentType(paymentTypes[0]);
          setNotes("");
          setIsInputError(false);
        }
        if (!loading) onOpenChange(open);
      }}
    >
      <DrawerContent className="sm:max-w-2xl overflow-hidden flex flex-col h-full">
        <DrawerHeader className="flex-shrink-0 px-6 py-2" disabled={loading}>
          <DrawerTitle>
            {transactionType === "payIn" ? "Pay In" : "Pay Out"}
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
          ) : confirmationDialogOpen ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-xl font-medium">Do you want to exit?</p>
              <p>You will lose your unsaved data.</p>
              <div className="flex gap-4 mt-4">
                <UIButton
                  variant="secondary"
                  onClick={() => setConfirmationDialogOpen(false)}
                >
                  Cancel
                </UIButton>
                <UIButton
                  variant="danger"
                  onClick={() => {
                    setConfirmationDialogOpen(false);
                    setConfirmationDialogOpen(false);
                    setAmount("");
                    setPaymentDate(new Date());
                    setBankAccount(defaultbankAccount);
                    setPaymentType(paymentTypes[0]);
                    setNotes("");
                    setIsInputError(false);
                    onOpenChange(false);
                  }}
                >
                  Exit
                </UIButton>
              </div>
            </div>
          ) : (
            <Card
              className="flex-grow justify-between space-y-4 mx-6"
              padding="sm"
            >
              {/* Amount */}
              <div>
                <Label htmlFor="amount" className="text-base">
                  Enter Amount
                </Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl">
                    ₹
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-7"
                    hasError={isInputError}
                    aria-errormessage="Required"
                  />
                </div>
              </div>

              {/* Payment Date */}
              <div>
                <Label htmlFor="payment-date" className="text-base">
                  Payment Date
                </Label>
                <DatePicker
                  id="payment-date"
                  value={paymentDate}
                  onChange={setPaymentDate}
                  placeholder="Select date"
                  className="mt-1"
                />
              </div>

              {/* Bank */}
              <div>
                <Label htmlFor="bank" className="text-base">
                  Bank
                </Label>
                <SearchableDropdown
                  options={formatBanksList(settings?.banks)}
                  value={bankAccount}
                  onChange={(entity) => {
                    if (entity.id === "cash" && paymentType !== "Cash")
                      setPaymentType("Cash");
                    setBankAccount(entity);
                  }}
                  disabled={paymentType === "Cash"}
                  placeholder="Select bank account"
                  displayKey="name"
                  onAddNew={onAddBankAccount}
                  addNewLabel="Add New Bank"
                  icon={Banknote}
                />
              </div>

              {/* Payment Type */}
              <div>
                <fieldset className="space-y-3">
                  <legend className="text-base font-medium text-gray-900 dark:text-gray-50">
                    Payment Type
                  </legend>
                  <RadioCardGroup
                    defaultValue={paymentType}
                    className="grid-cols-2 text-sm"
                    value={paymentType}
                    onValueChange={(value) => {
                      if (value === "Cash")
                        setBankAccount({ value: "Cash", id: "cash" });
                      if (bankAccount?.id === "cash" && value !== "Cash")
                        setBankAccount(
                          settings?.banks
                            ? (() => {
                                const defaultBank = JSON.parse(
                                  settings.banks.banks
                                ).find((bank) => bank.isDefault);
                                if (!defaultBank) return null;

                                const {
                                  bank_name,
                                  bank_accountNumber,
                                  ...others
                                } = defaultBank;
                                return {
                                  value: bank_name,
                                  id: bank_accountNumber,
                                  others,
                                };
                              })()
                            : null
                        );
                      setPaymentType(value);
                    }}
                  >
                    {paymentTypes.map((type) => (
                      <RadioCardItem
                        key={type}
                        value={type}
                        className="flex items-center gap-3"
                      >
                        <RadioCardIndicator />
                        <span>{type}</span>
                      </RadioCardItem>
                    ))}
                  </RadioCardGroup>
                </fieldset>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-base">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes..."
                  className="mt-1 !text-base"
                  rows={3}
                />
              </div>

              <div className="flex flex-col">
                <Label htmlFor="sms-notification" className="text-base">
                  SMS to Customer
                </Label>
                <Switch
                  id="sms-notification"
                  className="mt-2"
                  onCheckedChange={() => {}}
                  disabled
                />
                <p className="text-sm text-gray-500 mt-2">
                  Send SMS notification to customer about this payment.
                </p>
              </div>

              <div className="flex flex-col">
                <Label htmlFor="email-notification" className="text-base">
                  Email to Customer
                </Label>
                <Switch
                  id="email-notification"
                  className="mt-2"
                  onCheckedChange={() => {}}
                  disabled
                />
                <p className="text-sm text-gray-500 mt-2">
                  Send email notification to customer about this payment.
                </p>
              </div>
            </Card>
          )}
        </DrawerBody>
        <DrawerFooter className="flex-shrink-0 px-6 py-4">
          <DrawerClose asChild disabled={loading}>
            {!confirmationDialogOpen && (
              <Button
                className="mt-2 w-full sm:mt-0 sm:w-fit"
                variant="secondary"
              >
                Cancel
              </Button>
            )}
          </DrawerClose>
          {!confirmationDialogOpen && (
            <Button
              className="w-full sm:w-fit"
              onClick={handleAddPayment}
              isLoading={loading}
            >
              Add Payment
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default PaymentTransaction;
