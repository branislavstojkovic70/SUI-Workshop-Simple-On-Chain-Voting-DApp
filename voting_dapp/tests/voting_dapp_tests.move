#[test_only]
module voting_dapp::voting_dapp_tests;

use sui::test_scenario as ts;
use voting_dapp::simple_voting::{
    Self,
    VotingProposal,
    VoteReceipt
};

const ADMIN: address = @0xAD;
const ALICE: address = @0xA11CE;
const BOB: address = @0xB0B;
const CHARLIE: address = @0xCAAA; 

// ============================================
// Test 1: Create Proposal Test
// ============================================
#[test]
fun test_create_proposal() {
    let mut scenario = ts::begin(ADMIN);
    
    {
        let ctx = ts::ctx(&mut scenario);
        simple_voting::create_proposal(
            b"Who is the best Smiling Friend?",
            b"Pim (pure optimism)",
            b"Charlie (cynical realist)",
            b"Allan (cheese connoisseur)",
            ctx
        );
    };
    
    ts::next_tx(&mut scenario, ADMIN);
    {
        let proposal = ts::take_shared<VotingProposal>(&scenario);
        
        assert!(simple_voting::is_active(&proposal), 0);
        assert!(simple_voting::get_total_votes(&proposal) == 0, 1);
        
        let vote_counts = simple_voting::get_vote_counts(&proposal);
        assert!(vector::length(&vote_counts) == 3, 2);
        assert!(*vector::borrow(&vote_counts, 0) == 0, 3);
        assert!(*vector::borrow(&vote_counts, 1) == 0, 4);
        assert!(*vector::borrow(&vote_counts, 2) == 0, 5);
        
        ts::return_shared(proposal);
    };
    
    ts::end(scenario);
}

// ============================================
// Test 2: Cast Vote Successfully
// ============================================
#[test]
fun test_cast_vote_success() {
    let mut scenario = ts::begin(ADMIN);
    
    {
        let ctx = ts::ctx(&mut scenario);
        simple_voting::create_proposal(
            b"Best debugging method?",
            b"Print statements everywhere",
            b"Actually use a debugger",
            b"Rewrite from scratch",
            ctx
        );
    };
    
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        let ctx = ts::ctx(&mut scenario);
        
        simple_voting::cast_vote(&mut proposal, 0, ctx);
        
        assert!(simple_voting::has_voted(&proposal, ALICE), 0);
        assert!(simple_voting::get_user_vote(&proposal, ALICE) == 0, 1);
        assert!(simple_voting::get_total_votes(&proposal) == 1, 2);
        
        let vote_counts = simple_voting::get_vote_counts(&proposal);
        assert!(*vector::borrow(&vote_counts, 0) == 1, 3);
        
        ts::return_shared(proposal);
    };
    
    ts::next_tx(&mut scenario, ALICE);
    {
        let receipt = ts::take_from_sender<VoteReceipt>(&scenario);
        ts::return_to_sender(&scenario, receipt);
    };
    
    ts::end(scenario);
}

// ============================================
// Test 3: Multiple Users Vote
// ============================================
#[test]
fun test_multiple_votes() {
    let mut scenario = ts::begin(ADMIN);
    
    {
        let ctx = ts::ctx(&mut scenario);
        simple_voting::create_proposal(
            b"Who should lead the mission?",
            b"Pim",
            b"Charlie",
            b"Mr. Frog",
            ctx
        );
    };
    
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        simple_voting::cast_vote(&mut proposal, 0, ts::ctx(&mut scenario));
        ts::return_shared(proposal);
    };
    
    ts::next_tx(&mut scenario, BOB);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        simple_voting::cast_vote(&mut proposal, 1, ts::ctx(&mut scenario));
        ts::return_shared(proposal);
    };
    
    ts::next_tx(&mut scenario, CHARLIE);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        simple_voting::cast_vote(&mut proposal, 0, ts::ctx(&mut scenario));
        ts::return_shared(proposal);
    };
    
    ts::next_tx(&mut scenario, ADMIN);
    {
        let proposal = ts::take_shared<VotingProposal>(&scenario);
        
        assert!(simple_voting::get_total_votes(&proposal) == 3, 0);
        
        let vote_counts = simple_voting::get_vote_counts(&proposal);
        assert!(*vector::borrow(&vote_counts, 0) == 2, 1); // Alice + Charlie
        assert!(*vector::borrow(&vote_counts, 1) == 1, 2); // Bob
        assert!(*vector::borrow(&vote_counts, 2) == 0, 3); // Nobody
        
        ts::return_shared(proposal);
    };
    
    ts::end(scenario);
}

