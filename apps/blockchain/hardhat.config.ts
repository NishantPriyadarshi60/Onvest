import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY ?? "",
      polygonAmoy: process.env.POLYGONSCAN_API_KEY ?? "",
    },
  },
  networks: {
    hardhat: {},
    polygon_amoy: {
      url: process.env.POLYGON_AMOY_RPC_URL ?? process.env.POLYGON_RPC_URL ?? "https://rpc-amoy.polygon.technology",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL ?? "https://polygon-rpc.com",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
};

export default config;
