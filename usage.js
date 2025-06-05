const RaffleRNGSystem = require('./RaffleRNGSystem');


const RafflePhase = {
  PreCommitment: 1,
  Execute: 2,
  RevealSecrets: 3,
  Verify: 4
};

const raffleSystem = new RaffleRNGSystem();
const raffleId = 'raffle-abc-123';

// Run individual phases
await raffleSystem.executePhase(RafflePhase.PreCommitment, raffleId);
await raffleSystem.executePhase(RafflePhase.Execute, raffleId, 3); // Execute with 3 winners
await raffleSystem.executePhase(RafflePhase.RevealSecrets, raffleId);
await raffleSystem.executePhase(RafflePhase.Verify, raffleId);

// Run complete workflow
const results = await raffleSystem.executeWorkflow(raffleId, 5);
console.log(results);

// Verification only
const verification = await raffleSystem.executePhase(4, raffleId);
console.log(verification.verified); // -> true/false