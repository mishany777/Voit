import { expect } from "chai";
import { ethers } from "hardhat";
import { ElectionManager } from "../typechain-types";

describe("ElectionManager", function () {
  let electionManager: ElectionManager;
  let owner: any;
  let voter: any;

  before(async () => {
    const ElectionManagerFactory = await ethers.getContractFactory("ElectionManager");
    electionManager = (await ElectionManagerFactory.deploy()) as ElectionManager;
    [owner, voter] = await ethers.getSigners(); // Получаем адреса владельца и голосующего
  });

  describe("Deployment", function () {
    it("Should set the owner correctly", async function () {
      expect(await electionManager.getAdministrator()).to.equal(owner.address);
    });
  });

  describe("Voting Sessions", function () {
    it("Should allow the owner to create a voting session", async function () {
      const description = "Test Voting Session";
      const candidates = ["Alice", "Bob"];
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600;

      await electionManager.createPoll(description, candidates, startTime, endTime);

      const session = await electionManager.polls(0);
      expect(session.title).to.equal(description);
      expect(session.startTimestamp).to.equal(BigInt(startTime));
      expect(session.endTimestamp).to.equal(BigInt(endTime));
      expect(session.isActive).to.equal(true);
    });

    it("Should allow a user to vote during an active session", async function () {
      const description = "Another Voting Session";
      const candidates = ["Charlie", "Dave"];
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600;

      await electionManager.createPoll(description, candidates, startTime, endTime);

      await electionManager.connect(voter).castVote(1, 0); // В voter голосует за Charlie

      const results = await electionManager.getPollResults(1);
      expect(results[0][0]).to.equal("Charlie");
      expect(results[1][0]).to.equal(BigInt(1));
    });

    it("Should prevent voting outside the voting period", async function () {
      const description = "Expired Session";
      const candidates = ["Eve"];
      const endTime = Math.floor(Date.now() / 1000) - 10; // Устанавливаем время окончания в прошлом

      await electionManager.createPoll(description, candidates, endTime - 3600, endTime);

      // Ожидаем, что транзакция будет отклонена с правильным сообщением
      await expect(electionManager.castVote(2, 0)).to.be.revertedWith("Poll is not currently active");
    });

    it("Should return correct results after voting", async function () {
      const results = await electionManager.getPollResults(1); // Получаем результаты предыдущей сессии

      const [names, votes] = results;
      expect(names[0]).to.equal("Charlie");
      expect(votes[0]).to.equal(BigInt(1));
      expect(names[1]).to.equal("Dave");
      expect(votes[1]).to.equal(BigInt(0));
    });

    it("Should allow the administrator to change ownership", async function () {
      await electionManager.changeAdministrator(voter.address); // Изменяем администратора на voter
      expect(await electionManager.getAdministrator()).to.equal(voter.address);
    });
  });
});
