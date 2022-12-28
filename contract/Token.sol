// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// ERC20 address -> 0x6878C0fF3012F45944aae971Eb3E03235bbb7468
contract BOTToken is ERC20 {
    uint initialSupply = 1000;
    constructor() ERC20("Bot", "BOT") {
        _mint(msg.sender, initialSupply);
    }

    function mint(uint _tokens) public{
        _mint(msg.sender, _tokens);
    }
}
