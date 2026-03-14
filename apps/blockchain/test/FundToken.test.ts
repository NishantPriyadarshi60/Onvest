import { expect } from "chai";
import { ethers } from "hardhat";

describe("FundToken", function () {
  it("deploy token, add address to whitelist, transfer succeeds", async function () {
    const [owner, alice, bob] = await ethers.getSigners();

    const FundToken = await ethers.getContractFactory("FundToken");
    const token = await FundToken.deploy("Test Fund", "TFT", owner.address);

    expect(await token.isWhitelisted(owner.address)).to.be.true;
    expect(await token.isWhitelisted(alice.address)).to.be.false;

    await token.addToWhitelist(alice.address);
    await token.addToWhitelist(bob.address);

    const amount = ethers.parseEther("100");
    await token.transfer(alice.address, amount);

    expect(await token.balanceOf(alice.address)).to.equal(amount);
  });

  it("transfer to non-whitelisted address reverts", async function () {
    const [owner, alice, bob] = await ethers.getSigners();

    const FundToken = await ethers.getContractFactory("FundToken");
    const token = await FundToken.deploy("Test Fund", "TFT", owner.address);

    await token.addToWhitelist(alice.address);
    await token.transfer(alice.address, ethers.parseEther("100"));

    await expect(
      token.connect(alice).transfer(bob.address, ethers.parseEther("10"))
    ).to.be.reverted;
  });

  it("removeFromWhitelist prevents future transfers", async function () {
    const [owner, alice] = await ethers.getSigners();

    const FundToken = await ethers.getContractFactory("FundToken");
    const token = await FundToken.deploy("Test Fund", "TFT", owner.address);

    await token.addToWhitelist(alice.address);
    await token.transfer(alice.address, ethers.parseEther("50"));

    await token.removeFromWhitelist(alice.address);

    await expect(
      token.connect(alice).transfer(owner.address, ethers.parseEther("10"))
    ).to.be.reverted;
  });
});
