"use client";

interface AttendanceButtonsProps {
  selected: string;
  onSelect: (type: string) => void;
}

const ATTENDANCE_TYPES = [
  { id: "morning_checkin", label: "Morning Check-in", icon: "🌅", gradient: "from-amber-400 to-orange-400" },
  { id: "lunch_checkout", label: "Lunch Check-out", icon: "🍽️", gradient: "from-emerald-400 to-teal-400" },
  { id: "afternoon_checkin", label: "Afternoon Check-in", icon: "☀️", gradient: "from-blue-400 to-indigo-400" },
  { id: "evening_checkout", label: "Evening Check-out", icon: "🌙", gradient: "from-violet-400 to-purple-400" },
];

/**
 * Attendance type selector — 2x2 grid with modern card-style buttons.
 */
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
              relative px-3 py-4 rounded-2xl text-sm font-semibold transition-all duration-200
              ${isSelected
                ? `bg-gradient-to-br ${type.gradient} text-white shadow-lg scale-[1.03]`
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:shadow-md"
              }
            `}
          >
            <span className="text-xl block mb-1">{type.icon}</span>
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