// ============================================
// Test 4: Cannot Vote Twice (Should Fail)
// ============================================
#[test]
#[expected_failure(abort_code = simple_voting::EAlreadyVoted)]
fun test_cannot_vote_twice() {
    let mut scenario = ts::begin(ADMIN);
    
    {
        let ctx = ts::ctx(&mut scenario);
        simple_voting::create_proposal(
            b"Test question",
            b"Option 1",
            b"Option 2",
            b"Option 3",
            ctx
        );
    };
    
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        simple_voting::cast_vote(&mut proposal, 0, ts::ctx(&mut scenario));
        ts::return_shared(proposal);
    };
    
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        simple_voting::cast_vote(&mut proposal, 1, ts::ctx(&mut scenario));
        ts::return_shared(proposal);
    };
    
    ts::end(scenario);
}

// ============================================
// Test 5: Invalid Option (Should Fail)
// ============================================
#[test]
#[expected_failure(abort_code = simple_voting::EInvalidOption)]
fun test_invalid_option() {
    let mut scenario = ts::begin(ADMIN);
    
    {
        let ctx = ts::ctx(&mut scenario);
        simple_voting::create_proposal(
            b"Test question",
            b"Option 1",
            b"Option 2",
            b"Option 3",
            ctx
        );
    };
    
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        simple_voting::cast_vote(&mut proposal, 3, ts::ctx(&mut scenario));
        ts::return_shared(proposal);
    };
    
    ts::end(scenario);
}

// ============================================
// Test 6: Vote on Closed Proposal (Should Fail)
// ============================================
#[test]
#[expected_failure(abort_code = simple_voting::EProposalNotActive)]
fun test_vote_on_closed_proposal() {
    let mut scenario = ts::begin(ADMIN);
    
    {
        let ctx = ts::ctx(&mut scenario);
        simple_voting::create_proposal(
            b"Test question",
            b"Option 1",
            b"Option 2",
            b"Option 3",
            ctx
        );
    };
    
    ts::next_tx(&mut scenario, ADMIN);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        simple_voting::close_proposal(&mut proposal, ts::ctx(&mut scenario));
        assert!(!simple_voting::is_active(&proposal), 0);
        ts::return_shared(proposal);
    };
    
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        simple_voting::cast_vote(&mut proposal, 0, ts::ctx(&mut scenario));
        ts::return_shared(proposal);
    };
    
    ts::end(scenario);
}

// ============================================
// Test 7: Close Proposal
// ============================================
#[test]
fun test_close_proposal() {
    let mut scenario = ts::begin(ADMIN);
    
    {
        let ctx = ts::ctx(&mut scenario);
        simple_voting::create_proposal(
            b"Should we close this?",
            b"Yes",
            b"No",
            b"Maybe",
            ctx
        );
    };
    
    ts::next_tx(&mut scenario, ADMIN);
    {
        let proposal = ts::take_shared<VotingProposal>(&scenario);
        assert!(simple_voting::is_active(&proposal), 0);
        ts::return_shared(proposal);
    };
    
    ts::next_tx(&mut scenario, ADMIN);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        simple_voting::close_proposal(&mut proposal, ts::ctx(&mut scenario));
        ts::return_shared(proposal);
    };
    
    ts::next_tx(&mut scenario, ADMIN);
    {
        let proposal = ts::take_shared<VotingProposal>(&scenario);
        assert!(!simple_voting::is_active(&proposal), 0);
        ts::return_shared(proposal);
    };
    
    ts::end(scenario);
}

// ============================================
// Test 8: Vote Receipt Properties
// ============================================
#[test]
fun test_vote_receipt() {
    let mut scenario = ts::begin(ADMIN);
    
    {
        let ctx = ts::ctx(&mut scenario);
        simple_voting::create_proposal(
            b"Receipt test",
            b"Option A",
            b"Option B",
            b"Option C",
            ctx
        );
    };
    
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        simple_voting::cast_vote(&mut proposal, 1, ts::ctx(&mut scenario));
        ts::return_shared(proposal);
    };
    
    ts::next_tx(&mut scenario, ALICE);
    {
        assert!(ts::has_most_recent_for_sender<VoteReceipt>(&scenario), 0);
        let receipt = ts::take_from_sender<VoteReceipt>(&scenario);
        ts::return_to_sender(&scenario, receipt);
    };
    
    ts::end(scenario);
}

