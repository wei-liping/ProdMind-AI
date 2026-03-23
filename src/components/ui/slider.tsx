"use client";

import { cn } from "@/lib/utils";

interface SliderProps {
  className?: string;
  value?: number[];
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onValueChange?: (value: number) => void;
}

function Slider({
  className,
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  onValueChange,
}: SliderProps) {
  const currentValue = value?.[0] ?? defaultValue?.[0] ?? min;

  const percent = ((currentValue - min) / (max - min)) * 100;

  return (
    <div
      data-slot="slider"
      className={cn(
        "relative flex w-full touch-none items-center select-none",
        disabled && "opacity-50",
        className,
      )}
    >
      <div
        data-slot="slider-track"
        className="relative h-1 w-full grow overflow-hidden rounded-full bg-muted"
      >
        <div
          data-slot="slider-range"
          className="absolute h-full bg-primary"
          style={{ width: `${percent}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        disabled={disabled}
        onChange={(e) => onValueChange?.(Number(e.target.value))}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
      <div
        data-slot="slider-thumb"
        className="absolute block size-3 shrink-0 rounded-full border border-ring bg-white ring-ring/50 transition-[color,box-shadow] select-none pointer-events-none"
        style={{ left: `calc(${percent}% - 6px)` }}
      />
    </div>
  );
}

export { Slider };
