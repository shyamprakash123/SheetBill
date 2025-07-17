interface PrefixInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error: string;
}

const PrefixInput: React.FC<PrefixInputProps> = ({
  label,
  value,
  onChange,
  error,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
      placeholder="e.g., INV, CRN"
    />
    {error && <span className="text-red-500 text-sm">{error}</span>}
  </div>
);

export interface PrefixSettings {
  invoice_prefix: string;
  credit_prefix: string;
  purchase_prefix: string;
  expenses_prefix: string;
  quotations_prefix: string;
}

interface PrefixSettingsFormProps {
  value: PrefixSettings;
  onChange: (updated: PrefixSettings) => void;
  errors: any;
}

export const PrefixSettingsForm: React.FC<PrefixSettingsFormProps> = ({
  value,
  onChange,
  errors,
}) => {
  const handleFieldChange = (field: keyof PrefixSettings, val: string) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <PrefixInput
        label="Invoice Prefix"
        value={value.invoice_prefix}
        onChange={(val) => handleFieldChange("invoice_prefix", val)}
        error={errors.invoice_prefix}
      />
      <PrefixInput
        label="Credit Note Prefix"
        value={value.credit_prefix}
        onChange={(val) => handleFieldChange("credit_prefix", val)}
        error={errors.credit_prefix}
      />
      <PrefixInput
        label="Purchase Prefix"
        value={value.purchase_prefix}
        onChange={(val) => handleFieldChange("purchase_prefix", val)}
        error={errors.purchase_prefix}
      />
      <PrefixInput
        label="Expense Prefix"
        value={value.expenses_prefix}
        onChange={(val) => handleFieldChange("expenses_prefix", val)}
        error={errors.expenses_prefix}
      />
      <PrefixInput
        label="Quotation Prefix"
        value={value.quotations_prefix}
        onChange={(val) => handleFieldChange("quotations_prefix", val)}
        error={errors.quotations_prefix}
      />
    </div>
  );
};
