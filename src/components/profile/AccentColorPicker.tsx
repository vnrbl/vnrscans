import { useState } from "react";
import { Check, Palette } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PRESET_COLORS = [
  { name: "Purple", value: "#8B5CF6" },
  { name: "Violet", value: "#7C3AED" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Emerald", value: "#10B981" },
  { name: "Rose", value: "#F43F5E" },
  { name: "Pink", value: "#EC4899" },
  { name: "Orange", value: "#F97316" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Red", value: "#EF4444" },
];

type Props = {
  value: string;
  onChange: (color: string) => void;
};

export function AccentColorPicker({ value, onChange }: Props) {
  const [customColor, setCustomColor] = useState(value);
  const [showCustom, setShowCustom] = useState(false);

  const isValidHex = (hex: string) => /^#[0-9A-Fa-f]{6}$/.test(hex);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5" style={{ color: value }} />
        <Label className="text-base font-semibold">Accent Color</Label>
      </div>
      <p className="text-sm text-muted-foreground">
        Choose a color that represents you. It will theme your profile page.
      </p>

      {/* Color grid */}
      <div className="grid grid-cols-6 gap-3">
        {PRESET_COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            onClick={() => {
              onChange(color.value);
              setCustomColor(color.value);
            }}
            className="group relative h-10 w-full rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background"
            style={{
              backgroundColor: color.value,
              boxShadow: value === color.value ? `0 0 0 3px var(--background), 0 0 0 5px ${color.value}` : undefined,
            }}
            title={color.name}
          >
            {value === color.value && (
              <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-md" />
            )}
          </button>
        ))}
      </div>

      {/* Custom color toggle */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowCustom(!showCustom)}
          className="text-xs"
        >
          {showCustom ? "Hide custom" : "Custom color"}
        </Button>

        {/* Live preview swatch */}
        <div
          className="h-6 w-6 rounded-full border-2 border-border shadow-sm"
          style={{ backgroundColor: value }}
        />
        <span className="text-xs font-mono text-muted-foreground">{value}</span>
      </div>

      {/* Custom hex input */}
      {showCustom && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">#</span>
            <Input
              value={customColor.replace("#", "")}
              onChange={(e) => {
                const hex = `#${e.target.value.replace("#", "")}`;
                setCustomColor(hex);
                if (isValidHex(hex)) {
                  onChange(hex);
                }
              }}
              maxLength={6}
              placeholder="8B5CF6"
              className="pl-7 font-mono text-sm"
            />
          </div>
          <input
            type="color"
            value={isValidHex(customColor) ? customColor : "#8B5CF6"}
            onChange={(e) => {
              setCustomColor(e.target.value);
              onChange(e.target.value);
            }}
            className="h-10 w-10 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
          />
        </div>
      )}
    </div>
  );
}
