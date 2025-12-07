// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title QuantumRandomLottery
/// @notice Simple lottery that uses externally provided randomness (e.g. QRNG)
///         to select a winner in a provable, transparent way.
contract QuantumRandomLottery {
    struct Round {
        uint256 id;
        address[] participants;
        address winner;
        bytes32 randomness;
        uint256 timestamp;
        bool settled;
    }

    mapping(uint256 => Round) public rounds;
    uint256 public currentRoundId;
    address public admin;
    uint256 public ticketPrice; // optional: you can ignore ETH if you want

    event RoundStarted(uint256 indexed roundId);
    event TicketPurchased(uint256 indexed roundId, address indexed player);
    event RandomnessRequested(uint256 indexed roundId);
    event RoundSettled(uint256 indexed roundId, address indexed winner, bytes32 randomness);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor(uint256 _ticketPrice) {
        admin = msg.sender;
        ticketPrice = _ticketPrice;
        _startNewRound(); // start round 0
    }

    /// @notice Starts a new lottery round
    function _startNewRound() internal {
        Round storage r = rounds[currentRoundId];
        r.id = currentRoundId;
        r.timestamp = block.timestamp;
        emit RoundStarted(currentRoundId);
    }

    /// @notice Buy a ticket in the current round
    function buyTicket() external payable {
        // optional: enforce ticket price
        if (ticketPrice > 0) {
            require(msg.value == ticketPrice, "Incorrect ticket price");
        }

        Round storage r = rounds[currentRoundId];
        require(!r.settled, "Round already settled");

        r.participants.push(msg.sender);
        emit TicketPurchased(currentRoundId, msg.sender);
    }

    /// @notice Signal that off-chain randomness will be requested
    function requestRandomness() external onlyAdmin {
        Round storage r = rounds[currentRoundId];
        require(!r.settled, "Round already settled");
        require(r.participants.length > 0, "No participants");
        emit RandomnessRequested(currentRoundId);
    }

    /// @notice Called by admin (acting as oracle) with 32-byte random value
    function fulfillRandomness(bytes32 _randomness) external onlyAdmin {
        Round storage r = rounds[currentRoundId];
        require(!r.settled, "Round already settled");
        require(r.participants.length > 0, "No participants");

        r.randomness = _randomness;
        uint256 winnerIndex = uint256(_randomness) % r.participants.length;
        address winner = r.participants[winnerIndex];
        r.winner = winner;
        r.settled = true;

        emit RoundSettled(currentRoundId, winner, _randomness);

        // Optional: pay out the pot to winner
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool sent, ) = winner.call{value: balance}("");
            require(sent, "Payout failed");
        }

        // move to next round
        currentRoundId += 1;
        _startNewRound();
    }

    /// @notice Get participants for a given round (for UI)
    function getParticipants(uint256 roundId) external view returns (address[] memory) {
        return rounds[roundId].participants;
    }
}
