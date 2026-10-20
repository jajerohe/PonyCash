import Image from "next/image";

// Logo del Pony Parque. "unoptimized": Cloudflare sirve la imagen tal cual,
// sin el optimizador de imágenes de Next.js.
export function Logo({ tamano, className = "" }: { tamano: number; className?: string }) {
  return (
    <Image
      src="/logo-ponyparque.webp"
      alt="Pony Parque Mesa de los Santos"
      width={tamano}
      height={Math.round((tamano * 790) / 712)}
      unoptimized
      priority
      className={className}
    />
  );
}
