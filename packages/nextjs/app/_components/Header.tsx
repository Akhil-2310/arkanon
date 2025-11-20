"use client";

import Link from "next/link";
import { BugAntIcon } from "@heroicons/react/24/outline";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};
export const Header = () => {
  return (
    <header className="py-4 px-8 border-b border-base-300 bg-base-100">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/arkanon.png" alt="ArkAnon Logo" className="h-16 w-16" />
            <span className="text-2xl font-bold">ArkAnon</span>
          </Link>
        </div>
        <nav className="flex gap-6 items-center">
          {/* Main navigation links */}
          <Link href="/create-group" className="hover:text-primary transition-colors text-base-content">
            Create Group
          </Link>
          <Link href="/browse-groups" className="hover:text-primary transition-colors text-base-content">
            Browse Groups
          </Link>
          <Link href="/my-groups" className="hover:text-primary transition-colors text-base-content">
            My Groups
          </Link>
          <Link href="/debug" className="btn btn-sm btn-primary">
            <BugAntIcon className="h-4 w-4 mr-1" />
            Debug Contracts
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <SwitchTheme />
          <RainbowKitCustomConnectButton />
          <FaucetButton />
        </div>
      </div>
    </header>
  );
};
export const arkanonMenuLinks: HeaderMenuLink[] = [
  {
    label: "ArkAnon",
    href: "/",
  },
  {
    label: "Create Group",
    href: "/create-group",
  },
  {
    label: "Browse Groups",
    href: "/browse-groups",
  },
  {
    label: "My Groups",
    href: "/my-groups",
  },
];
