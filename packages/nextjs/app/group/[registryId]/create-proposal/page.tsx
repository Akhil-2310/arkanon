"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import { createProposal } from "~~/utils/supabase/client";

export default function CreateProposalPage({ params }: { params: Promise<{ registryId: string }> }) {
  const resolvedParams = use(params);
  const registryId = parseInt(resolvedParams.registryId);
  const router = useRouter();
  const { isConnected } = useAccount();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter a proposal title");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a proposal description");
      return;
    }

    if (options.some(opt => !opt.trim())) {
      toast.error("Please fill in all options");
      return;
    }

    if (!endDate) {
      toast.error("Please select an end date");
      return;
    }

    if (new Date(endDate) <= new Date()) {
      toast.error("End date must be in the future");
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsSubmitting(true);

    try {
      await createProposal(registryId, title, description, options, endDate);

      toast.success("Proposal created successfully!");
      router.push(`/group/${registryId}`);
    } catch (error: any) {
      console.error("Error creating proposal:", error);
      toast.error(error.message || "Failed to create proposal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 text-base-content py-10 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-base-100 rounded-xl p-8 border border-base-300">
          <h1 className="text-3xl font-bold mb-6">Create Proposal</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Proposal title"
                className="input input-bordered w-full"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe your proposal..."
                className="textarea textarea-bordered w-full h-32 rounded"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Options</label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={e => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="input input-bordered flex-1"
                      disabled={isSubmitting}
                    />
                    {options.length > 2 && (
                      <button onClick={() => removeOption(index)} className="btn btn-error" disabled={isSubmitting}>
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addOption} className="btn btn-sm btn-outline mt-2" disabled={isSubmitting}>
                + Add Option
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="input input-bordered w-full"
                disabled={isSubmitting}
              />
            </div>

            <div className="bg-info bg-opacity-20 border border-info rounded-lg p-4">
              <p className="text-sm text-base-content">
                🗳️ <strong>Voting:</strong> Members can vote anonymously using zero-knowledge proofs. Each member can
                vote once per proposal.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !title.trim() || !description.trim() || !endDate}
                className="btn btn-primary"
              >
                {isSubmitting ? "Creating..." : "Create Proposal"}
              </button>
              <button
                onClick={() => router.push(`/group/${registryId}`)}
                className="btn btn-outline"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
