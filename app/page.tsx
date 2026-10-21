import Link from "next/link";

export default function Home() {
  return (
    <p className="text-neutral-700">
      En construcción. Ir al <Link href="/simulador/" className="text-accent underline">simulador</Link>.
    </p>
  );
}
