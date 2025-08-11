import Link from "next/link";

export default function Home() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Plotter & Statistics</h1>
      <div className="space-x-4">
        <Link className="underline" href="/register">Create account</Link>
        <Link className="underline" href="/login">Login</Link>
      </div>
    </div>
  );
}
