// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Mock USDC token for testing purposes
 * @dev Implements a simple ERC20 with 6 decimals (like real USDC)
 */
contract MockUSDC is ERC20 {
    uint8 private constant DECIMALS = 6;

    constructor() ERC20("USD Coin", "USDC") {
        // Mint 1 million USDC for testing
        _mint(msg.sender, 1_000_000 * 10**DECIMALS);
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @notice Faucet function for testing - anyone can mint tokens
     * @param amount Amount of USDC to mint (in base units, i.e., 1000000 = 1 USDC)
     */
    function mint(uint256 amount) public {
        _mint(msg.sender, amount);
    }

    /**
     * @notice Convenience function to mint USDC in dollar amounts
     * @param dollarAmount Amount in dollars (e.g., 100 for $100)
     */
    function mintDollars(uint256 dollarAmount) public {
        _mint(msg.sender, dollarAmount * 10**DECIMALS);
    }
}
