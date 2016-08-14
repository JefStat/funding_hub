import "./Project.sol";

contract FundingHub {

    mapping(address => uint) projectsMap;
    Project[] public projects;
    uint public numProjects;

    function createProject(address owner, uint goalAmount, uint deadline) {
        projects[numProjects] = new Project(owner, goalAmount, deadline);
        projectsMap[projects[numProjects]] = numProjects;
        numProjects++;
    }

    function contribute(Project project) {
        project.fund();
    }
}
