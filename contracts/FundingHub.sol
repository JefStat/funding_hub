import "./Project.sol";

contract FundingHub {
    mapping(address => uint) public projectsMap;
    Project[] public projects;

    function createProject(address owner, uint goalAmount, uint deadline) {
        Project p = new Project(owner, goalAmount, deadline);
        projectsMap[p] = projects.length;
        projects.push(p);
    }

    function contribute(Project project) {
        project.fund();
    }

    function getProject(uint index) returns(address) {
        return projects[index];
    }
}
