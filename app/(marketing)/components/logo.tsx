import Image from "next/image";

export const Logo = () => {
  return (
    <Image src={"/colored-logo.png"} alt="Sonnet Logo" width={20} height={20} />
  );
};
