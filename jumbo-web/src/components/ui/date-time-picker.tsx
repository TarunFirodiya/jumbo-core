"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DateTimePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
  className?: string;
}

export function DateTimePicker({ date: controlledDate, setDate: setControlledDate, className }: DateTimePickerProps) {
  const [date, setDate] = useState<Date | undefined>(controlledDate);
  const [selectedTime, setSelectedTime] = useState<string | null>(
    controlledDate ? format(controlledDate, "hh:mm a") : null
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (controlledDate) {
      setDate(controlledDate);
      setSelectedTime(format(controlledDate, "hh:mm a"));
    }
  }, [controlledDate]);

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) {
      setDate(undefined);
      setControlledDate(undefined);
      return;
    }
    
    // Preserve time if already selected
    if (date && selectedTime) {
      const [time, period] = selectedTime.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      newDate.setHours(hours, minutes);
    }
    
    setDate(newDate);
    // If we have a time selected, update the parent
    if (selectedTime) {
        setControlledDate(newDate);
    }
  };

  const handleTimeSelect = (timeStr: string) => {
    setSelectedTime(timeStr);
    
    if (date) {
      const newDate = new Date(date);
      const [time, period] = timeStr.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      newDate.setHours(hours, minutes);
      
      setDate(newDate);
      setControlledDate(newDate);
      setIsOpen(false); 
    }
  };

  const availableTimes = [
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "01:00 PM",
    "01:30 PM",
    "02:00 PM",
    "02:30 PM",
    "03:00 PM",
    "03:30 PM",
    "04:00 PM",
    "04:30 PM",
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "PPP p")
          ) : (
            <span>Pick a date and time</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="flex divide-x overflow-hidden bg-background">
          <Calendar mode="single" onSelect={handleDateSelect} selected={date} />
          <div className="relative w-[200px] overflow-hidden">
            <div className="absolute inset-0 grid gap-4">
              <div className="space-y-2 px-4 pt-4">
                <p className="text-center text-sm font-medium">
                  Available Times
                </p>
              </div>
              <ScrollArea className="h-[300px] overflow-y-auto">
                <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                  {availableTimes.map((time) => (
                    <Button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      size="sm"
                      variant={selectedTime === time ? "default" : "outline"}
                      className="text-xs"
                      disabled={!date}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

