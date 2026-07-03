"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        nav: "flex items-center justify-between",
        button_previous: "text-gray-400 hover:text-white p-1",
        button_next: "text-gray-400 hover:text-white p-1",
        month_caption: "flex items-center justify-center text-sm font-medium text-white",
        caption_label: "text-sm font-medium",
        table: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-gray-500 text-xs font-normal w-10 h-8 flex items-center justify-center",
        week: "flex",
        day: "text-center text-sm p-0",
        day_button: "w-10 h-10 rounded-full text-gray-300 hover:bg-zinc-800 aria-selected:bg-amber-500 aria-selected:text-black",
        today: "text-amber-400 font-bold",
        outside: "text-gray-600",
        disabled: "text-gray-700 opacity-50",
        range_start: "rounded-l-full",
        range_end: "rounded-r-full",
        range_middle: "rounded-none",
        hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}

export { Calendar }
