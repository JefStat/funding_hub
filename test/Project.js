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
    assert.equal(expected.owner, d.owner, 'owner does not equal');
    assert.equal(expected.goalAmount, d.goalAmount, 'goal amount does not equal');
    assert.equal(expected.deadline, d.deadline, 'deadline does not equal');
    assert.equal(expected.amountFunded, d.amountFunded, 'amount funded does not equal');
    assert.equal(expected.refunded, d.refunded, 'refunded does not equal');
    assert.equal(expected.paid, d.paid, 'paid does not equal');
};

contract('Project', function (accounts) {
    it('should create a project', function () {
        var expected = {
            owner: accounts[0],
            goalAmount: 100000,
            deadline: Date.now() + 60 * 1000,
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
                console.log('[TEST][Project]  details ', d);
                assertDetails(expected, d);
            });
    });
    it('should fund', function () {
        var expected = {
            owner: accounts[0],
            goalAmount: 100000,
            deadline: Date.now() + 60 * 1000,
            amountFunded: 10,
            refunded: false,
            paid: false
        };
        return Project.new(expected.owner, expected.goalAmount, expected.deadline)
            .then(function (p) {
                console.log('[TEST][Project]  new project: ', p.address);
                return p.fund({from: accounts[0], value: expected.amountFunded})
                    .then(function (tx) {
                        console.log('[TEST][Project]  fund tx: ', tx);
                        return p.details.call();
                    })
                    .then(function (details) {
                        var d = ProjectDetailsStruct.new(details);
                        console.log('[TEST][Project]  details ', d);
                        assertDetails(expected, d);
                    });
            });
    });
    it('should not fund when goal succeeded', function () {
        var expected = {
            owner: accounts[0],
            goalAmount: 10,
            deadline: Date.now() + 60 * 1000,
            amountFunded: 10,
            refunded: false,
            paid: true
        };
        return Project.new(expected.owner, expected.goalAmount, expected.deadline)
            .then(function (p) {
                console.log('[TEST][Project]  new project: ', p.address);
                return p.fund({from: accounts[0], value: 10})
                    .then(function (tx) {
                        console.log('[TEST][Project]  fund 1 tx: ', tx);
                        return  p.fund({from: accounts[0], value: 10});
                    })
                    .then(function (tx) {
                        console.log('[TEST][Project]  fund 2 tx: ', tx);
                        return p.details.call();
                    })
                    .then(function (details) {
                        var d = ProjectDetailsStruct.new(details);
                        console.log('[TEST][Project]  details ', d);
                        assertDetails(expected, d);
                    });
            });
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
