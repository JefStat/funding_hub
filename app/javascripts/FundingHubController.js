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
    "FundingHubController",
    ['$scope', '$location', '$http', '$q', '$window', '$timeout',
        function ($scope, $location, $http, $q, $window, $timeout) {
            $scope.projects = [];
            $scope.createProject = function (owner, goalAmount, deadline) {
            };
            $scope.fund = function (sender, amount) {
            };
        }]);
