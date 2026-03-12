import Image from "next/image";
import Link from "next/link";

const PX = "var(--font-pixelify-sans), sans-serif";

export function NavBar() {
  return (
    <nav
      className="w-full flex items-center justify-between px-[20px]"
      style={{ backgroundColor: "#F8FFE8", height: 65 }}
    >
      <Link href="/" className="no-underline">
        <span
          className="font-bold tracking-[-0.45px]"
          style={{
            fontFamily: PX,
            fontSize: 38,
            color: "#0F2C23",
          }}
        >
          LOOPS HOUSE
        </span>
      </Link>
      <Link href="/" className="no-underline">
        <Image src="/landing/nav-logo.png" alt="Loops" width={148} height={40} className="object-contain" />
      </Link>
    </nav>
  );
}
