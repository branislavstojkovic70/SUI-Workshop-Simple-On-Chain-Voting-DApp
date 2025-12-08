module voting_dapp::simple_voting;

use sui::event;
use sui::object::{Self, UID};
use sui::table::{Self, Table};
use sui::transfer;
use sui::tx_context::{Self, TxContext};

const EAlreadyVoted: u64 = 1;
const EInvalidOption: u64 = 2;
const EProposalNotActive: u64 = 3;

public struct VotingProposal has key {
    id: UID,
    question: vector<u8>,
    options: vector<vector<u8>>,
    vote_counts: vector<u64>,
    voters: Table<address, u64>,
    is_active: bool,
    total_votes: u64,
}

public struct VoteReceipt has key, store {
    id: UID,
    proposal_id: address,
    voter: address,
    choice: u64,
    timestamp: u64,
}

public struct VoteCastEvent has copy, drop {
    proposal_id: address,
    voter: address,
    choice: u64,
    timestamp: u64,
}

public struct ProposalCreatedEvent has copy, drop {
    proposal_id: address,
    question: vector<u8>,
    num_options: u64,
}

/// Creates a new voting proposal with a question and three voting options
/// # Arguments
/// * `question` - The question being voted on
/// * `option1` - First voting option text
/// * `option2` - Second voting option text
/// * `option3` - Third voting option text
public entry fun create_proposal(
    question: vector<u8>,
    option1: vector<u8>,
    option2: vector<u8>,
    option3: vector<u8>,
    ctx: &mut TxContext,
) {
    let proposal_id = object::new(ctx);
    let proposal_addr = object::uid_to_address(&proposal_id);

    let mut options = vector::empty<vector<u8>>();
    vector::push_back(&mut options, option1);
    vector::push_back(&mut options, option2);
    vector::push_back(&mut options, option3);

    let mut vote_counts = vector::empty<u64>();
    vector::push_back(&mut vote_counts, 0);
    vector::push_back(&mut vote_counts, 0);
    vector::push_back(&mut vote_counts, 0);

    let proposal = VotingProposal {
        id: proposal_id,
        question,
        options,
        vote_counts,
        voters: table::new(ctx),
        is_active: true,
        total_votes: 0,
    };

    event::emit(ProposalCreatedEvent {
        proposal_id: proposal_addr,
        question,
        num_options: 3,
    });

    transfer::share_object(proposal);
}

/// Cast a vote on an active proposal
/// # Arguments
/// * `proposal` - The voting proposal object to vote on
/// * `choice` - The option index to vote for (0, 1, or 2)
public entry fun cast_vote(proposal: &mut VotingProposal, choice: u64, ctx: &mut TxContext) {
    assert!(proposal.is_active, EProposalNotActive);

    let voter = tx_context::sender(ctx);

    assert!(!table::contains(&proposal.voters, voter), EAlreadyVoted);

    assert!(choice < vector::length(&proposal.vote_counts), EInvalidOption);

    table::add(&mut proposal.voters, voter, choice);

    let current_count = *vector::borrow(&proposal.vote_counts, choice);
    *vector::borrow_mut(&mut proposal.vote_counts, choice) = current_count + 1;

    proposal.total_votes = proposal.total_votes + 1;

    let receipt = VoteReceipt {
        id: object::new(ctx),
        proposal_id: object::uid_to_address(&proposal.id),
        voter,
        choice,
        timestamp: tx_context::epoch(ctx),
    };

    event::emit(VoteCastEvent {
        proposal_id: object::uid_to_address(&proposal.id),
        voter,
        choice,
        timestamp: tx_context::epoch(ctx),
    });

    transfer::transfer(receipt, voter);
}

/// Close an active proposal to prevent further voting
/// # Arguments
/// * `proposal` - The voting proposal object to close
public entry fun close_proposal(proposal: &mut VotingProposal, _ctx: &mut TxContext) {
    proposal.is_active = false;
}

// ====== NEW GETTER FUNCTIONS ======

/// Get the proposal ID (address)
public fun get_proposal_id(proposal: &VotingProposal): address {
    object::uid_to_address(&proposal.id)
}

/// Get the question
public fun get_question(proposal: &VotingProposal): vector<u8> {
    proposal.question
}

/// Get all options
public fun get_options(proposal: &VotingProposal): vector<vector<u8>> {
    proposal.options
}

public fun get_vote_counts(proposal: &VotingProposal): vector<u64> {
    proposal.vote_counts
}

public fun get_total_votes(proposal: &VotingProposal): u64 {
    proposal.total_votes
}

public fun is_active(proposal: &VotingProposal): bool {
    proposal.is_active
}

public fun has_voted(proposal: &VotingProposal, voter: address): bool {
    table::contains(&proposal.voters, voter)
}

public fun get_user_vote(proposal: &VotingProposal, voter: address): u64 {
    *table::borrow(&proposal.voters, voter)
}

#[allow(unused_function)]
fun init(ctx: &mut TxContext) {
    let question = b"What should we do to make people smile today?";
    let option1 = b"Help Mr. Frog find his dollar (he really needs it)";
    let option2 = b"Let Pim organize another overly enthusiastic adventure";
    let option3 = b"Just let Charlie be cynical and depressed in peace";

    create_proposal(question, option1, option2, option3, ctx);
}