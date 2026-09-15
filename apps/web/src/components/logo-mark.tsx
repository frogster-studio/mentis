import Image from "next/image";
import background from "../../../mobile/assets/app-icon/background.svg";
import mark from "../../../mobile/assets/app-icon/mark.svg";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`relative block overflow-hidden rounded-lg ${className}`}>
      <Image src={background} alt="" fill unoptimized />
      <Image src={mark} alt="" fill unoptimized />
    </span>
  );
}
