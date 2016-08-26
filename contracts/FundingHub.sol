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

    function getProject(uint index) returns(address) {
        return projects[index];
    }

    function getProjectCount() returns(uint) {
        return projects.length;
    }
}
