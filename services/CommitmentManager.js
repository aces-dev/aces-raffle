const CryptoService = require('../core/CryptoService');
const DatabaseService = require('./DatabaseService');


class CommitmentManager {
    constructor() {
        this.cryptoService = new CryptoService();
        this.dbService = new DatabaseService();
    }

    async createPreCommitment(raffleUuid) {
        try {
            const masterSeed = this.cryptoService.generateSecureRandom(32);
            const nonce = this.cryptoService.generateSecureRandom(16);
            const raffleSeed = this.cryptoService.generateRaffleSeed(masterSeed, raffleUuid, nonce);
            const commitmentHash = this.cryptoService.sha256(raffleSeed);

            await this.dbService.storeCommitment(raffleUuid, commitmentHash);

            await this.dbService.storeSecrets(raffleUuid, {
                master_seed: masterSeed,
                nonce: nonce,
                raffle_seed: raffleSeed
            });

            console.log(`Pre-commitment created for raffle ${raffleUuid}`);
            return {
                success: true,
                commitment_hash: commitmentHash
            };

        } catch (error) {
            console.error('Error creating pre-commitment:', error);
            throw error;
        }
    }

    /**
     * Reveal secrets for public verification
     */
    async revealSecrets(raffleUuid) {
        try {
            const secrets = await this.dbService.getSecrets(raffleUuid);
            
            await this.dbService.revealSecrets(raffleUuid, secrets);
            console.log(`Secrets revealed for raffle ${raffleUuid}`);

            return {
                master_seed: secrets.master_seed,
                nonce: secrets.nonce,
                raffle_seed: secrets.raffle_seed
            };

        } catch (error) {
            console.error('Error revealing secrets:', error);
            throw error;
        }
    }
}

module.exports = CommitmentManager;