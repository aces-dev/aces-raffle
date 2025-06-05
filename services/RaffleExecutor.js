const CryptoService = require('../core/CryptoService');
const DatabaseService = require('./DatabaseService');

class RaffleExecutor {
    constructor() {
        this.cryptoService = new CryptoService();
        this.dbService = new DatabaseService();
    }

    validateRaffleExecution(raffleData) {
        const now = new Date();
        const endDate = raffleData.end_date.toDate();
        if (now < endDate) {
            throw new Error('Raffle has not ended yet');
        }
    }

    /**
     * Calculate expected rejection rate
     */
    calculateRequiredHashes(numberOfWinners) {
        const baseHashes = numberOfWinners * 3; // 3x buffer
        return Math.max(baseHashes, 20); //  20 hashes
    }

    /**
     * Select winners using hash chain
     * @param {Array} tickets - Array of tickets
     * @param {string} raffleSeed - Raffle seed
     * @param {number} numberOfWinners
     * @returns {object} 
     */
    selectWinners(tickets, raffleSeed, numberOfWinners) {
        const totalTickets = tickets.length;
        
        if (totalTickets === 0) {
            throw new Error('No tickets found for this raffle');
        }

        // Generate hash chain for winner selection
        // const requiredHashes = numberOfWinners * 10; // Extra hashes for rejection sampling
        const requiredHashes = this.calculateRequiredHashes(numberOfWinners, totalTickets);
        const hashChain = this.cryptoService.generateHashChain(raffleSeed, requiredHashes);

        // Select winners
        const winners = [];
        const selectedIndices = new Set();
        let hashIndex = 0;
        let rejectedHashes = 0;

        while (winners.length < numberOfWinners && hashIndex < hashChain.length) {
            const currentHash = hashChain[hashIndex];
            const ticketIndex = this.cryptoService.mapHashToTicketIndex(currentHash, totalTickets);

            if (ticketIndex === null) {
                // Rejection sampling - hash rejected due to bias
                rejectedHashes++;
                hashIndex++;
                continue;
            }

            // Check if this ticket was already selected (for multi-winner raffles)
            if (!selectedIndices.has(ticketIndex)) {
                selectedIndices.add(ticketIndex);
                const winningTicket = tickets[ticketIndex];
                
                winners.push({
                    ticket_id: winningTicket.id,
                    ticket_uid: winningTicket.ticket_uid,
                    user_uid: winningTicket.user_uid,
                    ticket_index: ticketIndex,
                    selection_hash: currentHash,
                    winner_place: winners.length + 1
                });

                console.log(`Winner ${winners.length}: Ticket ${winningTicket.ticket_uid} (User: ${winningTicket.user_uid})`);
            }

            hashIndex++;
        }

        if (winners.length < numberOfWinners) {
            throw new Error('Insufficient entropy');
        }

        return {
            winners,
            executionStats: {
                total_tickets: totalTickets,
                hashes_used: hashIndex,
                rejected_hashes: rejectedHashes
            }
        };
    }


    async executeRaffle(raffleUuid, numberOfWinners = 1) {
        try {
            console.log(`Starting raffle execution for ${raffleUuid}`);

            // 1. Get raffle data
            const raffleData = await this.dbService.getRaffle(raffleUuid);
            
            // 2. Validate execution conditions
            this.validateRaffleExecution(raffleData);

            // 3. Freeze ticket list (get all tickets at the moment of execution)
            const tickets = await this.dbService.getRaffleTickets(raffleData.raffle_uuid);
            console.log(`Found ${tickets.length} tickets for raffle ${raffleUuid}`);

            // 4. Get RNG secrets
            const secrets = await this.dbService.getSecrets(raffleUuid);
            
            // 5. Select winners
            const { winners, executionStats } = this.selectWinners(tickets, secrets.raffle_seed, numberOfWinners);

            // 6. Update database with results
            await this.dbService.updateRaffleResults(raffleUuid, winners, executionStats, raffleData);

            console.log(`Raffle ${raffleUuid} completed successfully with ${winners.length} winners`);

            return {
                success: true,
                winners: winners,
                total_tickets: executionStats.total_tickets,
                execution_stats: {
                    hashes_used: executionStats.hashes_used,
                    rejected_hashes: executionStats.rejected_hashes
                }
            };

        } catch (error) {
            console.error('Error executing raffle:', error);
            throw error;
        }
    }
}

module.exports = RaffleExecutor;