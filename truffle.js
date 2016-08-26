module.exports = {
  build: {
    "index.html": "index.html",
    "app.js" : [
      "javascripts/_vendor/angular.js",
      "javascripts/app.js"
    ],
    "FundingHubController.js": [
      "javascripts/FundingHubController.js"
    ],
    "ProjectController.js": [
      "javascripts/ProjectController.js"
    ],
    "app.css": [
      "stylesheets/app.css"
    ],
    "images/": "images/"
  },
  rpc: {
    host: "192.168.1.16",
    //host: "localhost",
    port: 8546
  }
};
