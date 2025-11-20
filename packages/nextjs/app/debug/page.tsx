import { DebugContracts } from "./_components/DebugContracts";
import type { NextPage } from "next";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Debug Contracts",
  description: "Debug your deployed 🏗 Scaffold-ETH 2 contracts in an easy way",
});

const Debug: NextPage = () => {
  return (
    <>
      <DebugContracts />
      {/* Adjusted styling for better visual fit with the dark theme */}
      <div className="text-center mt-8 bg-gray-800 p-10 text-gray-200">
        <h1 className="text-4xl my-0 text-green-400">Debug Contracts</h1>
        <p className="text-gray-400">
          You can debug & interact with your deployed contracts here.
          <br /> Check{" "}
          <code className="italic bg-gray-700 text-base font-bold [word-spacing:-0.5rem] px-1 text-white rounded">
            packages / nextjs / app / debug / page.tsx
          </code>{" "}
        </p>
      </div>
    </>
  );
};

export default Debug;
