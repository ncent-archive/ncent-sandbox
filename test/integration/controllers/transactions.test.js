describe('Provenance and Redemption', () => {
    it('reliably follow FIFO when no redemptions have occured', async (done) => {
        // create a tokentype
        // distribute tokens to 2 wallets
            // each of these wallets gives tokens to wallet4
        // check provenance from wallet 4 == wallet2
        done();
    });
    it('reliably follow FIFO when no redemptions have occured', async (done) => {
        // create a tokentype
        // distribute tokens to 2 wallets (wallet2, wallet3)
            // each of these wallets gives tokens to wallet4
        // redeem token amount equal to first transaction (wallet3 w/ wallet4)
        // check provenance from wallet 4 == wallet3
        done();
    });
});