// SPDX-License-Identifier: MIT
pragma solidity >=0.8.23 <0.9.0;

/// @title SemaphoreVerifierKeyPts
/// @notice Minimal storage helper used by the verifier to persist vk points per Merkle depth.
library SemaphoreVerifierKeyPts {
    uint256 internal constant SET_SIZE = 14;

    struct Store {
        mapping(uint256 => uint256[SET_SIZE]) data;
    }

    function set(Store storage store, uint256 depth, uint256[SET_SIZE] calldata values) internal {
        uint256[SET_SIZE] storage slot = store.data[depth];

        unchecked {
            for (uint256 idx = 0; idx < SET_SIZE; ++idx) {
                slot[idx] = values[idx];
            }
        }
    }

    function get(Store storage store, uint256 depth) internal view returns (uint256[SET_SIZE] memory values) {
        uint256[SET_SIZE] storage slot = store.data[depth];

        unchecked {
            for (uint256 idx = 0; idx < SET_SIZE; ++idx) {
                values[idx] = slot[idx];
            }
        }
    }
}
