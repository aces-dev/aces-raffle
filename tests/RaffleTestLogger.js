class RaffleTestLogger {
    constructor() {
        this.stepCounter = 0;
    }

    logTestHeader(title, raffleUuid = '') {
        console.log(`\n=== ${title} ===\n`);
        if (raffleUuid) console.log(`Raffle: ${raffleUuid}\n`);
    }

    logStep(step) {
        console.log(`${this.currentStepNumber()}. ${step}`);
    }

    logResult(message, indent = '   ') {
        console.log(`${indent}${message}\n`);
    }

    logTestResults(winners) {
        console.log('\n=== Results ===\n');
        winners.forEach((winner, index) => {
            console.log(`Winner ${index + 1}: User ${winner.user_uid} (Ticket ${winner.ticket_index})`);
        });
    }

    logVerificationStatus(verified) {
        console.log('\n=== Final Verification ===');
        console.log(`Status: ${verified ? '✅ PASSED' : '❌ FAILED'}\n`);
    }

    logError(context, error) {
        console.error(`\n[ERROR] ${context}:`, error.message);
    }

    currentStepNumber() {
        return this.stepCounter += 1;
    }

    resetStepCounter() {
        this.stepCounter = 0;
    }
}

module.exports = RaffleTestLogger;



