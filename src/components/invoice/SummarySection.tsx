import React, { useState } from "react";
import { CalculatorIcon } from "@heroicons/react/24/outline";
import SearchableDropdown from "../ui/SearchableDropdown";
import Switch from "../ui/Switch";

interface SummarySectionProps {
  totals: {
    subtotal: number;
    totalDiscount: number;
    taxAmount: number;
    additionalChargesTotal: number;
    total: number;
    roundOffAmount: number;
  };
  tds: {
    enabled: boolean;
    rate: number;
    amount: number;
    code?: string;
    description?: string;
  };
  tdsUnderGst: { enabled: boolean; rate: number; amount: number };
  tcs: {
    enabled: boolean;
    rate: number;
    amount: number;
    code?: string;
    description?: string;
  };
  extraDiscount: number;
  onTdsChange: (tds: {
    enabled: boolean;
    rate: number;
    amount: number;
    code?: string;
    description?: string;
  }) => void;
  onTdsUnderGstChange: (tdsUnderGst: {
    enabled: boolean;
    rate: number;
    amount: number;
  }) => void;
  onTcsChange: (tcs: {
    enabled: boolean;
    rate: number;
    amount: number;
    code?: string;
    description?: string;
  }) => void;
  onExtraDiscountChange: (discount: number) => void;
}

const TDS_OPTIONS = [
  { id: "192A", value: "0% 192A", description: "Salary", rate: 0 },
  {
    id: "193",
    value: "10% 193",
    description: "Interest on Securities",
    rate: 10,
  },
  { id: "194", value: "10% 194", description: "Dividend", rate: 10 },
  {
    id: "194A-interest",
    value: "10% 194A",
    description: "Interest (Banks)",
    rate: 10,
  },
  {
    id: "194A-senior",
    value: "0% 194A",
    description: "Senior Citizens",
    rate: 0,
  },
  {
    id: "194C",
    value: "1% 194C",
    description: "Contractor/Sub-contractor",
    rate: 1,
  },
  {
    id: "194D",
    value: "5% 194D",
    description: "Insurance Commission",
    rate: 5,
  },
  {
    id: "194DA",
    value: "1% 194DA",
    description: "Life Insurance Policy",
    rate: 1,
  },
  { id: "194EE", value: "10% 194EE", description: "NSS/NSC/SCSS", rate: 10 },
  { id: "194F", value: "20% 194F", description: "Mutual Fund Units", rate: 20 },
  {
    id: "194G",
    value: "5% 194G",
    description: "Commission/Brokerage",
    rate: 5,
  },
  {
    id: "194H",
    value: "5% 194H",
    description: "Commission to Agents",
    rate: 5,
  },
  {
    id: "194I-a",
    value: "10% 194I(a)",
    description: "Rent - Land/Building",
    rate: 10,
  },
  {
    id: "194I-b",
    value: "2% 194I(b)",
    description: "Rent - Plant/Machinery",
    rate: 2,
  },
  {
    id: "194IA",
    value: "1% 194IA",
    description: "Property Transfer",
    rate: 1,
  },
  {
    id: "194IB",
    value: "5% 194IB",
    description: "Rent by Individual/HUF",
    rate: 5,
  },
  {
    id: "194IC",
    value: "10% 194IC",
    description: "Joint Development Agreement",
    rate: 10,
  },
  {
    id: "194J-a",
    value: "10% 194J(a)",
    description: "Professional/Technical Services",
    rate: 10,
  },
  {
    id: "194J-b",
    value: "10% 194J(b)",
    description: "Royalty/Copyright",
    rate: 10,
  },
  { id: "194K", value: "10% 194K", description: "Income from Units", rate: 10 },
  {
    id: "194LA",
    value: "10% 194LA",
    description: "Compensation - Land Acquisition",
    rate: 10,
  },
  {
    id: "194LB",
    value: "10% 194LB",
    description: "Interest by Co-operative Society",
    rate: 10,
  },
  {
    id: "194LBA",
    value: "5% 194LBA",
    description: "Business Correspondent",
    rate: 5,
  },
  {
    id: "194LD",
    value: "5% 194LD",
    description: "5% Interest on Infrastructure Debt Fund",
    rate: 5,
  },
  {
    id: "194M",
    value: "5% 194M",
    description: "5% Contract/Professional Services",
    rate: 5,
  },
  {
    id: "194O",
    value: "1% 194O",
    description: "E-commerce Operator",
    rate: 1,
  },
  {
    id: "194Q",
    value: "0.1% 194Q",
    description: "Purchase of Goods",
    rate: 0.1,
  },
  {
    id: "194R",
    value: "10% 194R",
    description: "Benefits/Perquisites",
    rate: 10,
  },
  {
    id: "194S",
    value: "1% 194S",
    description: "1% Cryptocurrency Transfer",
    rate: 1,
  },
  {
    id: "195",
    value: "20% 195",
    description: "Non-resident Payments",
    rate: 20,
  },
  {
    id: "194B",
    value: "30% 194B",
    description: "Lottery/Crossword/Races",
    rate: 30,
  },
];

