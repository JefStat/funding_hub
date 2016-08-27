module.exports = {
  build: {
    "index.html": "index.html",
    "app.js" : [
      "javascripts/_vendor/hooked-web3-provider.js",
      "javascripts/_vendor/lightwallet.js",
      "javascripts/_vendor/angular.js",
      "javascripts/app.js"
    ],
    "FundingHubController.js": [
      "javascripts/FundingHubController.js",

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
  ,networks: {
      // unused networks
        // "live": {
        //     network_id: 1 // Ethereum public network
        //     // ,host: "192.168.1.16"
        //     // ,port: 8545
        // }
        // , "morden": {
        //     network_id: 2       // Official Ethereum test network
        //     // ,host: "192.168.1.16"
        //     // ,port: 8545
        // }
         "staging": {
            network_id: 14658 // b9labs student network
            , host: "192.168.1.16"
            , port: 8545
            , gasPrice: '18000000000'
        }
        , "development": {
            network_id: "default"
            , host: "192.168.1.16"
            , port: 8546
        }
    }
};
