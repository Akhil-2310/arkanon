import Link from "next/link";
import { BoltIcon, BugAntIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

export default function Page() {
  return (
    <main className="min-h-[calc(100vh-80px)] bg-base-200 text-base-content flex flex-col">
      {/* --- 1. Hero Section --- */}
      <section className="text-center py-20 px-4 flex flex-col items-center justify-center bg-base-200">
        <h2 className="text-6xl font-extrabold mb-4 leading-tight text-base-content drop-shadow-lg">
          Privacy is inevitable.
        </h2>
        <p className="text-xl mb-8 max-w-3xl text-base-content opacity-70">
          ArkAnon is a decentralized platform where you can form anonymous, interest-based groups, and cast votes or
          send feedback without revealing your identity.
        </p>
        <div className="flex gap-4">
          <Link href="/create-group" className="btn btn-lg btn-primary font-bold shadow-xl">
            Launch dApp
          </Link>
          <Link href="#why-it-matters" className="btn btn-lg btn-outline">
            Why It Matters
          </Link>
        </div>
      </section>

      {/* --- 2. Features Section --- */}
      <section id="features" className="py-16 px-8 max-w-7xl mx-auto">
        <h3 className="text-4xl font-bold text-center mb-12 text-base-content">Core Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6 bg-base-100 rounded-lg shadow-xl border border-base-300">
            <ShieldCheckIcon className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h4 className="text-xl font-semibold mb-2 text-base-content">Anonymous Actions</h4>
            <p className="text-base-content opacity-70">
              Prove group membership without revealing your identity using zk-SNARKs.
            </p>
          </div>
          <div className="p-6 bg-base-100 rounded-lg shadow-xl border border-base-300">
            <BoltIcon className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h4 className="text-xl font-semibold mb-2 text-base-content">Decentralized Groups</h4>
            <p className="text-base-content opacity-70">
              Form and manage communities on-chain, censorship-resistant and transparent.
            </p>
          </div>
          <div className="p-6 bg-base-100 rounded-lg shadow-xl border border-base-300">
            <BugAntIcon className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h4 className="text-xl font-semibold mb-2 text-base-content">Controversy-Free Feedback</h4>
            <p className="text-base-content opacity-70">
              Share sensitive opinions and cast votes fearlessly and securely.
            </p>
          </div>
        </div>
      </section>

      {/* --- 3. Why It Matters Section --- */}
      <section id="why-it-matters" className="py-20 px-8 bg-base-100 text-center">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-4xl font-bold mb-6 text-base-content">Why Privacy Matters</h3>
          <p className="text-lg mb-8 text-base-content opacity-70">
            Privacy is normal, and your actions and identity must remain private. This benefits everyone, especially
            those in high-risk environments.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="p-6 bg-base-200 rounded-lg border border-base-300">
              <h4 className="text-xl font-semibold mb-2 text-base-content">Censorship Resistance</h4>
              <p className="text-base-content opacity-70">
                In oppressive regimes, citizens can put forward thoughts against leaders and take action without fear of
                retaliation, as their identity is protected by ZK proofs.
              </p>
            </div>
            <div className="p-6 bg-base-200 rounded-lg border border-base-300">
              <h4 className="text-xl font-semibold mb-2 text-base-content">Freedom of Opinion</h4>
              <p className="text-base-content opacity-70">
                Everyone has sensitive opinions but is afraid to say them publicly due to controversy. This platform
                allows honest public sharing without worry.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
