import "./Project.sol";

contract FundingHub {
    event NewProject(address project);

    mapping(address => uint) public projectsMap;
    address[] public projects;

    function createProject(address owner, uint goalAmount, uint deadline) {
        address p = address(new Project(owner, goalAmount, deadline));
        projectsMap[p] = projects.length;
        projects.push(p);
        NewProject(p);
    }

    function contribute(address project) {
        Project(project).fund.value(msg.value)();
    }

//These 2 functions totally ineffective in my web3 environment ieL
//FundingHub
//.deployed()
//.getProjectCount
//.call({from: '0xad58c181d8fa0a0ab1fb8be9ca7d7cf3a4da0b42'})
//.then(count => {console.log(c);});
// Always logs 0
    function getProject(uint index) returns(address) {
        return projects[index];
    }

    function getProjectCount() returns(uint) {
        return projects.length;
    }
}
