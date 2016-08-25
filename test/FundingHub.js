contract('FundingHub', function (accounts) {
    // it.only('should create a project', function (done) {
    it('should create a project', function () {
        var fh = FundingHub.deployed();
        // TODO this event handler does not work
        var allEvents = fh.allEvents();
        allEvents.watch(function (err, e) {
            if (err) {
                console.error('[TEST][FundingHub]  NewProject  ', JSON.stringify(err));
                // done(err);
                return;
            }
            console.log('[TEST][FundingHub]  NewProject event: ', JSON.stringify(e));
            var p = Project.at(e.args.project);
            // done();
        });

        return fh.createProject(accounts[0], 100000, Math.floor(Date.now()/1000))
            .then(function (tx) {
                console.log('[TEST][FundingHub]  createProject tx: ', tx);
                allEvents.get(function (err, e) {
                    console.log(e);
                });
                return fh.getProject.call(0);
            })
            .then(function (address) {
                console.log('[TEST][FundingHub]  project index 0: ', address);
                //assert fails though the same code path works in the migration
                assert.equal(true, address != '0x');
                // done();
            });
    });

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
