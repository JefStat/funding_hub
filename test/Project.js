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

var assertDetails = function (expected, d) {
    assert.equal(expected.owner, d.owner);
    assert.equal(expected.goalAmount, d.goalAmount);
    assert.equal(expected.deadline, d.deadline);
    assert.equal(expected.amountFunded, d.amountFunded);
    assert.equal(expected.refunded, d.refunded);
    assert.equal(expected.paid, d.paid);
};

contract('Project', function (accounts) {
    it('should create a project', function () {
        var expected = {
            owner:accounts[0],
            goalAmount: 100000,
            deadline: Date.now(),
            amountFunded: 0,
            refunded: false,
            paid: false
        };
        return Project.new(expected.owner, expected.goalAmount, expected.deadline)
            .then(function (p) {
                console.log('[TEST][Project]  new project: ', p.address);
                assert.equal(true, p.address != '0x');
                return p.details.call();
            })
            .then(function (details) {
                var d = ProjectDetailsStruct.new(details);
                console.log(d);
                assertDetails(expected, d);
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
