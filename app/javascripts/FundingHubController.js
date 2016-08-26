'use strict';
var app = angular.module('FundingHubApp');
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

app.controller(
    'FundingHubController',
    ['$scope', '$location', '$http', '$q', '$window', '$timeout',
        function ($scope, $location, $http, $q, $window, $timeout) {
            $scope.deadline = new Date();
            $scope.goalAmount = 0;
            $scope.amount = 0;
            $scope.projects = [];
            $scope.projectContracts = [];
            $scope.fh = FundingHub.deployed();
            let fh = $scope.fh;
            $scope.createProject = function (owner, goalAmount, deadline) {
                if (deadline && goalAmount > 0 && owner) {
                    var deadlineInt = Math.floor(deadline.valueOf() / 1000);

                    fh
                        .createProject
                        .sendTransaction(owner, goalAmount, deadlineInt,
                            {
                                from: web3.eth.defaultAccount
                                ,gas: web3.toBigNumber(web3.toWei(4,'Mwei'))
                                ,gasPrice: web3.gasPrice
                            })
                        .then(tx => {
                            return web3
                                .eth
                                .getTransactionReceiptMined(tx)
                                .then(console.log)
                                .catch(console.error);
                        })
                        .catch(console.error);
                }
            };
            $scope.fund = function (sender, amount) {
            };

            $window.onload = e => {
                initWeb3();
                $scope.wallet();
                var events = fh.allEvents({}, function (err, e) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    console.log(e);
                });
                $scope.refreshProjects();
            };

            $scope.refreshProjects = () => {

            };

            $scope.wallet = () => {
                // Example of seed 'unhappy nerve cancel reject october fix vital pulse cash behind curious bicycle'
                var seed = prompt('Enter your private key seed', 'unhappy nerve cancel reject october fix vital pulse cash behind curious bicycle');
                // the seed is stored in memory and encrypted by this user-defined password
                var password = prompt('Enter password to encrypt the seed', 'dev_password');

                lightwallet.keystore.deriveKeyFromPassword(password, (err, _pwDerivedKey) => {
                    let pwDerivedKey = _pwDerivedKey;
                    let ks = new lightwallet.keystore(seed, pwDerivedKey);

                    // Create a custom passwordProvider to prompt the user to enter their
                    // password whenever the hooked web3 provider issues a sendTransaction
                    // call.
                    ks.passwordProvider = callback => {
                        var pw = prompt("Please enter password to sign your transaction", "dev_password");
                        callback(null, pw);
                    };

                    let provider = new HookedWeb3Provider({
                        // Let's pick the one that came with Truffle
                        host: web3.currentProvider.host,
                        transaction_signer: ks
                    });
                    web3.setProvider(provider);
                    // And since Truffle v2 uses EtherPudding v3, we also need the line:
                    FundingHub.setProvider(provider);
                    Project.setProvider(provider);

                    // Generate the first address out of the seed
                    ks.generateNewAddress(pwDerivedKey);

                    let accounts = ks.getAddresses();
                    let account = "0x" + accounts[0];

                    $scope.$apply(() => {
                        web3.eth.defaultAccount = account;
                        $scope.owner = web3.eth.defaultAccount;
                        $scope.sender = web3.eth.defaultAccount;
                    });
                    web3.eth.getAccounts(
                        (err, acc) => {
                            if (err) {
                                console.error(err);
                                return;
                            }
                            if (acc && acc.length > 0) {
                                console.log('Geth accounts: ', acc);
                                console.log('Send 1 ether to the light wallet account with coinbase account using command below');
                                console.log('web3.eth.sendTransaction({ from: "' + acc[0] + '", to: "' + account + '", value: web3.toWei(1, "ether") }), (err, tx) => {console.log(tx); if(err)console.error(err);})');
                                console.log('Then check the balance with');
                                console.log('web3.fromWei(web3.eth.getBalance("' + account + '"), "ether").toString()')
                            } else {
                                console.error('Couldn\'t set web3.eth.defaultAccount, ', acc)
                            }
                        });
                    console.log('Your account is ' + account + ' with balance ' + web3.fromWei(web3.eth.getBalance(account), 'ether').toString() + ' ethers');
                });
            };

        }]);

function initWeb3() {
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
}
