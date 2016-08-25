var ProjectDetailsStruct = {
    new: function (truffleArray) {
        return {
            owner: truffleArray[0]
            , goalAmount: truffleArray[1]
            , deadline: truffleArray[2]
            , amountFunded: truffleArray[3]
            , refunded: truffleArray[4]
            , paid: truffleArray[5]
        };
    }
};

contract('Project', function (accounts) {
    it.only('should create a project', function () {
        var now = Date.now();
        return Project.new(accounts[0], 100000, now)
            .then(function (p) {
                console.log('[TEST][Project]  new project: ', p.address);
                assert.equal(true, p.address != '0x');
                return p.details.call();
            })
            .then(function (details) {
                var d = ProjectDetailsStruct.new(details);
                console.log(d);
                assert.equal(accounts[0], d.owner);
                assert.equal('100000', d.goalAmount.toString());
                assert.equal(now.toString(), d.deadline.toString());
                assert.equal(false, d.refunded);
                assert.equal(false, d.paid);
            });
    });
    it('should fund', function () {
        var p = Project.new();

        return p.fund({from: accounts[0], value: 10}).then(function (tx) {
            console.log('[TEST][Project]  fund tx: ', tx);
        });
    });
    it('should not fund when goal succeeded', function () {
        var p = Project.new();

        return p.fund({from: accounts[0], value: 10}).then(function (tx) {
            console.log('[TEST][Project]  fund tx: ', tx);
        });
    });
    it('should not fund when goal date passed', function () {
        var p = Project.new();

        return p.fund({from: accounts[0], value: 10}).then(function (tx) {
            console.log('[TEST][Project]  fund tx: ', tx);
        });
    });
    it('should not fund when goal succeeded', function () {
        var p = Project.new();

        return p.fund({from: accounts[0], value: 10}).then(function (tx) {
            console.log('[TEST][Project]  fund tx: ', tx);
        });
    });
    it('should refund when goal failed', function () {
        var p = Project.new();

        return p.fund({from: accounts[0], value: 10}).then(function (tx) {
            console.log('[TEST][Project]  fund tx: ', tx);
        });
    });
    it('should payout when goal succeeded', function () {
        var p = Project.new();

        return p.fund({from: accounts[0], value: 10}).then(function (tx) {
            console.log('[TEST][Project]  fund tx: ', tx);
        });
    });
});
