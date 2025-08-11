import React from "react";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { DateRange, DateRangePicker } from "../DatePickerComponent/DatePicker";
import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";

// Extend dayjs with the required plugins
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export default function CustomDateRangePicker({
  dateRange,
  setDateRange,
}: {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
}) {
  // Create a local ref for the date picker container

  const getPresetLabel = (from: Date, to: Date) => {
    const sameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    const sameRange = (rangeFrom: Date, rangeTo: Date) =>
      sameDay(from, rangeFrom) && sameDay(to, rangeTo);

    const match = presets.find(
      (preset) =>
        preset.dateRange &&
        preset.dateRange.from &&
        preset.dateRange.to &&
        sameRange(preset.dateRange.from, preset.dateRange.to)
    );

    return match ? match.label : null;
  };

  function getFiscalYearRanges(count = 4) {
    const fiscalStartMonth = 3; // April
    const today = new Date();
    let fiscalYearStart = new Date(today.getFullYear(), fiscalStartMonth, 1);

    if (today < fiscalYearStart) {
      fiscalYearStart = new Date(today.getFullYear() - 1, fiscalStartMonth, 1);
    }

    const fiscalRanges = [];
    for (let i = 0; i < count; i++) {
      const start = new Date(
        fiscalYearStart.getFullYear() - i,
        fiscalStartMonth,
        1
      );
      const end = new Date(start.getFullYear() + 1, fiscalStartMonth, 0);

      const fyLabel = `FY ${String(start.getFullYear() % 100).padStart(
        2,
        "0"
      )}-${String((start.getFullYear() + 1) % 100).padStart(2, "0")}`;

      fiscalRanges.push({
        label: fyLabel,
        dateRange: { from: start, to: end },
      });
    }

    return fiscalRanges;
  }

  const today = new Date();

  const presets = [
    {
      label: "Today",
      dateRange: { from: today, to: today },
    },
    {
      label: "Yesterday",
      dateRange: {
        from: subDays(today, 1),
        to: subDays(today, 1),
      },
    },
    {
      label: "This Week",
      dateRange: {
        from: startOfWeek(today, { weekStartsOn: 1 }), // Monday start
        to: endOfWeek(today, { weekStartsOn: 1 }),
      },
    },
    {
      label: "Last Week",
      dateRange: {
        from: startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }),
        to: endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }),
      },
    },
    {
      label: "Last 7 Days",
      dateRange: {
        from: subDays(today, 7),
        to: today,
      },
    },
    {
      label: "Last 30 Days",
      dateRange: {
        from: subDays(today, 30),
        to: today,
      },
    },
    {
      label: "This Month",
      dateRange: { from: startOfMonth(today), to: endOfMonth(today) },
    },
    {
      label: "Last Month",
      dateRange: {
        from: startOfMonth(subMonths(today, 1)),
        to: endOfMonth(subMonths(today, 1)),
      },
    },
    {
      label: "This Year",
      dateRange: { from: startOfYear(today), to: endOfYear(today) },
    },
    {
      label: "Last Year",
      dateRange: {
        from: startOfYear(subYears(today, 1)),
        to: endOfYear(subYears(today, 1)),
      },
    },
    {
      label: "Last Quarter",
      dateRange: (() => {
        const currentQuarter = Math.floor(today.getMonth() / 3);
        const startMonth = ((currentQuarter - 1 + 4) % 4) * 3;
        const yearShift =
          currentQuarter === 0 ? today.getFullYear() - 1 : today.getFullYear();
        const start = new Date(yearShift, startMonth, 1);
        const end = endOfMonth(new Date(yearShift, startMonth + 2, 1));
        return { from: start, to: end };
      })(),
    },
    ...getFiscalYearRanges(4),
  ];

  return (
    <div className="flex flex-col">
      <DateRangePicker
        presets={presets}
        value={dateRange}
        onChange={setDateRange}
        align="start"
        enableYearNavigation
      />

      <p className="flex items-center rounded-md  text-[13px] text-gray-500 dark:bg-gray-800 dark:text-gray-300">
        {dateRange ? (
          <>
            <p>Showing data For:</p>
            {getPresetLabel(dateRange.from, dateRange.to) ? (
              <span className="ml-1 font-semibold">
                {getPresetLabel(dateRange.from, dateRange.to)}
              </span>
            ) : (
              <p className="ml-1 font-semibold">
                {dateRange.from?.toLocaleDateString()}{" "}
                {dateRange.to ? "-" + dateRange.to?.toLocaleDateString() : ""}
              </p>
            )}
          </>
        ) : (
          <p>No date range selected</p>
        )}
      </p>
    </div>
  );
}
