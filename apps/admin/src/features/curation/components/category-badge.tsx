import { iconGlyph } from "../icons";

interface CategoryBadgeProps {
  color: string;
  icon: string;
  className: string;
}

// Mirrors the app's badge: the Category color as a rounded square, its glyph inked black on top.
export const CategoryBadge = ({ color, icon, className }: CategoryBadgeProps) => {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-lg font-icons text-black ${className}`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {iconGlyph(icon)}
    </span>
  );
};
