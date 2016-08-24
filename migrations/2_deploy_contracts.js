module.exports = function (deployer) {
    var fundingHub;
    deployer.then(function () {
        console.log('Deploying FundingHub...');
        return FundingHub.new();
    }).then(function (a) {
        console.log('FundingHub: ', a.address);
        fundingHub = a;
        console.log('Deploying Project...');
        return a.createProject(a.address, 10000, Date.now() + 5 * 60 * 1000);
    }).then(function (tx) {
        console.log('createProject tx: ', tx);
        return fundingHub.getProject.call(0);
    }).then(function (project) {
        console.log('Project: ', project);
    });
};