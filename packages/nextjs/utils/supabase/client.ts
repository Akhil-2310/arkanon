import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Post = {
  id: string;
  registry_id: number;
  content: string;
  signal_hash: string;
  scope_hash: string;
  nullifier: string;
  created_at: string;
};

export type Proposal = {
  id: string;
  registry_id: number;
  title: string;
  description: string;
  options: string[];
  end_date: string;
  created_at: string;
};

export type Vote = {
  id: string;
  proposal_id: string;
  option_index: number;
  signal_hash: string;
  nullifier: string;
  created_at: string;
};

// Posts functions
export async function createPost(
  registryId: number,
  content: string,
  signalHash: string,
  scopeHash: string,
  nullifier: string,
) {
  const { data, error } = await supabase
    .from("posts")
    .insert([
      {
        registry_id: registryId,
        content,
        signal_hash: signalHash,
        scope_hash: scopeHash,
        nullifier,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Post;
}

export async function getPostsByGroup(registryId: number) {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("registry_id", registryId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Post[];
}

// Proposals functions
export async function createProposal(
  registryId: number,
  title: string,
  description: string,
  options: string[],
  endDate: string,
) {
  const { data, error } = await supabase
    .from("proposals")
    .insert([
      {
        registry_id: registryId,
        title,
        description,
        options,
        end_date: endDate,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Proposal;
}

export async function getProposalsByGroup(registryId: number) {
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("registry_id", registryId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Proposal[];
}

export async function getProposalById(proposalId: string) {
  const { data, error } = await supabase.from("proposals").select("*").eq("id", proposalId).single();

  if (error) throw error;
  return data as Proposal;
}

// Votes functions
export async function createVote(proposalId: string, optionIndex: number, signalHash: string, nullifier: string) {
  const { data, error } = await supabase
    .from("votes")
    .insert([
      {
        proposal_id: proposalId,
        option_index: optionIndex,
        signal_hash: signalHash,
        nullifier,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Vote;
}

export async function getVotesByProposal(proposalId: string) {
  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Vote[];
}

export async function getVoteCounts(proposalId: string) {
  const { data, error } = await supabase.from("votes").select("option_index").eq("proposal_id", proposalId);

  if (error) throw error;

  // Count votes per option
  const counts: { [key: number]: number } = {};
  data.forEach(vote => {
    counts[vote.option_index] = (counts[vote.option_index] || 0) + 1;
  });

  return counts;
}
