contract('Project', function(accounts) {
    it("should create a project", function() {
        Project.new(accounts[0], 100000, Date.now(), {from: accounts[0]})
            .then(function (p) {
                console.log('[TEST][Project]  new project: ', p);
            });
    });
    it("should fund", function(){
        var p = Project.new();

        return p.fund({from: accounts[0], value: 10}).then(function(tx){
            console.log('[TEST][Project]  fund tx: ', tx);
        });
    });
    it("should not fund when goal succeeded", function(){
        var p = Project.new();

        return p.fund({from: accounts[0], value: 10}).then(function(tx){
            console.log('[TEST][Project]  fund tx: ', tx);
        });
    });
    it("should not fund when goal date passed", function(){
        var p = Project.new();

        return p.fund({from: accounts[0], value: 10}).then(function(tx){
            console.log('[TEST][Project]  fund tx: ', tx);
        });
    });
    it("should not fund when goal succeeded", function(){
        var p = Project.new();

        return p.fund({from: accounts[0], value: 10}).then(function(tx){
            console.log('[TEST][Project]  fund tx: ', tx);
        });
    });
    it("should refund when goal failed", function(){
        var p = Project.new();

        return p.fund({from: accounts[0], value: 10}).then(function(tx){
            console.log('[TEST][Project]  fund tx: ', tx);
        });
    });
    it("should payout when goal succeeded", function(){
        var p = Project.new();

        return p.fund({from: accounts[0], value: 10}).then(function(tx){
            console.log('[TEST][Project]  fund tx: ', tx);
        });
    });
});
