import { useId } from "react";

import type { Social } from "@/lib/cards/schema";

// The six Social brand marks as currentColor SVGs, sized by the same CSS the
// Buttons apply to lucide icons. lucide-react ships no brand icons (see the
// AGENTS.md exception); the path data comes from the logos in /public/socials,
// flattened to a single tintable color: glyphs are knocked out of their
// containers with fill-rule or a mask instead of being drawn in white.

export function XIcon() {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
      <path d="M304.7 216.8 495.2 0h-45.1L284.6 188.2 152.6 0H.2l199.7 284.7L.2 512h45.1L220 313.2 359.4 512h152.3M61.6 33.3h69.3l319.1 447h-69.3" />
    </svg>
  );
}

export function LinkedinIcon() {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M56.9 512h398.2c31.4 0 56.9-25.5 56.9-56.9V56.9C512 25.5 486.5 0 455.1 0H56.9C25.5 0 0 25.5 0 56.9v398.2C0 486.5 25.5 512 56.9 512M440.9 440.9h-76V311.5c0-35.5-13.5-55.3-41.6-55.3-30.5 0-46.5 20.6-46.5 55.3v129.4h-73.2V194.4h73.2v33.2s22-40.7 74.3-40.7 89.7 31.9 89.7 98v156zM116.3 162.1c-24.9 0-45.2-20.4-45.2-45.5s20.2-45.5 45.2-45.5 45.1 20.4 45.1 45.5-20.2 45.5-45.1 45.5M78.5 440.9h76.4V194.4H78.5z"
      />
    </svg>
  );
}

export function FacebookIcon() {
  // The f glyph bleeds past the circle's edge, so an even-odd knockout would
  // leave the overhang filled; a mask cuts the whole glyph cleanly.
  const maskId = useId();
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
      <mask id={maskId}>
        <rect width="512" height="512" fill="#fff" />
        <path
          fill="#000"
          d="m355.8 327.7 11.5-71.7h-67.8v-49.9c0-20.5 7.7-35.8 38.4-35.8h33.3V105c-17.9-2.6-38.4-5.1-56.3-5.1-58.9 0-99.8 35.8-99.8 99.8V256h-64v71.7h64v180.5c14.1 2.6 28.2 3.8 42.2 3.8 14.1 0 28.2-1.3 42.2-3.8V327.7z"
        />
      </mask>
      <path
        mask={`url(#${maskId})`}
        d="M213.8 509.4C92.2 487.7 0 382.7 0 256 0 115.2 115.2 0 256 0s256 115.2 256 256c0 126.7-92.2 231.7-213.8 253.4l-14.1-11.5h-56.3z"
      />
    </svg>
  );
}

export function TiktokIcon() {
  return (
    <svg viewBox="30.39 0 451.21 512.03" fill="currentColor" aria-hidden="true">
      <path d="M347.7 17.8c8.2 70.4 47.5 112.4 115.7 116.8v79.1c-39.6 3.9-74.2-9.1-114.6-33.4v148c.3 193.1-207.4 207.8-266.8 112-39.5-63.7-25.2-216.7 117.3-239.4v80.4c-33.3 5.5-51.3 15.7-61.2 34.6-61.1 116.8 152 186.3 137.2-1.9V17.8z" />
    </svg>
  );
}

export function YoutubeIcon() {
  return (
    <svg viewBox="0 76.8 512 358.4" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M501.3 132.8c-5.9-22-23.2-39.4-45.3-45.3-39.9-10.7-200-10.7-200-10.7s-160.1 0-200 10.7c-22 5.9-39.4 23.2-45.3 45.3C0 172.7 0 256 0 256s0 83.3 10.7 123.2c5.9 22 23.2 39.4 45.3 45.3 39.9 10.7 200 10.7 200 10.7s160.1 0 200-10.7c22-5.9 39.4-23.2 45.3-45.3C512 339.3 512 256 512 256s0-83.3-10.7-123.2M204.8 332.8l133-76.8-133-76.8z"
      />
    </svg>
  );
}

export function InstagramIcon() {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
      <path d="M256 67c-51.3 0-57.8.2-77.9 1.1s-33.9 4.1-45.9 8.8c-12.4 4.8-23 11.3-33.5 21.8s-17 21.1-21.8 33.5c-4.7 12-7.9 25.8-8.8 45.9-.9 20.2-1.1 26.6-1.1 77.9s.2 57.8 1.1 77.9 4.1 33.9 8.8 45.9c4.8 12.4 11.3 23 21.8 33.5s21 17 33.5 21.8c12 4.7 25.8 7.9 45.9 8.8 20.2.9 26.6 1.1 77.9 1.1s57.8-.2 77.9-1.1 33.9-4.1 45.9-8.8c12.4-4.8 23-11.3 33.5-21.8s17-21.1 21.8-33.5c4.6-12 7.8-25.8 8.8-45.9.9-20.2 1.1-26.6 1.1-77.9s-.2-57.8-1.1-77.9-4.1-33.9-8.8-45.9c-4.8-12.4-11.3-23-21.8-33.5s-21-17-33.5-21.8c-12-4.7-25.8-7.9-45.9-8.8-20.2-.9-26.6-1.1-77.9-1.1m-17 34.1h17c50.5 0 56.4.2 76.4 1.1 18.4.8 28.4 3.9 35.1 6.5 8.8 3.4 15.1 7.5 21.7 14.1s10.7 12.9 14.1 21.7c2.6 6.7 5.7 16.7 6.5 35.1.9 19.9 1.1 25.9 1.1 76.4s-.2 56.4-1.1 76.4c-.8 18.4-3.9 28.4-6.5 35.1-3.4 8.8-7.5 15.1-14.1 21.7s-12.9 10.7-21.7 14.1c-6.7 2.6-16.7 5.7-35.1 6.5-19.9.9-25.9 1.1-76.4 1.1s-56.5-.2-76.4-1.1c-18.4-.9-28.4-3.9-35.1-6.5-8.8-3.4-15.1-7.5-21.7-14.1s-10.7-12.9-14.1-21.7c-2.6-6.7-5.7-16.7-6.5-35.1-.9-19.9-1.1-25.9-1.1-76.4s.2-56.4 1.1-76.4c.8-18.4 3.9-28.4 6.5-35.1 3.4-8.8 7.5-15.1 14.1-21.7s12.9-10.7 21.7-14.1c6.7-2.6 16.7-5.7 35.1-6.5 17.4-.9 24.2-1.1 59.4-1.1m117.9 31.4c-12.5 0-22.7 10.1-22.7 22.7 0 12.5 10.2 22.7 22.7 22.7s22.7-10.2 22.7-22.7-10.2-22.8-22.7-22.7M256 159c-53.6 0-97.1 43.5-97.1 97.1s43.5 97 97.1 97 97-43.4 97-97-43.4-97.1-97-97.1m0 34c34.8 0 63 28.2 63 63s-28.2 63-63 63-63-28.2-63-63 28.2-63 63-63" />
    </svg>
  );
}

export const SOCIAL_ICONS: Record<Social, () => React.JSX.Element> = {
  x: XIcon,
  linkedin: LinkedinIcon,
  facebook: FacebookIcon,
  tiktok: TiktokIcon,
  youtube: YoutubeIcon,
  instagram: InstagramIcon,
};
