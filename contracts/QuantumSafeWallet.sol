// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title QuantumSafeWallet
/// @notice Manages hybrid (classical + post-quantum) account metadata and migration state.
/// @dev This is a state and policy contract; PQ signature verification will be handled off-chain in v1.
contract QuantumSafeWallet {
    enum Mode {
        CLASSICAL_ONLY,
        HYBRID,
        PQ_ONLY
    }

    struct Account {
        address owner;       // ECDSA/Ethereum address
        bytes pqPublicKey;   // Post-quantum public key (Dilithium/Falcon/SPHINCS+), encoded as bytes
        Mode mode;           // Current security mode
        bool exists;         // Tracks whether account is initialized
    }

    mapping(address => Account) private accounts;

    event AccountRegistered(address indexed owner, bytes pqPublicKey, Mode mode);
    event AccountModeChanged(address indexed owner, Mode oldMode, Mode newMode);
    event PqPublicKeyUpdated(address indexed owner, bytes oldKey, bytes newKey);

    modifier onlyAccountOwner(address _owner) {
        require(accounts[_owner].exists, "Account does not exist");
        require(msg.sender == _owner, "Not account owner");
        _;
    }

    /// @notice Register a hybrid account with both classical & PQ metadata.
    /// @dev If an account already exists, this will update the PQ key and set mode to HYBRID.
    ///      In a real system, PQ key would be generated off-chain and passed here.
    function registerAccount(bytes calldata _pqPublicKey) public {
        Account storage acc = accounts[msg.sender];

        if (!acc.exists) {
            // New account
            acc.owner = msg.sender;
            acc.pqPublicKey = _pqPublicKey;
            acc.mode = Mode.HYBRID;
            acc.exists = true;

            emit AccountRegistered(msg.sender, _pqPublicKey, Mode.HYBRID);
        } else {
            // Existing account -> update PQ key and set HYBRID mode
            bytes memory oldKey = acc.pqPublicKey;
            acc.pqPublicKey = _pqPublicKey;

            if (acc.mode == Mode.CLASSICAL_ONLY) {
                Mode oldMode = acc.mode;
                acc.mode = Mode.HYBRID;
                emit AccountModeChanged(msg.sender, oldMode, Mode.HYBRID);
            }

            emit PqPublicKeyUpdated(msg.sender, oldKey, _pqPublicKey);
        }
    }

    /// @notice Explicit migration helper to HYBRID mode with PQ key.
    function migrateToHybrid(bytes calldata _pqPublicKey) external {
        // now valid because registerAccount is public
        registerAccount(_pqPublicKey);
    }

    /// @notice Change account mode (CLASSICAL_ONLY, HYBRID, PQ_ONLY).
    /// @dev For demo, we allow free switching by owner; in a real deployment, there may be rules/timelocks.
    function setMode(Mode _newMode) external onlyAccountOwner(msg.sender) {
        Account storage acc = accounts[msg.sender];
        Mode oldMode = acc.mode;

        // If moving to PQ_ONLY, ensure we actually have a PQ key set
        if (_newMode == Mode.PQ_ONLY) {
            require(acc.pqPublicKey.length > 0, "PQ key not set");
        }

        acc.mode = _newMode;
        emit AccountModeChanged(msg.sender, oldMode, _newMode);
    }

    /// @notice View account information for a given owner.
    function getAccount(address _owner)
        external
        view
        returns (
            address owner,
            bytes memory pqPublicKey,
            Mode mode,
            bool exists
        )
    {
        Account storage acc = accounts[_owner];
        return (acc.owner, acc.pqPublicKey, acc.mode, acc.exists);
    }

    /// @notice Convenience function: returns the mode of msg.sender.
    function myMode() external view returns (Mode) {
        if (!accounts[msg.sender].exists) {
            return Mode.CLASSICAL_ONLY;
        }
        return accounts[msg.sender].mode;
    }
}
