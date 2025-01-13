"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import type { NextPage } from "next";
import { useAccount, useWalletClient } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import VotingContractData from "~~/public/VotingContract.json";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const ContractABI = VotingContractData.abi;

const VotingPage: NextPage = () => {
  const { address: userAddress } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [votingContract, setVotingContract] = useState<ethers.Contract | null>(null);
  const [votingSessions, setVotingSessions] = useState<any[]>([]);
  const [newSessionDescription, setNewSessionDescription] = useState("");
  const [newCandidates, setNewCandidates] = useState("");

  useEffect(() => {
    if (walletClient) {
      const provider = new ethers.providers.Web3Provider(walletClient as unknown as ethers.providers.ExternalProvider);
      const signer = provider.getSigner();
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, ContractABI, signer);
      setVotingContract(contractInstance);
    }
  }, [walletClient]);

  const loadVotingSessions = async () => {
    if (!votingContract) return;

    const totalSessions = await votingContract.votingSessionCount();
    const sessionsArray = [];

    for (let i = 0; i < totalSessions; i++) {
      try {
        const session = await votingContract.votingSessions(i);
        sessionsArray.push({
          id: i,
          description: session.description,
          startTime: session.startTime.toString(),
          endTime: session.endTime.toString(),
          exists: session.exists,
        });
      } catch (error) {
        console.error(`Error fetching session ${i}:`, error);
      }
    }

    setVotingSessions(sessionsArray);
  };

  const initiateVotingSession = async () => {
    if (!votingContract) {
      console.error("Voting contract not initialized");
      return;
    }

    const candidatesList = newCandidates.split(",").map(candidate => candidate.trim());
    const sessionStart = Math.floor(Date.now() / 1000);
    const sessionEnd = sessionStart + 3600;

    try {
      const transaction = await votingContract.createVotingSession(
        newSessionDescription,
        candidatesList,
        sessionStart,
        sessionEnd,
        { gasLimit: 500000 },
      );
      await transaction.wait();
      alert("Voting session created successfully!");
      setNewSessionDescription("");
      setNewCandidates("");
      loadVotingSessions(); // Reload sessions after creating a new one
    } catch (error) {
      console.error("Error creating voting session:", error);
    }
  };

  const deleteVotingSession = async (sessionId: number) => {
    if (!votingContract) {
      console.error("Voting contract not initialized");
      return;
    }

    try {
      const transaction = await votingContract.deleteVotingSession(sessionId, { gasLimit: 50000 });
      await transaction.wait();
      alert("Voting session deleted successfully!");
      loadVotingSessions(); // Reload sessions after deletion
    } catch (error) {
      console.error("Error deleting voting session:", error);
    }
  };

  return (
    <div className="flex items-center flex-col flex-grow pt-10 bg-gray-100 min-h-screen">
      <div className="px-5">
        <h1 className="text-center text-3xl font-bold mb-4 text-blue-600">Welcome to the Voting System</h1>
        <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row mb-4">
          <p className="my-2 font-medium">Connected Address:</p>
          <Address address={userAddress} />
        </div>
      </div>
      <div className="sessions-list w-full max-w-md mx-auto mb-6">
        <h2 className="text-xl font-semibold mb-2">Existing Voting Sessions</h2>
        {votingSessions.length === 0 && <p>No sessions available.</p>}
        {votingSessions.map(session => (
          <div key={session.id} className="session border rounded-lg shadow-md p-4 mb-2 bg-white">
            <p>
              <strong>Session ID:</strong> {session.id}
            </p>
            <p>
              <strong>Description:</strong> {session.description}
            </p>
            <p>
              <strong>Start Time:</strong> {new Date(parseInt(session.startTime) * 1000).toLocaleString()}
            </p>
            <p>
              <strong>End Time:</strong> {new Date(parseInt(session.endTime) * 1000).toLocaleString()}
            </p>
            <button
              className="btn btn-danger mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
              onClick={() => deleteVotingSession(session.id)}
            >
              Delete Session
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-start bg-base-300 w-full mt-4 px-8 py-12 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold mb-2">Create New Voting Session</h2>
        <input
          type="text"
          placeholder="Session Description"
          className="input mb-2 border rounded p-2 w-full"
          value={newSessionDescription}
          onChange={e => setNewSessionDescription(e.target.value)}
        />
        <input
          type="text"
          placeholder="Candidates (comma separated)"
          className="input mb-2 border rounded p-2 w-full"
          value={newCandidates}
          onChange={e => setNewCandidates(e.target.value)}
        />
        <button
          className="btn btn-primary my-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={initiateVotingSession}
        >
          Create Voting Session
        </button>
        <button
          className="btn btn-secondary my-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={loadVotingSessions}
        >
          Load All Sessions
        </button>
        <button
          className="btn btn-primary my-2 bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => fetchVotingSession(0)}
        >
          Check First Session
        </button>
        <button
          className="btn btn-primary my-2 bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => castVote(1, 0)}
        >
          Vote for Candidate A
        </button>
        <button
          className="btn btn-primary my-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => castVote(1, 1)}
        >
          Vote for Candidate B
        </button>
        <button
          onClick={() => changeOwnership("0xe848F62De65caFB93D36205E206A08c4db7EcEbE")}
          className="btn btn-primary my-2 bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
        >
          Transfer Ownership
        </button>
      </div>
    </div>
  );
};

export default VotingPage;
