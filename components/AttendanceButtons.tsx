"use client";

import { Sunrise, Utensils, Sun, Moon } from "lucide-react";

interface AttendanceButtonsProps {
  selected: string;
  onSelect: (type: string) => void;
}

const ATTENDANCE_TYPES = [
  { id: "morning_checkin", label: "Morning Check-in", icon: <Sunrise className="w-6 h-6 mx-auto mb-1" /> },
  { id: "lunch_checkout", label: "Lunch Check-out", icon: <Utensils className="w-6 h-6 mx-auto mb-1" /> },
  { id: "afternoon_checkin", label: "Afternoon Check-in", icon: <Sun className="w-6 h-6 mx-auto mb-1" /> },
  { id: "evening_checkout", label: "Evening Check-out", icon: <Moon className="w-6 h-6 mx-auto mb-1" /> },
];

export default function AttendanceButtons({ selected, onSelect }: AttendanceButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
      {ATTENDANCE_TYPES.map((type) => {
        const isSelected = selected === type.id;
        return (
          <button
            key={type.id}
            onClick={() => onSelect(type.id)}
            className={`
              relative px-3 py-4 rounded text-sm font-semibold transition-colors
              ${isSelected
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }
            `}
          >
            <span className="block text-center">{type.icon}</span>
            <span className="text-xs leading-tight">{type.label}</span>
            {isSelected && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white/80" />
            )}
          </button>
        );
      })}
    </div>
  );
}
