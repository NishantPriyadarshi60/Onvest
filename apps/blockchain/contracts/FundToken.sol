// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * Minimal compliance token for Phase 1.
 * Simplified ERC-3643 style: transfers require both from and to to be whitelisted.
 * Full ERC-3643 T-REX integration is a Phase 2 upgrade.
 */
contract FundToken is ERC20, Ownable {
    mapping(address => bool) public isWhitelisted;

    constructor(
        string memory name_,
        string memory symbol_,
        address initialOwner_
    ) ERC20(name_, symbol_) Ownable(initialOwner_) {
        isWhitelisted[initialOwner_] = true;
        _mint(initialOwner_, 1_000_000 * 10 ** decimals());
    }

    function addToWhitelist(address account) external onlyOwner {
        isWhitelisted[account] = true;
    }

    function removeFromWhitelist(address account) external onlyOwner {
        isWhitelisted[account] = false;
    }

    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0) && !isWhitelisted[from]) {
            revert("FundToken: from not whitelisted");
        }
        if (to != address(0) && !isWhitelisted[to]) {
            revert("FundToken: to not whitelisted");
        }
        super._update(from, to, value);
    }
}