const TCS_OPTIONS = [
  {
    id: "206C-IH",
    value: "0.1% 206C(IH)",
    description: "Sale of Goods",
    rate: 0.1,
  },
  {
    id: "206C",
    value: "0.1% 206C",
    description: "Sale of Goods (General)",
    rate: 0.1,
  },
  {
    id: "206C-1G-a",
    value: "1% 206C(1G)(a)",
    description: "Sale of Motor Vehicle",
    rate: 1,
  },
  {
    id: "206C-1G-b",
    value: "0.5% 206C(1G)(b)",
    description: "Sale of Goods (Overseas)",
    rate: 0.5,
  },
];

export default function SummarySection({
  totals,
  tds,
  tdsUnderGst,
  tcs,
  extraDiscount,
  roundOff,
  onTdsChange,
  onTdsUnderGstChange,
  onTcsChange,
  onExtraDiscountChange,
}: SummarySectionProps) {
  const [tdsApplyOn, setTdsApplyOn] = React.useState<"total" | "net">("net");
  const [tcsApplyOn, setTcsApplyOn] = React.useState<"total" | "net">("net");
  const [roundOffOption, setRoundOffOption] = useState<boolean>(roundOff);

  const calculateTdsAmount = (rate: number) => {
    const baseAmount = tdsApplyOn === "total" ? totals.total : totals.subtotal;
    return (baseAmount * rate) / 100;
  };

  const calculateTcsAmount = (rate: number) => {
    const baseAmount = tcsApplyOn === "total" ? totals.total : totals.subtotal;
    return (baseAmount * rate) / 100;
  };

  const handleTdsSelect = (option: any) => {
    const amount = calculateTdsAmount(option.rate);
    onTdsChange({
      enabled: true,
      rate: option.rate,
      amount,
      code: option.value,
      description: option.description,
    });
    // Disable TCS when TDS is enabled
    if (tcs.enabled) {
      onTcsChange({ enabled: false, rate: 0, amount: 0 });
    }
  };

  const handleTcsSelect = (option: any) => {
    const amount = calculateTcsAmount(option.rate);
    onTcsChange({
      enabled: true,
      rate: option.rate,
      amount,
      code: option.value,
      description: option.description,
    });
    // Disable TDS when TCS is enabled
    if (tds.enabled) {
      onTdsChange({ enabled: false, rate: 0, amount: 0 });
    }
  };

  const handleTdsUnderGstToggle = (enabled: boolean) => {
    onTdsUnderGstChange({
      enabled,
      rate: enabled ? 2 : 0,
      amount: enabled ? calculateTdsAmount(2) : 0,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-6">
        <CalculatorIcon className="h-5 w-5 mr-2" />
        Summary & Calculations
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tax Options */}
        <div className="space-y-6">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Tax Deductions & Collections
          </h3>

          {/* TDS Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              TDS (Tax Deducted at Source)
            </label>
            <SearchableDropdown
              options={TDS_OPTIONS}
              value={
                tds.enabled
                  ? { value: `${tds.code} - ${tds.description}`, id: tds.code }
                  : null
              }
              onChange={handleTdsSelect}
              placeholder="Select TDS Section"
              displayKey="value"
              onRemoveOption={() =>
                onTdsChange({ enabled: false, rate: 0, amount: 0 })
              }
            />
            {tds.enabled && (
              <div className="space-y-2">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Apply on:
                  </span>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tds-apply"
                      checked={tdsApplyOn === "net"}
                      onChange={() => {
                        setTdsApplyOn("net");
                        const amount = calculateTdsAmount(tds.rate);
                        onTdsChange({ ...tds, amount });
                      }}
                      className="mr-1"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Net Amount
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tds-apply"
                      checked={tdsApplyOn === "total"}
                      onChange={() => {
                        setTdsApplyOn("total");
                        const amount = calculateTdsAmount(tds.rate);
                        onTdsChange({ ...tds, amount });
                      }}
                      className="mr-1"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Total Amount
                    </span>
                  </label>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Rate: {tds.rate}%
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">|</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    Amount: ₹{tds.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* TDS under GST */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="tds-gst"
                checked={tdsUnderGst.enabled}
                onChange={(e) => handleTdsUnderGstToggle(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="tds-gst"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                TDS under GST (Fixed 2%)
              </label>
            </div>
            {tdsUnderGst.enabled && (
              <div className="ml-7 text-sm text-gray-600 dark:text-gray-400">
                Amount: ₹{tdsUnderGst.amount.toFixed(2)}
              </div>
            )}
          </div>

          {/* TCS Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              TCS (Tax Collected at Source)
            </label>
            <SearchableDropdown
              options={TCS_OPTIONS}
              value={
                tcs.enabled
                  ? { value: `${tcs.code} - ${tcs.description}`, id: tcs.code }
                  : null
              }
              onChange={handleTcsSelect}
              placeholder="Select TCS Section"
              displayKey="value"
              onRemoveOption={() =>
                onTcsChange({ enabled: false, rate: 0, amount: 0 })
              }
            />
            {tcs.enabled && (
              <div className="space-y-2">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Apply on:
                  </span>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tcs-apply"
                      checked={tcsApplyOn === "net"}
                      onChange={() => {
                        setTcsApplyOn("net");
                        const amount = calculateTcsAmount(tcs.rate);
                        onTcsChange({ ...tcs, amount });
                      }}
                      className="mr-1"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Net Amount
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tcs-apply"
                      checked={tcsApplyOn === "total"}
                      onChange={() => {
                        setTcsApplyOn("total");
                        const amount = calculateTcsAmount(tcs.rate);
                        onTcsChange({ ...tcs, amount });
                      }}
                      className="mr-1"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Total Amount
                    </span>
                  </label>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Rate: {tcs.rate}%
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">|</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    Amount: ₹{tcs.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Extra Discount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Additional Discount
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="1"
                min={0}
                value={extraDiscount || ""}
                onChange={(e) =>
                  onExtraDiscountChange(parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
                className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500">₹</span>
            </div>
          </div>
        </div>

        {/* Professional Invoice Summary */}
        <div className="h-min bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Invoice Summary
            </h3>
            <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
          </div>

          <div className="space-y-1">
            {/* Main Amounts */}
            <div className="space-y-0">
              <div className="flex justify-between items-center py-1">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Subtotal
                </span>
                <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  ₹{totals.subtotal.toFixed(2)}
                </span>
              </div>

              {totals.totalDiscount > 0 && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Discount
                  </span>
                  <span className="text-base font-semibold text-red-600 dark:text-red-400">
                    -₹{totals.totalDiscount.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center py-1">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tax Amount
                </span>
                <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  ₹{totals.taxAmount.toFixed(2)}
                </span>
              </div>

              {totals.additionalChargesTotal > 0 && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Additional Charges
                  </span>
                  <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    ₹{totals.additionalChargesTotal.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Round Off */}
              <div className="flex justify-between items-center py-1">
                <div className="flex items-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                    Round Off
                  </p>
                  <Switch
                    checked={roundOffOption}
                    onChange={(e) => setRoundOffOption(e)}
                    size="lg"
                    color="blue"
                  />
                </div>

                {roundOffOption ? (
                  <span className="text-sm font-medium text-teal-900 dark:text-teal-400">
                    {totals.roundOffAmount >= 0 ? "+" : ""}₹
                    {totals.roundOffAmount.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-sm font-medium  text-teal-900 dark:text-teal-400">
                    ₹0.00
                  </span>
                )}
              </div>
            </div>

            {/* Deductions & Collections */}
            {(tds.enabled ||
              tdsUnderGst.enabled ||
              tcs.enabled ||
              extraDiscount > 0) && (
              <>
                <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Deductions & Collections
                  </h4>

                  {tds.enabled && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        TDS ({tds.code})
                      </span>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">
                        -₹{tds.amount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {tdsUnderGst.enabled && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        TDS under GST (2%)
                      </span>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">
                        -₹{tdsUnderGst.amount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {tcs.enabled && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        TCS ({tcs.code})
                      </span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        +₹{tcs.amount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {extraDiscount > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Additional Discount
                      </span>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">
                        -₹{extraDiscount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Round Off */}
                  {/* <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="round-off"
                      checked={roundOff}
                      onChange={(e) => onRoundOffChange(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="round-off"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Round Off Amount
                    </label>
                    {roundOff && (
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {totals.roundOffAmount >= 0 ? "+" : ""}₹
                        {totals.roundOffAmount.toFixed(2)}
                      </span>
                    )}
                  </div> */}
                </div>
              </>
            )}

            {/* Round Off */}
            {/* {roundOff && totals.roundOffAmount !== 0 && (
              <div className="flex justify-between items-center py-2 border-t border-gray-300 dark:border-gray-600 pt-3">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Round Off
                </span>
                <span
                  className={`text-sm font-medium ${
                    totals.roundOffAmount >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {totals.roundOffAmount >= 0 ? "+" : ""}₹
                  {totals.roundOffAmount.toFixed(2)}
                </span>
              </div>
            )} */}

            {/* Grand Total */}
            <div className="border-t-2 border-gray-400 dark:border-gray-500 pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  Grand Total
                </span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ₹{totals.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
