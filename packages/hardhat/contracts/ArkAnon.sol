// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ISemaphore } from "./interfaces/ISemaphore.sol";

contract Whisp {
    ISemaphore public immutable semaphore;

    // Full on-chain storage including metadata
    struct GroupInfo {
        uint256 groupId;        // Semaphore group ID
        address creator;        // Group creator
        uint64  createdAt;      // Creation timestamp
        bool    exists;         // Existence flag
        string  name;           // Group name
        string  description;    // Group description
        string  imageUrl;       // Optional group image URL
        string  category;       // Group category
    }

    uint256 public nextGroupIndex;
    mapping(uint256 => GroupInfo) public groups;
    mapping(uint256 => mapping(address => bool)) public hasJoined;
    mapping(uint256 => mapping(uint256 => bool)) public nullifierUsed;

    /// @notice Emitted when a new group is created (indexed by Arkiv)
    /// @dev All metadata stored in event for off-chain indexing
    event GroupCreated(
        uint256 indexed registryId,
        uint256 indexed groupId,
        address indexed creator,
        string name,
        string description,
        string imageUrl,        // Optional group image
        string category,        // Optional category for filtering
        uint64 createdAt
    );

    /// @notice Emitted when a member joins a group
    event MemberJoined(
        uint256 indexed registryId,
        uint256 indexed groupId,
        address indexed member,
        uint256 commitment,
        uint64 joinedAt
    );

    /// @notice Emitted after a valid anonymous signal
    /// @dev `signalHash` = hash(message) proven in-circuit; `scopeHash` = hash(scope) proven in-circuit
    event SignalSent(
        uint256 indexed registryId,
        uint256 indexed groupId,
        uint256 signalHash,
        uint256 scopeHash,
        uint256 nullifier,
        uint64 timestamp
    );

    constructor(address semaphore_) {
        semaphore = ISemaphore(semaphore_);
    }

    /// @notice Create a new anonymous group
    /// @param name Group name
    /// @param description Group description
    /// @param imageUrl Optional image URL for the group
    /// @param category Optional category for filtering (e.g., "DAO", "Social", "Vote")
    function createGroup(
        string calldata name,
        string calldata description,
        string calldata imageUrl,
        string calldata category
    ) external returns (uint256 registryId) {
        uint256 groupId = semaphore.createGroup();
        registryId = nextGroupIndex++;
        
        uint64 timestamp = uint64(block.timestamp);
        
        groups[registryId] = GroupInfo({
            groupId: groupId,
            creator: msg.sender,
            createdAt: timestamp,
            exists: true,
            name: name,
            description: description,
            imageUrl: imageUrl,
            category: category
        });

        emit GroupCreated(
            registryId,
            groupId,
            msg.sender,
            name,
            description,
            imageUrl,
            category,
            timestamp
        );
    }

    /// @notice Join an existing group with your identity commitment
    function joinGroup(uint256 registryId, uint256 identityCommitment) external {
        GroupInfo memory g = groups[registryId];
        require(g.exists, "Group not found");
        require(!hasJoined[registryId][msg.sender], "Already joined");
        
        semaphore.addMember(g.groupId, identityCommitment);
        hasJoined[registryId][msg.sender] = true;
        
        emit MemberJoined(
            registryId,
            g.groupId,
            msg.sender,
            identityCommitment,
            uint64(block.timestamp)
        );
    }

    /// @notice Validate a Semaphore proof and emit an anonymous signal
    /// @dev Frontend generates proof with `generateProof(identity, group, message, scope)`
    function validateSignal(uint256 registryId, ISemaphore.SemaphoreProof calldata proof) external {
        GroupInfo memory g = groups[registryId];
        require(g.exists, "Group not found");
        require(!nullifierUsed[registryId][proof.nullifier], "Nullifier already used");

        // Verify the zero-knowledge proof
        semaphore.validateProof(g.groupId, proof);

        nullifierUsed[registryId][proof.nullifier] = true;

        // Recompute the field-hashes exactly like Semaphore does
        uint256 signalHash = uint256(keccak256(abi.encodePacked(proof.message))) >> 8;
        uint256 scopeHash  = uint256(keccak256(abi.encodePacked(proof.scope)))   >> 8;

        emit SignalSent(
            registryId,
            g.groupId,
            signalHash,
            scopeHash,
            proof.nullifier,
            uint64(block.timestamp)
        );
    }

    /// @notice Check if an address has joined a specific group
    function isMember(uint256 registryId, address user) external view returns (bool) {
        return hasJoined[registryId][user];
    }

    /// @notice Get group info by registry ID
    function getGroupInfo(uint256 registryId) external view returns (GroupInfo memory) {
        return groups[registryId];
    }
}