module.exports = function (deployer) {
    deployer.deploy(FundingHub);
    deployer.then(function () {
        console.log('Deploying Project...');
        return FundingHub.deployed().createProject(web3.eth.accounts[0], 10000, Math.floor(Date.now() / 1000) +  24 * 60 * 60);
    }).then(function (tx) {
        console.log('createProject tx: ', tx);
        return FundingHub.deployed().getProject.call(0);
    }).then(function (project) {
        console.log('Project: ', project);
    });
};