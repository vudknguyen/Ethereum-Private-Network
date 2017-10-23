var rpc = require('node-json-rpc');
 
var nodeOne = {
  port: 8545,
  host: 'localhost',
  path: '/',
  strict: true
};

var nodeTwo = {
  port: 8546,
  host: 'localhost',
  path: '/',
  strict: true
};
 
var clientNodeOne = new rpc.Client(nodeOne);
var clientNodeTwo = new rpc.Client(nodeTwo);
 
setInterval(()=> {
  // Coinbase
  clientNodeOne.call({"jsonrpc": "2.0", "method": "eth_coinbase", "params": [], "id": 0 },
    function(err, res) {
      if (err) console.log(err)

      console.log("NODE ONE coinbase: " + res.result )
    })

  // BlockNumber
  clientNodeTwo.call({"jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 1 },
    function(err, res) {
      if (err) console.log(err)

      console.log("NODE TWO block number: " + parseInt(res.result, 16) )
    })
  
  // Coinbase
  clientNodeOne.call({"jsonrpc": "2.0", "method": "eth_coinbase", "params": [], "id": 0 },
    function(err, res) {
      if (err) console.log(err)

      console.log("NODE ONE coinbase: " + res.result )
    })
  
  // blockNumber
  clientNodeTwo.call({"jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 1 },
    function(err, res) {
      if (err) console.log(err)

      console.log("NODE TWO block number: " + parseInt(res.result, 16) )
    })
}, 5000)
