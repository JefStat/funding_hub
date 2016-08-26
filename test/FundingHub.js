contract('FundingHub', function (accounts) {
    //test not running events on testrpc unknown reason
    it.skip('should create a project 12', function (done) {
        var fh = FundingHub.deployed();
        var allEvents = fh.allEvents();
        allEvents.watch(function (err, e) {
            allEvents.stopWatching();
            if (err) {
                console.error('[TEST][FundingHub]  NewProject  ', JSON.stringify(err));
                done(err);
                return;
            }
            console.log('[TEST][FundingHub]  NewProject event: ', JSON.stringify(e));
            var p = Project.at(e.args.project);
            done();
        });

        fh.createProject.sendTransaction(accounts[0], 100000, Math.floor(Date.now() / 1000))
            .then(function (tx) {
                console.log('[TEST][FundingHub]  createProject tx: ', tx);
                //return web3.eth.getTransactionReceiptMined(tx);
            })
            .then(function (txReceipt) {
                console.log(txReceipt);
            });
    });

    // it.only('should create a project', function (done) {
    //     var fh = FundingHub.deployed();
    //     var tx;
    //
    //     var allEvents = fh.NewProject();
    //     allEvents.watch(function (err, e) {
    //         allEvents.stopWatching();
    //
    //         if (err) {
    //             console.error('[TEST][FundingHub]  NewProject  ', JSON.stringify(err));
    //             return done(err);
    //         }
    //
    //         console.log('[TEST][FundingHub]  createProject tx: ', tx);
    //
    //         console.log('[TEST][FundingHub]  NewProject event: ', JSON.stringify(e));
    //         var p = Project.at(e.args.project);
    //
    //         // This next line returns a promise? Where does this function come from?
    //         web3.eth.getTransactionReceiptMined(tx)
    //             .then(function (txReceipt) {
    //                 console.log(txReceipt);
    //                 return fh.getProject.call(0);
    //             })
    //             .then(function (address) {
    //                 console.log('[TEST][FundingHub]  project index 0: ', address);
    //                 //assert fails though the same code path works in the migration
    //                 //assert.equal(true, address != '0x');
    //             }).then(done).callback(done);
    //     });
    //
    //     // This triggers the event, which fires the callback above.
    //     fh.createProject.sendTransaction(accounts[0], 100000, Math.floor(Date.now() / 1000)).then(function(tx_hash) {
    //         // This block *shouldn't* be a race condition since it's synchronous. Let's hope not.
    //         tx = tx_hash;
    //     });
    // });

    it.skip('should contribute to project', function () {
        var fh = FundingHub.deployed();

        fh.createProject(a.address, 10000, Date.now() + 5 * 60 * 1000)
            .then(function (tx) {
                console.log('createProject tx: ', tx);
                return fh.projects.call(0);
            });

        //TODO confirm the funder is not the Funding hub address
        return fh.contribute(p.address, {from: accounts[0]}).then(function (tx) {
            console.log('[TEST][FundingHub]  contribute tx: ', tx);
        });
    });
});

web3.eth.getTransactionReceiptMined = function (txnHash, interval) {
    var transactionReceiptAsync;
    interval |= 500;
    transactionReceiptAsync = function (txnHash, resolve, reject) {
        try {
            var receipt = web3.eth.getTransactionReceipt(txnHash);
            if (receipt == null) {
                setTimeout(function () {
                    transactionReceiptAsync(txnHash, resolve, reject);
                }, interval);
            } else {
                resolve(receipt);
            }
        } catch (e) {
            reject(e);
        }
    };

    return new Promise(function (resolve, reject) {
        transactionReceiptAsync(txnHash, resolve, reject);
    });
};

var expectedExceptionPromise = function (action, gasToUse) {
    return new Promise(function (resolve, reject) {
        try {
            resolve(action());
        } catch(e) {
            reject(e);
        }
    })
        .then(function (txn) {
            // https://gist.github.com/xavierlepretre/88682e871f4ad07be4534ae560692ee6
            return web3.eth.getTransactionReceiptMined(txn);
        })
        .then(function (receipt) {
            // We are in Geth
            assert.equal(receipt.gasUsed, gasToUse, "should have used all the gas");
        })
        .catch(function (e) {
            if ((e + "").indexOf("invalid JUMP") > -1) {
                // We are in TestRPC
            } else {
                throw e;
            }
        });
};