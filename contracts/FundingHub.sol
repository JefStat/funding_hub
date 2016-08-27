import "./Project.sol";

contract FundingHub {

    event NewProject(address proj, uint index);
    event GetProject(address proj);
    event GetProjectCount(uint count);
    event Contributed(address proj);

    mapping(address => uint) public projectsMap;
    address[] public projects;

    function createProject(address owner, uint goalAmount, uint deadline) {
        address p = address(new Project(owner, goalAmount, deadline));
        projectsMap[p] = projects.length;
        projects.push(p);
        NewProject(p, projects.length - 1);
    }

    function contribute(address proj) {
        Project(proj).fund.value(msg.value)();
        Contributed(proj);
    }

    function getProjectCount() returns(uint) {
        GetProjectCount(projects.length);
        return projects.length;
    }

    function getProject(uint index) returns(address) {
        GetProject(projects[index]);
        return projects[index];
    }
}
