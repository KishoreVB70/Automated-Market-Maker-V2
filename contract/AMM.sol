// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// AMM contract address -> 0xb2f00B750B152E7E8152DFbA7CE66ba6A3BB5582
// ERC20 address -> 0x6878C0fF3012F45944aae971Eb3E03235bbb7468

/*
 Todo
 1. Find how to get the return value of normal function
 2. Convert liq token value to another unit rather than wei
 3. Add event code to obs
*/

contract AMM is ERC20{
    ERC20 token;
    address public tokenAddress;
    uint tokenReserve;

    constructor(address _token) ERC20("Lp token", "LP"){
        tokenAddress = _token;
        token = ERC20(tokenAddress);
    }

    event liquidityAdded(uint lpToken);
    event liquidityRemoved(uint tokenAmount, uint ethAmount);
    event ethToToken(uint TokenAmount);
    event tokenToEth(uint ethAmount);

    // Here the function of liquidity is simply the eth contributed f(x,y) = y
    function addLiquidity(uint _amount) external payable {
        require(msg.value > 0, "must send ether");
        require(_amount > 0, "should provide amount");

        uint _liquidity;
        uint totalEth = address(this).balance;
        uint ethBalance = totalEth - msg.value;

        uint tokenBalance = token.balanceOf(address(this));
        uint lpBalance = totalSupply();

        if(tokenBalance == 0){
            token.transferFrom(msg.sender,address(this), _amount);
            _liquidity = msg.value;
            _mint(msg.sender, _liquidity);
        }else{
            uint tokenAmount;
            //dy = dx*y / x

            // tokenAmount = (msg.value * tokenBalance) / ethBalance;
            tokenAmount = getTokenForAddingLiquidity(msg.value);

            token.transferFrom(msg.sender, address(this), tokenAmount);

            //ds = dx*s/x
            _liquidity = (msg.value * lpBalance) / ethBalance;
            _mint(msg.sender, _liquidity);
        }
        emit liquidityAdded(_liquidity);
    }

    function getTokenForAddingLiquidity(uint _wei) public view returns(uint){
        uint amountOfToken =  (_wei * token.balanceOf(address(this))) / address(this).balance;
        return amountOfToken;
    }

    function getTokenBalance() external view returns(uint){
        uint value = token.balanceOf(address(this));
        return value;
    }

    // Based on the amount of LP tokens the user is willing to burn, he'll get the token and ether
    function removeLiquidity(uint lpAmount) external {
        uint ethBalance = address(this).balance;
        uint tokenBalance = token.balanceOf(address(this));
        uint lpBalance = totalSupply();
        uint weiAmount;
        uint tokenAmount;

        //dx = ds*x /s         
        weiAmount =  (lpAmount * ethBalance) / lpBalance;

        //dy = ds*y /s 
        tokenAmount = (lpAmount * tokenBalance) / lpBalance;

        _burn(msg.sender,lpAmount);

        payable(msg.sender).transfer(weiAmount);
        token.transfer(msg.sender, tokenAmount);

        emit liquidityRemoved(tokenAmount, weiAmount);
    }

    function etherToToken() external payable {
        require(msg.value > 0, "must send some ether");

        uint totalEth = address(this).balance;
        uint ethBalance = totalEth - msg.value;
        uint tokenBalance = token.balanceOf(address(this));

        uint amountToGive = calculateDY(msg.value, ethBalance, tokenBalance);
        token.transfer(msg.sender, amountToGive);

        emit ethToToken(amountToGive);
    }

    function tokenToEther(uint _token) external {
        require(_token > 0, "must send some token");

        uint ethBalance = address(this).balance;
        uint tokenBalance = token.balanceOf(address(this));

        uint amountToGive = calculateDY(_token, tokenBalance, ethBalance);
        token.transferFrom(msg.sender, address(this), _token );
        payable(msg.sender).transfer(amountToGive);

        emit tokenToEth(amountToGive);
    }

    function calculateDY(uint dx, uint x, uint y ) internal pure returns(uint){
        uint dy;
        // deducting 1% fees from input -> dx = dx - 1% of dx
        // Simplify -> dx99/100
        // Substitute in dy equation

        dy = ((dx * 99) * y) / ( (dx *99) + (x * 100) );
        return dy;
    }
    
}
