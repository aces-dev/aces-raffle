const CommitmentManager = require('./services/CommitmentManager');
const RaffleExecutor = require('./services/RaffleExecutor');
const VerificationService = require('./services/VerificationService');
const DatabaseService = require('./services/DatabaseService');


class RaffleRNGSystem {
    constructor() {
        this.commitmentManager = new CommitmentManager();
        this.raffleExecutor = new RaffleExecutor();
        this.verificationService = new VerificationService();
        this.dbService = new DatabaseService();
    }

    async createPreCommitment(raffleUuid) {
        return await this.commitmentManager.createPreCommitment(raffleUuid);
    }

    async executeRaffle(raffleUuid, numberOfWinners = 1) {
        return await this.raffleExecutor.executeRaffle(raffleUuid, numberOfWinners);
    }

    async revealSecrets(raffleUuid) {
        return await this.commitmentManager.revealSecrets(raffleUuid);
    }

    async verifyRaffle(raffleUuid) {
        return await this.verificationService.verifyRaffle(raffleUuid);
    }

    async getRaffleTickets(raffleUid) {
        return await this.dbService.getRaffleTickets(raffleUid);
    }

    async executePhase(phase, raffleUuid, numberOfWinners = 1) {
        const phases = {
            1: () => this._handlePreCommitment(raffleUuid),
            2: () => this.executeRaffle(raffleUuid, numberOfWinners),
            3: () => this.revealSecrets(raffleUuid),
            4: () => this.verifyRaffle(raffleUuid)
        };

        if (!phases[phase]) throw new Error(`Invalid phase: ${phase}`);
        return await phases[phase]();
    }

    async executeWorkflow(raffleUuid, numberOfWinners = 1) {
        const results = {};
        for (let phase = 1; phase <= 4; phase++) {
            results[phase] = await this.executePhase(phase, raffleUuid, numberOfWinners);
        }
        return results;
    }

    async _handlePreCommitment(raffleUuid) {
        const raffle = await this.dbService.getRaffle(raffleUuid);
        return raffle.rng_commitment 
            ? { exists: true } 
            : await this.createPreCommitment(raffleUuid);
    }
}

module.exports = RaffleRNGSystem;