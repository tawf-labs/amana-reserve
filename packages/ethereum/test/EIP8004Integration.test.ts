import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentIdentityRegistry, AgentReputationRegistry, AgentValidationRegistry } from "../typechain-types";

describe("EIP-8004 Agent Infrastructure", function () {
  let identityRegistry: AgentIdentityRegistry;
  let reputationRegistry: AgentReputationRegistry;
  let validationRegistry: AgentValidationRegistry;
  let owner: any, user1: any, user2: any, validator: any, shariaBoard: any;

  beforeEach(async function () {
    [owner, user1, user2, validator, shariaBoard] = await ethers.getSigners();

    // Deploy Identity Registry
    const IdentityRegistry = await ethers.getContractFactory("AgentIdentityRegistry");
    identityRegistry = await IdentityRegistry.deploy();
    await identityRegistry.waitForDeployment();

    // Grant Sharia Board role
    const SHARIA_BOARD_ROLE = await identityRegistry.SHARIA_BOARD_ROLE();
    await identityRegistry.grantRole(SHARIA_BOARD_ROLE, shariaBoard.address);

    // Deploy Reputation Registry
    const ReputationRegistry = await ethers.getContractFactory("AgentReputationRegistry");
    reputationRegistry = await ReputationRegistry.deploy(await identityRegistry.getAddress());
    await reputationRegistry.waitForDeployment();

    // Deploy Validation Registry
    const ValidationRegistry = await ethers.getContractFactory("AgentValidationRegistry");
    validationRegistry = await ValidationRegistry.deploy(await identityRegistry.getAddress());
    await validationRegistry.waitForDeployment();
  });

  describe("Agent Identity Registry", function () {
    it("Should register a Sharia-compliant agent", async function () {
      const agentURI = "https://example.com/agent.json";
      const complianceProofs = [ethers.keccak256(ethers.toUtf8Bytes("halal-compliant"))];

      const tx = await identityRegistry.connect(user1).registerShariaCompliantAgent(
        agentURI,
        complianceProofs
      );

      const receipt = await tx.wait();
      const agentId = 1; // First agent

      expect(await identityRegistry.ownerOf(agentId)).to.equal(user1.address);
      expect(await identityRegistry.shariaCompliant(agentId)).to.be.true;
      expect(await identityRegistry.tokenURI(agentId)).to.equal(agentURI);
    });

    it("Should set and verify agent wallet", async function () {
      const agentURI = "https://example.com/agent.json";
      const complianceProofs = [ethers.keccak256(ethers.toUtf8Bytes("halal-compliant"))];

      await identityRegistry.connect(user1).registerShariaCompliantAgent(agentURI, complianceProofs);
      const agentId = 1;

      // Create signature for new wallet
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour
      const domain = {
        name: "AgentIdentityRegistry",
        version: "1",
        chainId: await ethers.provider.getNetwork().then(n => n.chainId),
        verifyingContract: await identityRegistry.getAddress()
      };

      const types = {
        SetAgentWallet: [
          { name: "agentId", type: "uint256" },
          { name: "newWallet", type: "address" },
          { name: "deadline", type: "uint256" }
        ]
      };

      const signature = await user2.signTypedData(domain, types, {
        agentId,
        newWallet: user2.address,
        deadline
      });

      await identityRegistry.connect(user1).setAgentWallet(agentId, user2.address, deadline, signature);
      expect(await identityRegistry.getAgentWallet(agentId)).to.equal(user2.address);
    });

    it("Should flag non-compliant agent", async function () {
      const agentURI = "https://example.com/agent.json";
      const complianceProofs = [ethers.keccak256(ethers.toUtf8Bytes("halal-compliant"))];

      await identityRegistry.connect(user1).registerShariaCompliantAgent(agentURI, complianceProofs);
      const agentId = 1;

      await identityRegistry.connect(shariaBoard).flagNonCompliant(agentId);
      expect(await identityRegistry.shariaCompliant(agentId)).to.be.false;
    });
  });

  describe("Agent Reputation Registry", function () {
    let agentId: number;

    beforeEach(async function () {
      const agentURI = "https://example.com/agent.json";
      const complianceProofs = [ethers.keccak256(ethers.toUtf8Bytes("halal-compliant"))];
      
      await identityRegistry.connect(user1).registerShariaCompliantAgent(agentURI, complianceProofs);
      agentId = 1;
    });

    it("Should give feedback to agent", async function () {
      await reputationRegistry.connect(user2).giveFeedback(
        agentId,
        85, // 85/100 rating
        0,  // 0 decimals
        "capital-deployment",
        "halal-compliant",
        "https://agent.example.com/deploy",
        "https://example.com/feedback.json",
        ethers.ZeroHash
      );

      const [value, decimals, tag1, tag2, isRevoked] = await reputationRegistry.readFeedback(
        agentId,
        user2.address,
        1
      );

      expect(value).to.equal(85);
      expect(tag1).to.equal("capital-deployment");
      expect(isRevoked).to.be.false;
    });

    it("Should give Sharia-compliant feedback", async function () {
      const haiScoreHash = ethers.keccak256(ethers.toUtf8Bytes("hai-score-proof"));

      await reputationRegistry.connect(user2).giveShariaCompliantFeedback(
        agentId,
        90,
        0,
        "agriculture",
        "fully-compliant",
        haiScoreHash
      );

      const [value, , tag1, tag2] = await reputationRegistry.readFeedback(
        agentId,
        user2.address,
        1
      );

      expect(value).to.equal(90);
      expect(tag1).to.equal("agriculture");
      expect(tag2).to.equal("fully-compliant");
    });

    it("Should get reputation summary", async function () {
      // Give multiple feedback
      await reputationRegistry.connect(user2).giveFeedback(agentId, 85, 0, "test", "", "", "", ethers.ZeroHash);
      await reputationRegistry.connect(owner).giveFeedback(agentId, 90, 0, "test", "", "", "", ethers.ZeroHash);

      const [count, averageValue, decimals] = await reputationRegistry.getSummary(
        agentId,
        [user2.address, owner.address],
        "",
        ""
      );

      expect(count).to.equal(2);
      expect(averageValue).to.equal(87); // (85 + 90) / 2
    });
  });

  describe("Agent Validation Registry", function () {
    let agentId: number;

    beforeEach(async function () {
      const agentURI = "https://example.com/agent.json";
      const complianceProofs = [ethers.keccak256(ethers.toUtf8Bytes("halal-compliant"))];
      
      await identityRegistry.connect(user1).registerShariaCompliantAgent(agentURI, complianceProofs);
      agentId = 1;
    });

    it("Should request and respond to validation", async function () {
      const requestURI = "https://example.com/validation-request.json";
      const requestHash = ethers.keccak256(ethers.toUtf8Bytes("validation-001"));

      // Request validation
      await validationRegistry.connect(user1).validationRequest(
        validator.address,
        agentId,
        requestURI,
        requestHash
      );

      // Validator responds
      await validationRegistry.connect(validator).validationResponse(
        requestHash,
        95, // 95% validation score
        "https://example.com/validation-response.json",
        ethers.keccak256(ethers.toUtf8Bytes("response-data")),
        "halal-verified"
      );

      const [validatorAddr, agentIdReturned, response, , tag] = await validationRegistry.getValidationStatus(requestHash);

      expect(validatorAddr).to.equal(validator.address);
      expect(agentIdReturned).to.equal(agentId);
      expect(response).to.equal(95);
      expect(tag).to.equal("halal-verified");
    });

    it("Should get validation summary", async function () {
      const requestHash1 = ethers.keccak256(ethers.toUtf8Bytes("validation-001"));
      const requestHash2 = ethers.keccak256(ethers.toUtf8Bytes("validation-002"));

      // Multiple validations
      await validationRegistry.connect(user1).validationRequest(validator.address, agentId, "", requestHash1);
      await validationRegistry.connect(user1).validationRequest(validator.address, agentId, "", requestHash2);

      await validationRegistry.connect(validator).validationResponse(requestHash1, 90, "", ethers.ZeroHash, "");
      await validationRegistry.connect(validator).validationResponse(requestHash2, 95, "", ethers.ZeroHash, "");

      const [count, averageResponse] = await validationRegistry.getSummary(
        agentId,
        [validator.address],
        ""
      );

      expect(count).to.equal(2);
      expect(averageResponse).to.equal(92); // (90 + 95) / 2
    });
  });
});
