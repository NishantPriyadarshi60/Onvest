import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying FundFactory with account:", deployer.address);

  const FundFactory = await ethers.getContractFactory("FundFactory");
  const factory = await FundFactory.deploy();

  await factory.waitForDeployment();
  const address = await factory.getAddress();
  console.log("FundFactory deployed to:", address);

  const network = (await ethers.provider.getNetwork()).name;
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  const filePath = path.join(deploymentsDir, `${network}.json`);
  const data: Record<string, unknown> = fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath, "utf8"))
    : {};
  data.FundFactory = address;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log("Saved to", filePath);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
