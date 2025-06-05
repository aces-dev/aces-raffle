const RaffleRNGSystem = require('../RaffleRNGSystem');
const RaffleTestLogger = require('./RaffleTestLogger');

class RaffleTestRunner {
    constructor() {
        this.rngSystem = new RaffleRNGSystem();
        this.logger = new RaffleTestLogger();
        this.testRaffleUuid = 'zw46gBSpcfOzW7ftWUSA';
    }

    async runAllTests() {
        try {
            await this.testFullRaffleProcess();
            await this.testVerificationOnly();
        } catch (error) {
            this.logger.logError('Test failed', error);
        } finally {
            this.logger.resetStepCounter();
        }
    }

    async testFullRaffleProcess() {
        this.logger.logTestHeader('Testing Full Raffle Process', this.testRaffleUuid);
        
        try {
            const { execution, verification } = await this.executeRaffleSteps();
            
            this.logger.logTestResults(execution.winners);
            this.logger.logVerificationStatus(verification.verified);
            
        } catch (error) {
            this.logger.logError('Raffle process test failed', error);
            throw error;
        }
    }

    async executeRaffleSteps() {
        const commitment = await this.testPreCommitment();
        const execution = await this.testRaffleExecution();
        const revelation = await this.testSecretRevelation();
        const verification = await this.testVerification();
        
        return { commitment, execution, revelation, verification };
    }

    async testPreCommitment() {
        this.logger.logStep('Creating pre-commitment');
        const commitment = await this.rngSystem.createPreCommitment(this.testRaffleUuid);
        this.logger.logResult(`Hash: ${commitment.commitment_hash}`);
        return commitment;
    }

    async testRaffleExecution() {
        this.logger.logStep('Executing raffle');
        const execution = await this.rngSystem.executeRaffle(this.testRaffleUuid, 1);
        this.logger.logResult(`Winners: ${execution.winners.length}`);
        this.logger.logResult(`Tickets: ${execution.total_tickets}`);
        return execution;
    }

    async testSecretRevelation() {
        this.logger.logStep('Revealing secrets');
        const revelation = await this.rngSystem.revealSecrets(this.testRaffleUuid);
        this.logger.logResult(`Seed: ${revelation.raffle_seed}`);
        return revelation;
    }

    async testVerification() {
        this.logger.logStep('Verifying results');
        const verification = await this.rngSystem.verifyRaffle(this.testRaffleUuid);
        this.logger.logResult(`Status: ${verification.verified ? 'PASSED' : 'FAILED'}`);
        return verification;
    }

    async testVerificationOnly() {
        this.logger.resetStepCounter();
        this.logger.logTestHeader('Verification Only Test');
        
        try {
            const result = await this.rngSystem.verifyRaffle(this.testRaffleUuid);
            this.logger.logResult(`Verified: ${result.verified ? 'YES' : 'NO'}`);
            
            if (!result.verified && result.error) {
                this.logger.logResult(`Error: ${result.error}`);
            }
        } catch (error) {
            this.logger.logError('Verification test failed', error);
            throw error;
        }
    }
}

// module.exports = RaffleTestRunner;
new RaffleTestRunner().runAllTests();