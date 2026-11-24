
import Image from "next/image";

export default function Loading() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center">
      <Image
        src="/lumaNeon.png"
        alt="Luma"
        width={140}
        height={50}
        priority
        className="animate-pulse object-contain"
      />
    </main>
  );
}
