const CryptoService = require('../core/CryptoService');
const DatabaseService = require('./DatabaseService');


class VerificationService {
    constructor() {
        this.cryptoService = new CryptoService();
        this.dbService = new DatabaseService();
    }

    /**
     * Verify commitment hash against revealed secrets
     */
    verifyCommitment(commitment, raffleUuid) {
        const expectedRaffleSeed = this.cryptoService.generateRaffleSeed(
            commitment.master_seed,
            raffleUuid,
            commitment.nonce
        );

        if (expectedRaffleSeed !== commitment.raffle_seed) {
            return { verified: false, error: 'Raffle seed verification failed' };
        }

        const expectedCommitmentHash = this.cryptoService.sha256(commitment.raffle_seed);
        if (expectedCommitmentHash !== commitment.commitment_hash) {
            return { verified: false, error: 'Commitment hash verification failed' };
        }

        return { verified: true };
    }

    /**
     * Regenerate winners using revealed secrets
     * @param {string} raffleSeed 
     * @param {Array} tickets
     * @param {number} hashesUsed - Number of hashes used in original execution
     * @param {number} numberOfWinners
     * @returns {Array} Array of verified winners
     */
    regenerateWinners(raffleSeed, tickets, hashesUsed, numberOfWinners) {
        const hashChain = this.cryptoService.generateHashChain(raffleSeed, hashesUsed);
        const verifiedWinners = [];
        const selectedIndices = new Set();
        let hashIndex = 0;

        while (verifiedWinners.length < numberOfWinners && hashIndex < hashChain.length) {
            const currentHash = hashChain[hashIndex];
            const ticketIndex = this.cryptoService.mapHashToTicketIndex(currentHash, tickets.length);

            if (ticketIndex !== null && !selectedIndices.has(ticketIndex)) {
                selectedIndices.add(ticketIndex);
                const ticket = tickets[ticketIndex];
                
                verifiedWinners.push({
                    ticket_uid: ticket.ticket_uid,
                    user_uid: ticket.user_uid,
                    winner_place: verifiedWinners.length + 1
                });
            }
            hashIndex++;
        }

        return verifiedWinners;
    }

    /**
     * Compare original winners with verified winners
     * @param {Array} originalWinners 
     * @param {Array} verifiedWinners
     * @returns {boolean} True if winners match
     */
    compareWinners(originalWinners, verifiedWinners) {
        if (originalWinners.length !== verifiedWinners.length) {
            return false;
        }

        return verifiedWinners.every((winner, index) => {
            const original = originalWinners[index];
            return winner.ticket_uid === original.ticket_uid && 
                   winner.user_uid === original.user_uid;
        });
    }

    /**
     * Verify raffle results (can be called by anyone)
     * @param {string} raffleUuid - Raffle UUID
     * @returns {Promise<object>} Verification result
     */
    async verifyRaffle(raffleUuid) {
        try {
            // Get raffle data
            const raffleData = await this.dbService.getRaffle(raffleUuid);
            
            if (!raffleData.rng_commitment || raffleData.rng_commitment.status !== 'revealed') {
                throw new Error('Raffle secrets not yet revealed');
            }

            const commitment = raffleData.rng_commitment;
            const execution = raffleData.rng_execution;

            // 1. Verify commitment
            const commitmentVerification = this.verifyCommitment(commitment, raffleUuid);
            if (!commitmentVerification.verified) {
                return commitmentVerification;
            }

            // 2. Get original ticket frozen list
            const tickets = await this.dbService.getRaffleTickets(raffleData.raffle_uuid);
            
            // 3. Regenerate winners
            const verifiedWinners = this.regenerateWinners(
                commitment.raffle_seed,
                tickets,
                execution.hashes_used,
                execution.winners.length
            );

            // 4. Compare winners
            const winnersMatch = this.compareWinners(execution.winners, verifiedWinners);

            console.log(`Verification result for raffle ${raffleUuid}: ${winnersMatch ? 'PASSED' : 'FAILED'}`);

            return {
                verified: winnersMatch,
                original_winners: execution.winners,
                verified_winners: verifiedWinners,
                verification_timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error verifying raffle:', error);
            return { verified: false, error: error.message };
        }
    }
}

module.exports = VerificationService;