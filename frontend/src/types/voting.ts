export interface VotingProposal {
  id: {
    id: string;
  };
  question: number[];
  options: number[][];
  vote_counts: number[];
  voters: {
    type: string;
    fields: {
      id: {
        id: string;
      };
      size: string;
      contents?: Array<{
        fields: {
          key: string;
          value: number;
        };
      }>;
    };
  };
  is_active: boolean;
  total_votes: number;
}

export interface VoteReceipt {
  id: {
    id: string;
  };
  proposal_id: string;
  voter: string;
  choice: number;
  timestamp: string;
}

export interface VoteCastEvent {
  proposal_id: string;
  voter: string;
  choice: number;
  timestamp: string;
}

export interface ProposalCreatedEvent {
  proposal_id: string;
  question: number[];
  num_options: number;
}