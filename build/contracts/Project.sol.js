var Web3 = require("web3");

(function() {
  // Planned for future features, logging, etc.
  function Provider(provider) {
    this.provider = provider;
  }

  Provider.prototype.send = function() {
    this.provider.send.apply(this.provider, arguments);
  };

  Provider.prototype.sendAsync = function() {
    this.provider.sendAsync.apply(this.provider, arguments);
  };

  var BigNumber = (new Web3()).toBigNumber(0).constructor;

  var Utils = {
    is_object: function(val) {
      return typeof val == "object" && !Array.isArray(val);
    },
    is_big_number: function(val) {
      if (typeof val != "object") return false;

      // Instanceof won't work because we have multiple versions of Web3.
      try {
        new BigNumber(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    merge: function() {
      var merged = {};
      var args = Array.prototype.slice.call(arguments);

      for (var i = 0; i < args.length; i++) {
        var object = args[i];
        var keys = Object.keys(object);
        for (var j = 0; j < keys.length; j++) {
          var key = keys[j];
          var value = object[key];
          merged[key] = value;
        }
      }

      return merged;
    },
    promisifyFunction: function(fn, C) {
      var self = this;
      return function() {
        var instance = this;

        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {
          var callback = function(error, result) {
            if (error != null) {
              reject(error);
            } else {
              accept(result);
            }
          };
          args.push(tx_params, callback);
          fn.apply(instance.contract, args);
        });
      };
    },
    synchronizeFunction: function(fn, C) {
      var self = this;
      return function() {
        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {

          var callback = function(error, tx) {
            if (error != null) {
              reject(error);
              return;
            }

            var timeout = C.synchronization_timeout || 240000;
            var start = new Date().getTime();

            var make_attempt = function() {
              C.web3.eth.getTransactionReceipt(tx, function(err, receipt) {
                if (err) return reject(err);

                if (receipt != null) {
                  return accept(tx, receipt);
                }

                if (timeout > 0 && new Date().getTime() - start > timeout) {
                  return reject(new Error("Transaction " + tx + " wasn't processed in " + (timeout / 1000) + " seconds!"));
                }

                setTimeout(make_attempt, 1000);
              });
            };

            make_attempt();
          };

          args.push(tx_params, callback);
          fn.apply(self, args);
        });
      };
    }
  };

  function instantiate(instance, contract) {
    instance.contract = contract;
    var constructor = instance.constructor;

    // Provision our functions.
    for (var i = 0; i < instance.abi.length; i++) {
      var item = instance.abi[i];
      if (item.type == "function") {
        if (item.constant == true) {
          instance[item.name] = Utils.promisifyFunction(contract[item.name], constructor);
        } else {
          instance[item.name] = Utils.synchronizeFunction(contract[item.name], constructor);
        }

        instance[item.name].call = Utils.promisifyFunction(contract[item.name].call, constructor);
        instance[item.name].sendTransaction = Utils.promisifyFunction(contract[item.name].sendTransaction, constructor);
        instance[item.name].request = contract[item.name].request;
        instance[item.name].estimateGas = Utils.promisifyFunction(contract[item.name].estimateGas, constructor);
      }

      if (item.type == "event") {
        instance[item.name] = contract[item.name];
      }
    }

    instance.allEvents = contract.allEvents;
    instance.address = contract.address;
    instance.transactionHash = contract.transactionHash;
  };

  // Use inheritance to create a clone of this contract,
  // and copy over contract's static functions.
  function mutate(fn) {
    var temp = function Clone() { return fn.apply(this, arguments); };

    Object.keys(fn).forEach(function(key) {
      temp[key] = fn[key];
    });

    temp.prototype = Object.create(fn.prototype);
    bootstrap(temp);
    return temp;
  };

  function bootstrap(fn) {
    fn.web3 = new Web3();
    fn.class_defaults  = fn.prototype.defaults || {};

    // Set the network iniitally to make default data available and re-use code.
    // Then remove the saved network id so the network will be auto-detected on first use.
    fn.setNetwork("default");
    fn.network_id = null;
    return fn;
  };

  // Accepts a contract object created with web3.eth.contract.
  // Optionally, if called without `new`, accepts a network_id and will
  // create a new version of the contract abstraction with that network_id set.
  function Contract() {
    if (this instanceof Contract) {
      instantiate(this, arguments[0]);
    } else {
      var C = mutate(Contract);
      var network_id = arguments.length > 0 ? arguments[0] : "default";
      C.setNetwork(network_id);
      return C;
    }
  };

  Contract.currentProvider = null;

  Contract.setProvider = function(provider) {
    var wrapped = new Provider(provider);
    this.web3.setProvider(wrapped);
    this.currentProvider = provider;
  };

  Contract.new = function() {
    if (this.currentProvider == null) {
      throw new Error("Project error: Please call setProvider() first before calling new().");
    }

    var args = Array.prototype.slice.call(arguments);

    if (!this.unlinked_binary) {
      throw new Error("Project error: contract binary not set. Can't deploy new instance.");
    }

    var regex = /__[^_]+_+/g;
    var unlinked_libraries = this.binary.match(regex);

    if (unlinked_libraries != null) {
      unlinked_libraries = unlinked_libraries.map(function(name) {
        // Remove underscores
        return name.replace(/_/g, "");
      }).sort().filter(function(name, index, arr) {
        // Remove duplicates
        if (index + 1 >= arr.length) {
          return true;
        }

        return name != arr[index + 1];
      }).join(", ");

      throw new Error("Project contains unresolved libraries. You must deploy and link the following libraries before you can deploy a new version of Project: " + unlinked_libraries);
    }

    var self = this;

    return new Promise(function(accept, reject) {
      var contract_class = self.web3.eth.contract(self.abi);
      var tx_params = {};
      var last_arg = args[args.length - 1];

      // It's only tx_params if it's an object and not a BigNumber.
      if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
        tx_params = args.pop();
      }

      tx_params = Utils.merge(self.class_defaults, tx_params);

      if (tx_params.data == null) {
        tx_params.data = self.binary;
      }

      // web3 0.9.0 and above calls new twice this callback twice.
      // Why, I have no idea...
      var intermediary = function(err, web3_instance) {
        if (err != null) {
          reject(err);
          return;
        }

        if (err == null && web3_instance != null && web3_instance.address != null) {
          accept(new self(web3_instance));
        }
      };

      args.push(tx_params, intermediary);
      contract_class.new.apply(contract_class, args);
    });
  };

  Contract.at = function(address) {
    if (address == null || typeof address != "string" || address.length != 42) {
      throw new Error("Invalid address passed to Project.at(): " + address);
    }

    var contract_class = this.web3.eth.contract(this.abi);
    var contract = contract_class.at(address);

    return new this(contract);
  };

  Contract.deployed = function() {
    if (!this.address) {
      throw new Error("Cannot find deployed address: Project not deployed or address not set.");
    }

    return this.at(this.address);
  };

  Contract.defaults = function(class_defaults) {
    if (this.class_defaults == null) {
      this.class_defaults = {};
    }

    if (class_defaults == null) {
      class_defaults = {};
    }

    var self = this;
    Object.keys(class_defaults).forEach(function(key) {
      var value = class_defaults[key];
      self.class_defaults[key] = value;
    });

    return this.class_defaults;
  };

  Contract.extend = function() {
    var args = Array.prototype.slice.call(arguments);

    for (var i = 0; i < arguments.length; i++) {
      var object = arguments[i];
      var keys = Object.keys(object);
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        var value = object[key];
        this.prototype[key] = value;
      }
    }
  };

  Contract.all_networks = {
  "1": {
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "details",
        "outputs": [
          {
            "name": "owner",
            "type": "address"
          },
          {
            "name": "goalAmount",
            "type": "uint256"
          },
          {
            "name": "deadline",
            "type": "uint256"
          },
          {
            "name": "amountFunded",
            "type": "uint256"
          },
          {
            "name": "refunded",
            "type": "bool"
          },
          {
            "name": "paid",
            "type": "bool"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "fund",
        "outputs": [],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "numFunders",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "funders",
        "outputs": [
          {
            "name": "addr",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          },
          {
            "name": "goalAmount",
            "type": "uint256"
          },
          {
            "name": "deadline",
            "type": "uint256"
          }
        ],
        "type": "constructor"
      }
    ],
    "unlinked_binary": "0x6060604081905260006006556007805461ffff1916905580806103a181395060c06040525160805160a05160003411156099576002565b61018060405260c083905260e082905261010081905260006101208190526101408190526101608190528054600160a060020a03191684178155600183905560028290556003556004805461ffff191690555050506102fc806100a56000396000f35b8160001415603657600256606060405260e060020a6000350463565974d3811461003c578063b60d42881461006a578063b96326891461008f578063dc0d3dff14610098575b005b6100c2600054600154600254600354600454600160a060020a03949094169360ff8181169161010090041686565b61003a60045460ff16806100855750600454610100900460ff165b1561013c57610002565b61010460065481565b6005602052600435600090815260409020805460019091015461011691600160a060020a03169082565b60408051600160a060020a03979097168752602087019590955285850193909352606085019190915215156080840152151560a0830152519081900360c00190f35b60408051918252519081900360200190f35b6040518083600160a060020a031681526020018281526020019250505060405180910390f35b60025442901080610151575060015460035410155b156101815760405132600160a060020a031690600090349082818181858883f1935050505015156101e057610002565b60408051808201825232815234602082810182815260068054600181810190925560009081526005909352949091209251835473ffffffffffffffffffffffffffffffffffffffff19161783555191909201556003805490910190555b565b600154600354106101fe5761021b60075460ff161561022057610002565b61021b6007546000908190610100900460ff161561027857610002565b6101de565b6007805460ff1916600117905560008054604051600160a060020a0391821692913016319082818181858883f19350505050151561025d57610002565b6004805461ff0019166101001790556007805460ff19169055565b6007805461ff0019166101001790555b6006548210156102d457506000818152600560205260408082208054600182015492519193600160a060020a039190911692909182818181858883f1935050505015156102f057610002565b6004805460ff191660011790556007805461ff00191690555050565b6001919091019061028856",
    "updated_at": 1472230665298,
    "links": {}
  },
  "14658": {
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "details",
        "outputs": [
          {
            "name": "owner",
            "type": "address"
          },
          {
            "name": "goalAmount",
            "type": "uint256"
          },
          {
            "name": "deadline",
            "type": "uint256"
          },
          {
            "name": "amountFunded",
            "type": "uint256"
          },
          {
            "name": "refunded",
            "type": "bool"
          },
          {
            "name": "paid",
            "type": "bool"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "fund",
        "outputs": [],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "numFunders",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "funders",
        "outputs": [
          {
            "name": "addr",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          },
          {
            "name": "goalAmount",
            "type": "uint256"
          },
          {
            "name": "deadline",
            "type": "uint256"
          }
        ],
        "type": "constructor"
      }
    ],
    "unlinked_binary": "0x6060604081905260006006556007805461ffff1916905580806103a181395060c06040525160805160a05160003411156099576002565b61018060405260c083905260e082905261010081905260006101208190526101408190526101608190528054600160a060020a03191684178155600183905560028290556003556004805461ffff191690555050506102fc806100a56000396000f35b8160001415603657600256606060405260e060020a6000350463565974d3811461003c578063b60d42881461006a578063b96326891461008f578063dc0d3dff14610098575b005b6100c2600054600154600254600354600454600160a060020a03949094169360ff8181169161010090041686565b61003a60045460ff16806100855750600454610100900460ff165b1561013c57610002565b61010460065481565b6005602052600435600090815260409020805460019091015461011691600160a060020a03169082565b60408051600160a060020a03979097168752602087019590955285850193909352606085019190915215156080840152151560a0830152519081900360c00190f35b60408051918252519081900360200190f35b6040518083600160a060020a031681526020018281526020019250505060405180910390f35b60025442901080610151575060015460035410155b156101815760405132600160a060020a031690600090349082818181858883f1935050505015156101e057610002565b60408051808201825232815234602082810182815260068054600181810190925560009081526005909352949091209251835473ffffffffffffffffffffffffffffffffffffffff19161783555191909201556003805490910190555b565b600154600354106101fe5761021b60075460ff161561022057610002565b61021b6007546000908190610100900460ff161561027857610002565b6101de565b6007805460ff1916600117905560008054604051600160a060020a0391821692913016319082818181858883f19350505050151561025d57610002565b6004805461ff0019166101001790556007805460ff19169055565b6007805461ff0019166101001790555b6006548210156102d457506000818152600560205260408082208054600182015492519193600160a060020a039190911692909182818181858883f1935050505015156102f057610002565b6004805460ff191660011790556007805461ff00191690555050565b6001919091019061028856",
    "updated_at": 1472260094924,
    "links": {}
  },
  "default": {
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "details",
        "outputs": [
          {
            "name": "owner",
            "type": "address"
          },
          {
            "name": "goalAmount",
            "type": "uint256"
          },
          {
            "name": "deadline",
            "type": "uint256"
          },
          {
            "name": "amountFunded",
            "type": "uint256"
          },
          {
            "name": "refunded",
            "type": "bool"
          },
          {
            "name": "paid",
            "type": "bool"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "fund",
        "outputs": [],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "numFunders",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "funders",
        "outputs": [
          {
            "name": "addr",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          },
          {
            "name": "goalAmount",
            "type": "uint256"
          },
          {
            "name": "deadline",
            "type": "uint256"
          }
        ],
        "type": "constructor"
      }
    ],
    "unlinked_binary": "0x6060604081905260006006556007805461ffff1916905580806103a181395060c06040525160805160a05160003411156099576002565b61018060405260c083905260e082905261010081905260006101208190526101408190526101608190528054600160a060020a03191684178155600183905560028290556003556004805461ffff191690555050506102fc806100a56000396000f35b8160001415603657600256606060405260e060020a6000350463565974d3811461003c578063b60d42881461006a578063b96326891461008f578063dc0d3dff14610098575b005b6100c2600054600154600254600354600454600160a060020a03949094169360ff8181169161010090041686565b61003a60045460ff16806100855750600454610100900460ff165b1561013c57610002565b61010460065481565b6005602052600435600090815260409020805460019091015461011691600160a060020a03169082565b60408051600160a060020a03979097168752602087019590955285850193909352606085019190915215156080840152151560a0830152519081900360c00190f35b60408051918252519081900360200190f35b6040518083600160a060020a031681526020018281526020019250505060405180910390f35b60025442901080610151575060015460035410155b156101815760405132600160a060020a031690600090349082818181858883f1935050505015156101e057610002565b60408051808201825232815234602082810182815260068054600181810190925560009081526005909352949091209251835473ffffffffffffffffffffffffffffffffffffffff19161783555191909201556003805490910190555b565b600154600354106101fe5761021b60075460ff161561022057610002565b61021b6007546000908190610100900460ff161561027857610002565b6101de565b6007805460ff1916600117905560008054604051600160a060020a0391821692913016319082818181858883f19350505050151561025d57610002565b6004805461ff0019166101001790556007805460ff19169055565b6007805461ff0019166101001790555b6006548210156102d457506000818152600560205260408082208054600182015492519193600160a060020a039190911692909182818181858883f1935050505015156102f057610002565b6004805460ff191660011790556007805461ff00191690555050565b6001919091019061028856",
    "updated_at": 1472259404184,
    "links": {},
    "address": "0x251705a3ea68d919bf8225e122a88061b8d394cb"
  }
};

  Contract.checkNetwork = function(callback) {
    var self = this;

    if (this.network_id != null) {
      return callback();
    }

    this.web3.version.network(function(err, result) {
      if (err) return callback(err);

      var network_id = result.toString();

      // If we have the main network,
      if (network_id == "1") {
        var possible_ids = ["1", "live", "default"];

        for (var i = 0; i < possible_ids.length; i++) {
          var id = possible_ids[i];
          if (Contract.all_networks[id] != null) {
            network_id = id;
            break;
          }
        }
      }

      if (self.all_networks[network_id] == null) {
        return callback(new Error(self.name + " error: Can't find artifacts for network id '" + network_id + "'"));
      }

      self.setNetwork(network_id);
      callback();
    })
  };

  Contract.setNetwork = function(network_id) {
    var network = this.all_networks[network_id] || {};

    this.abi             = this.prototype.abi             = network.abi;
    this.unlinked_binary = this.prototype.unlinked_binary = network.unlinked_binary;
    this.address         = this.prototype.address         = network.address;
    this.updated_at      = this.prototype.updated_at      = network.updated_at;
    this.links           = this.prototype.links           = network.links || {};

    this.network_id = network_id;
  };

  Contract.networks = function() {
    return Object.keys(this.all_networks);
  };

  Contract.link = function(name, address) {
    if (typeof name == "object") {
      Object.keys(name).forEach(function(n) {
        var a = name[n];
        Contract.link(n, a);
      });
      return;
    }

    Contract.links[name] = address;
  };

  Contract.contract_name   = Contract.prototype.contract_name   = "Project";
  Contract.generated_with  = Contract.prototype.generated_with  = "3.1.2";

  var properties = {
    binary: function() {
      var binary = Contract.unlinked_binary;

      Object.keys(Contract.links).forEach(function(library_name) {
        var library_address = Contract.links[library_name];
        var regex = new RegExp("__" + library_name + "_*", "g");

        binary = binary.replace(regex, library_address.replace("0x", ""));
      });

      return binary;
    }
  };

  Object.keys(properties).forEach(function(key) {
    var getter = properties[key];

    var definition = {};
    definition.enumerable = true;
    definition.configurable = false;
    definition.get = getter;

    Object.defineProperty(Contract, key, definition);
    Object.defineProperty(Contract.prototype, key, definition);
  });

  bootstrap(Contract);

  if (typeof module != "undefined" && typeof module.exports != "undefined") {
    module.exports = Contract;
  } else {
    // There will only be one version of this contract in the browser,
    // and we can use that.
    window.Project = Contract;
  }
})();
