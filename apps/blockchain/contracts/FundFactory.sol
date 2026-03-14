// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FundToken} from "./FundToken.sol";

contract FundFactory {
    event FundDeployed(address indexed tokenAddress, string name, address indexed owner);

    mapping(address => bool) public deployedTokens;

    function deployFund(
        string memory name,
        string memory symbol,
        address initialOwner
    ) external returns (address) {
        FundToken token = new FundToken(name, symbol, initialOwner);
        address tokenAddress = address(token);
        deployedTokens[tokenAddress] = true;
        emit FundDeployed(tokenAddress, name, initialOwner);
        return tokenAddress;
    }
}
