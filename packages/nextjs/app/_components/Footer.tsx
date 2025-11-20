import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="bg-base-900 border-t border-base-700 py-6 px-8 text-gray-500 text-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <p>&copy; {new Date().getFullYear()} ArkAnon. Anonymous social platform powered by zero-knowledge proofs.</p>
        <div className="flex gap-4 mt-3 md:mt-0">
          <Link href="/terms" className="hover:text-base-content">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-base-content">
            Privacy Policy
          </Link>
          {/* link to GitHub */}
          <a
            href="https://github.com/Akhil-2310/arkanon"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-base-content"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
};
