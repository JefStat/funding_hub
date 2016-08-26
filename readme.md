
# Testrpc command

testrpc --accounts 4 --port 8546
default configuration expect rpc on host ip 192.168.1.16

Follow sample instructions how to seed a working account in the console logs:
Send 1 ether to the light wallet account with coinbase account using command below
FundingHubController.js:143 web3.eth.sendTransaction({ from: "0xaa22c0a5e0c24ff26a84654b4c4fbbbcdc9b0a73", to: "0x51f7934930e502a1a8381e9fec9d933cf7350285", value: web3.toWei(1, "ether") }), (err, tx) => {console.log(tx); if(err)console.error(err);})
FundingHubController.js:144 Then check the balance with
FundingHubController.js:145 web3.fromWei(web3.eth.getBalance("0x51f7934930e502a1a8381e9fec9d933cf7350285"), "ether").toString()


# DevDependencies
 * ethereumjs-testrpc@2.2.2
 * truffle@2.0.7
 
 