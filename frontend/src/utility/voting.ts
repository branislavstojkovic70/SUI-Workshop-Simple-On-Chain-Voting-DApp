import { Transaction } from "@mysten/sui/transactions";

export const createProposal = (
  packageId: string,
  question: string,
  option1: string,
  option2: string,
  option3: string
) => {
  const tx = new Transaction();

  // Convert strings to byte arrays
  const questionBytes = Array.from(new TextEncoder().encode(question));
  const option1Bytes = Array.from(new TextEncoder().encode(option1));
  const option2Bytes = Array.from(new TextEncoder().encode(option2));
  const option3Bytes = Array.from(new TextEncoder().encode(option3));

  tx.moveCall({
    target: `${packageId}::simple_voting::create_proposal`,
    arguments: [
      tx.pure.vector("u8", questionBytes),
      tx.pure.vector("u8", option1Bytes),
      tx.pure.vector("u8", option2Bytes),
      tx.pure.vector("u8", option3Bytes),
    ],
  });

  return tx;
};

export const castVote = (
  packageId: string,
  proposalId: string,
  choice: number
) => {
  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::simple_voting::cast_vote`,
    arguments: [
      tx.object(proposalId),
      tx.pure.u64(choice),
    ],
  });

  return tx;
};

export const closeProposal = (packageId: string, proposalId: string) => {
  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::simple_voting::close_proposal`,
    arguments: [tx.object(proposalId)],
  });

  return tx;
};