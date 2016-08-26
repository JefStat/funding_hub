import "./Project.sol";

contract FundingHub {

// Trying anything here to see if I can get some events from this contract

    event Debug();
    event NewProject(address proj, uint index);
    event GetProject(address proj);
    event GetProjectCount(uint count);

    mapping(address => uint) public projectsMap;
    address[] public projects;

    function createProject(address owner, uint goalAmount, uint deadline) {
        address p = address(new Project(owner, goalAmount, deadline));
        projectsMap[p] = projects.length;
        projects.push(p);
        NewProject(p, projects.length - 1);
    }

    function contribute(address proj) {
        Debug();
        Project(proj).fund.value(msg.value)();
    }

//These 2 functions totally ineffective in my web3 environment
//FundingHub
//.deployed()
//.getProjectCount
//.call()
//.then(count => {console.log(count);});
// Always logs 0
    function getProjectCount() returns(uint) {
        Debug();
        GetProjectCount(projects.length);
        return projects.length;
    }

    function getProject(uint index) returns(address) {
        Debug();
        GetProject(projects[index]);
        return projects[index];
    }
}
