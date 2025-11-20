import { Footer } from "./_components/Footer";
import { Header } from "./_components/Header";
import "@rainbow-me/rainbowkit/styles.css";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "ArkAnon - Anonymous Social Platform",
  description:
    "A privacy-preserving social platform powered by zero-knowledge proofs. Create groups, post anonymously, vote privately.",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={``}>
      {}
      <body className="min-h-screen bg-base-200 text-base-content">
        <ThemeProvider enableSystem>
          <ScaffoldEthAppWithProviders>
            {/* Global Navbar */}
            <Header />

            {/* Content Wrapper */}
            <main className="flex-grow">{children}</main>

            {/* Global Footer */}
            <Footer />
          </ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
