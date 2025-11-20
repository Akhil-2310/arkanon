"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useStoreGroupOnArkiv } from "~~/hooks/useArkivGroups";

export default function CreateGroup() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("General");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const { address } = useAccount();

  const { writeContractAsync: writeWhispAsync } = useScaffoldWriteContract({
    contractName: "Whisp",
  });

  const { storeGroup, isStoring } = useStoreGroupOnArkiv();

  const { data: nextGroupIndex } = useScaffoldReadContract({
    contractName: "Whisp",
    functionName: "nextGroupIndex",
  });

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a group description");
      return;
    }

    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsCreating(true);

    try {
      // Step 1: Create group on Scroll Sepolia (Semaphore)
      console.log("📝 Creating group on Scroll Sepolia...");
      await writeWhispAsync({
        functionName: "createGroup",
        args: [name, description, imageUrl, category],
      });

      // Get the registryId from the current nextGroupIndex (it will be this value)
      const registryId = nextGroupIndex ? Number(nextGroupIndex) : 0;

      toast.success("✅ Group created on Scroll Sepolia!");

      // Step 2: Store metadata on Arkiv (happens in background)
      console.log("📦 Storing metadata on Arkiv...");
      try {
        await storeGroup({
          registryId: registryId.toString(),
          name,
          description,
          imageUrl: imageUrl || undefined,
          category,
          creator: address,
          createdAt: Math.floor(Date.now() / 1000),
        });
        toast.success("✅ Metadata stored on Arkiv!");
      } catch (arkivError) {
        console.warn("⚠️ Arkiv storage failed (non-critical):", arkivError);
        toast("⚠️ Group created but metadata not indexed", { icon: "⚠️" });
      }

      // Redirect to browse groups
      setTimeout(() => {
        router.push("/browse-groups");
      }, 1500);
    } catch (error: any) {
      console.error("Error creating group:", error);
      toast.error(error.message || "Failed to create group");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 text-base-content py-10">
      <section className="max-w-lg mx-auto space-y-6 p-6 bg-base-100 rounded-xl shadow-2xl border border-base-300">
        <h1 className="text-3xl font-bold text-base-content text-center">Create New Group 🛠️</h1>

        <input
          type="text"
          placeholder="Group Name (e.g., 'zk-Builders')"
          value={name}
          onChange={e => setName(e.target.value)}
          className="input input-bordered w-full"
          disabled={isCreating}
        />

        <textarea
          placeholder="Description (What is this group about?)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="textarea textarea-bordered w-full h-32 rounded"
          disabled={isCreating}
        />

        <input
          type="text"
          placeholder="Image URL (optional, e.g., 'https://picsum.photos/400/300')"
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
          className="input input-bordered w-full"
          disabled={isCreating}
        />

        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="select select-bordered w-full"
          disabled={isCreating}
        >
          <option value="General">General</option>
          <option value="DAO">DAO</option>
          <option value="Social">Social</option>
          <option value="Vote">Vote</option>
          <option value="Feedback">Feedback</option>
          <option value="Community">Community</option>
        </select>

        <button
          onClick={handleCreate}
          disabled={isCreating || !name.trim() || !description.trim()}
          className="btn btn-primary w-full"
        >
          {isCreating ? (isStoring ? "📦 Storing on Arkiv..." : "⚡ Creating on Scroll...") : "Create Group"}
        </button>

        {/* Hint text */}
        <p className="text-xs text-base-content opacity-70 text-center pt-2">
          This will create a new anonymous group on Scroll Sepolia. Metadata will be stored on Arkiv.
        </p>
      </section>
    </div>
  );
}
