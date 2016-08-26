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
            let fh = FundingHub.deployed();
            $scope.deadline = new Date();
            $scope.goalAmount = 0;
            $scope.amount = 0;
            $scope.projects = [];
            $scope.projectContracts = [];
            $scope.createProject = function (owner, goalAmount, deadline) {
                if (deadline && goalAmount > 0 && owner) {
                    var deadlineInt = Math.floor(deadline.valueOf() / 1000);

                    fh
                        .createProject(owner, goalAmount, deadlineInt, {from: web3.eth.defaultAccount})
                        .then(tx => {
                            return web3
                                .eth
                                .getTransactionReceiptMined(tx)
                                .then(console.log)
                                .catch(console.error);
                        })
                        .then($scope.refreshProjects)
                        .catch(console.error);
                }
            };
            $scope.fund = function (sender, amount) {
            };

            $window.onload = e => {
                initWeb3();
                web3.eth.getAccounts(
                    (err, acc) => {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        if (acc && acc.length > 0) {
                            web3.eth.defaultAccount = acc[0];
                            $scope.$apply(() => {
                                $scope.owner = web3.eth.defaultAccount;
                                $scope.sender = web3.eth.defaultAccount;
                            });
                        } else {
                            console.error('Couldn\'t set web3.eth.defaultAccount, ', acc)
                        }
                    });
                $scope.refreshProjects();
            };

            $scope.refreshProjects = () => {
                return fh
                    .getProjectCount
                    .call()
                    .then(count => {
                        let c = count.toNumber();
                        for (let i = 0; i < c; i++) {
                            let projectAddr = fh
                                .getProject
                                .call(i)
                                .then(projectAddr => {
                                    let p = Project.at(projectAddr);
                                    $scope.projectContracts.push(p);
                                    let projectDetails = p
                                        .details
                                        .call()
                                        .then(details => {
                                            $scope.projects.push(ProjectDetailsStruct.new(projectDetails));
                                        });
                                });
                        }
                    })
                    .catch(error => {
                        console.error(error);
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