// ============================================
// Test 9: All Three Options Get Votes
// ============================================
#[test]
fun test_all_options_voted() {
    let mut scenario = ts::begin(ADMIN);
    
    {
        let ctx = ts::ctx(&mut scenario);
        simple_voting::create_proposal(
            b"Three way choice",
            b"A",
            b"B",
            b"C",
            ctx
        );
    };
    
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        simple_voting::cast_vote(&mut proposal, 0, ts::ctx(&mut scenario));
        ts::return_shared(proposal);
    };
    
    ts::next_tx(&mut scenario, BOB);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        simple_voting::cast_vote(&mut proposal, 1, ts::ctx(&mut scenario));
        ts::return_shared(proposal);
    };
    
    ts::next_tx(&mut scenario, CHARLIE);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        simple_voting::cast_vote(&mut proposal, 2, ts::ctx(&mut scenario));
        ts::return_shared(proposal);
    };
    
    ts::next_tx(&mut scenario, ADMIN);
    {
        let proposal = ts::take_shared<VotingProposal>(&scenario);
        
        let vote_counts = simple_voting::get_vote_counts(&proposal);
        assert!(*vector::borrow(&vote_counts, 0) == 1, 0);
        assert!(*vector::borrow(&vote_counts, 1) == 1, 1);
        assert!(*vector::borrow(&vote_counts, 2) == 1, 2);
        assert!(simple_voting::get_total_votes(&proposal) == 3, 3);
        
        ts::return_shared(proposal);
    };
    
    ts::end(scenario);
}

// ============================================
// Test 10: Stress Test - Many Voters
// ============================================
#[test]
fun test_many_voters() {
    let mut scenario = ts::begin(ADMIN);
    
    {
        let ctx = ts::ctx(&mut scenario);
        simple_voting::create_proposal(
            b"Popular vote",
            b"Option 1",
            b"Option 2",
            b"Option 3",
            ctx
        );
    };
    
    let voter1 = @0x1;
    let voter2 = @0x2;
    let voter3 = @0x3;
    let voter4 = @0x4;
    let voter5 = @0x5;
    let voter6 = @0x6;
    let voter7 = @0x7;
    let voter8 = @0x8;
    let voter9 = @0x9;
    let voter10 = @0xA;
    
    ts::next_tx(&mut scenario, voter1);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        simple_voting::cast_vote(&mut proposal, 0, ts::ctx(&mut scenario));
        ts::return_shared(proposal);
    };
    
    ts::next_tx(&mut scenario, voter2);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        simple_voting::cast_vote(&mut proposal, 0, ts::ctx(&mut scenario));
        ts::return_shared(proposal);
    };
    
    ts::next_tx(&mut scenario, voter3);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        simple_voting::cast_vote(&mut proposal, 1, ts::ctx(&mut scenario));
        ts::return_shared(proposal);
    };
    
    ts::next_tx(&mut scenario, voter4);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        simple_voting::cast_vote(&mut proposal, 1, ts::ctx(&mut scenario));
        ts::return_shared(proposal);
    };
    
    ts::next_tx(&mut scenario, voter5);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        simple_voting::cast_vote(&mut proposal, 1, ts::ctx(&mut scenario));
        ts::return_shared(proposal);
    };
    
    ts::next_tx(&mut scenario, voter6);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        simple_voting::cast_vote(&mut proposal, 2, ts::ctx(&mut scenario));
        ts::return_shared(proposal);
    };
    
    ts::next_tx(&mut scenario, voter7);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        simple_voting::cast_vote(&mut proposal, 2, ts::ctx(&mut scenario));
        ts::return_shared(proposal);
    };
    
    ts::next_tx(&mut scenario, voter8);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        simple_voting::cast_vote(&mut proposal, 2, ts::ctx(&mut scenario));
        ts::return_shared(proposal);
    };
    
    ts::next_tx(&mut scenario, voter9);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        simple_voting::cast_vote(&mut proposal, 2, ts::ctx(&mut scenario));
        ts::return_shared(proposal);
    };
    
    ts::next_tx(&mut scenario, voter10);
    {
        let mut proposal = ts::take_shared<VotingProposal>(&scenario);
        simple_voting::cast_vote(&mut proposal, 0, ts::ctx(&mut scenario));
        ts::return_shared(proposal);
    };
    
    ts::next_tx(&mut scenario, ADMIN);
    {
        let proposal = ts::take_shared<VotingProposal>(&scenario);
        
        let vote_counts = simple_voting::get_vote_counts(&proposal);
        assert!(*vector::borrow(&vote_counts, 0) == 3, 0);
        assert!(*vector::borrow(&vote_counts, 1) == 3, 1);
        assert!(*vector::borrow(&vote_counts, 2) == 4, 2);
        assert!(simple_voting::get_total_votes(&proposal) == 10, 3);
        
        ts::return_shared(proposal);
    };
    
    ts::end(scenario);
}