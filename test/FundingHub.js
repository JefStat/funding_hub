contract('FundingHub', function(accounts) {
  it("should create a project", function() {
    var fh = FundingHub.deployed();

    return fh.createProject(accounts[0], 100000, Date.now(), {from:accounts[0]}).then(function(tx) {
      console.log('[TEST][FundingHub]  createProject tx: ', tx);
    });
  });
  it("should contribute to project", function(){
    var p = Project.new();
    var fh = FundingHub.deployed();
    //TODO confirm the funder is not the Funding hub address
    return fh.contribute(p.address,{from: accounts[0]}).then(function(tx){
      console.log('[TEST][FundingHub]  contribute tx: ', tx);
    });
  });
});
