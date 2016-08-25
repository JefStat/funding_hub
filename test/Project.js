
// ref https://github.com/tcoulter/dao-truffle/blob/master/index.js
function jump(duration) {
    return function(callback) {
        console.log("Jumping " + duration + "s ...");
        var seconds = Math.floor(new Date().getTime() / 1000) + duration;

        web3.currentProvider.sendAsync({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [seconds],
            id: new Date().getTime()
        }, callback);
    }
}

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
            deadline: Math.floor(Date.now() / 1000) + 60,
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
            deadline: Math.floor(Date.now() / 1000) + 60,
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
    //TODO fund from a different account than owner
    //TODO assert account[0] balance received the payout
    //TODO assert refund was issue for fund #2
    it('should not fund when goal succeeded', function () {
        var expected = {
            owner: accounts[0],
            goalAmount: 10,
            deadline: Math.floor(Date.now() / 1000) + 60,
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
    it('should not fund when goal date passed', function () {
        var expected = {
            owner: accounts[0],
            goalAmount: 10,
            deadline: Math.floor(Date.now() / 1000) - 24 * 60 * 60,
            amountFunded: 0,
            refunded: true,
            paid: false
        };
        return Project.new(expected.owner, expected.goalAmount, expected.deadline)
            .then(function (p) {
                console.log('[TEST][Project]  new project: ', p.address);
                return p.fund({from: accounts[0], value: 9})
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
    it.only('should refund when goal failed', function () {
        var expected = {
            owner: accounts[0],
            goalAmount: 10,
            deadline: Math.floor(Date.now() / 1000) + 60,
            amountFunded: 1,
            refunded: true,
            paid: false
        };
        return Project.new(expected.owner, expected.goalAmount, expected.deadline)
            .then(function (p) {
                console.log('[TEST][Project]  new project: ', p.address);
                return p.fund({from: accounts[0], value: 1})
                    .then(function (tx) {
                        console.log('[TEST][Project]  fund 1 tx: ', tx);
                        return new Promise(function (resolve, reject) {
                            jump(62)(resolve);
                        });
                    })
                    .then(function (tx) {
                        console.log('[TEST][Project]  jump');
                        return p.fund({from: accounts[0], value: 1});
                    })
                    .then(function (tx) {
                        console.log('[TEST][Project]  fund late: ', tx);
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
