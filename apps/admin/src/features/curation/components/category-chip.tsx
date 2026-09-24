import { iconGlyph } from "../icons";

interface CategoryChipProps {
  name: string;
  color: string;
  secondaryColor: string;
  icon: string;
}

const APP_INK = "#250313";

// Mirrors the app's Category chip: the secondary color as the pill, the color as the glyph's badge.
export const CategoryChip = ({ name, color, secondaryColor, icon }: CategoryChipProps) => {
  return (
    <span
      className="inline-flex h-[35px] items-center rounded-[13px] p-[3px]"
      style={{ backgroundColor: secondaryColor }}
      aria-hidden="true"
    >
      <span
        className="flex size-[29px] shrink-0 items-center justify-center rounded-[10px] font-icons text-[20px] leading-none"
        style={{ backgroundColor: color, color: APP_INK }}
      >
        {iconGlyph(icon)}
      </span>
      {name === "" ? null : (
        <span
          className="whitespace-nowrap px-[9px] font-chip text-[14px] uppercase leading-none"
          style={{ color: APP_INK }}
        >
          {name}
        </span>
      )}
    </span>
  );
};
