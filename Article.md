# Setup private Ethereum network with Docker

> Ethereum is a decentralized platform that runs smart contracts: 
> applications that run exactly as programmed without any possibility of downtime, 
> censorship, fraud or third party interference. 

This is a step-by-step guide, how to setup *private* Ethereum network. 

We’ll set up network and write two simple JSON-RPC clients in order to communicate with our Ethereum nodes.

> Private blockchains: a fully private blockchain is a blockchain where write permissions are kept centralized to one organization. Read permissions may 
> be public or restricted to an arbitrary extent. Likely applications include database management, auditing, etc internal to a single company, and so 
> public readability may not be necessary in many cases at all, though in other cases public auditability is desired. 

To get the difference between Public and Private networks [read this article by V. Buterin the author of Ethereum](https://blog.ethereum.org/2015/08/07/on-public-and-private-blockchains/).

I assume you have got hand-on experience with Docker, also you’re knowing Ruby or Nodejs a little. 

> You can ask why docker? I don't want to install `geth` locally.

Copy the source code from my [Github repository.](https://github.com/fishbullet/Ethereum-Private-Network)

Let’s get started from the Docker container creation, here is a Dockerfile for our ethereum nodes, we’ll be using geth:

```Dockerfile
FROM ubuntu:16.04

LABEL version="1.0"
LABEL maintainer="shindu666@gmail.com"

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install --yes software-properties-common
RUN add-apt-repository ppa:ethereum/ethereum
RUN apt-get update && apt-get install --yes geth

RUN adduser --disabled-login --gecos "" eth_user

COPY eth_common /home/eth_user/eth_common
RUN chown -R eth_user:eth_user /home/eth_user/eth_common
USER eth_user
WORKDIR /home/eth_user

RUN geth init eth_common/genesis.json

ENTRYPOINT bash
```

In order to create *private* network we need a [genesis file](https://github.com/ethereum/go-ethereum/wiki/Private-network#creating-the-genesis-block) whom must be on both nodes(look in the `eth_common/`).

To allow nodes to _talk_ to each other, we must create the network between containers, with the `docker network` it’s pretty easy:

```bash
docker network create ETH
```

Now let’s build two containers:

```bash
docker build -t node_one .
# Output omitted
# ...
docker build -t node_two .
# Output omitted
# ....
```

OK, containers are builded:

```bash
docker run --rm -it -p 8545:8545 --net=ETH node_one
eth_user@node_one:~$ ls -a
.  ..  .bash_logout  .bashrc  .ethereum  .profile  eth_common
eth_user@node_one:~$
```

First one is ready(*don’t close terminal*), now second, open an another terminal and run:

```bash
docker run --rm -it -p 8546:8546 --net=ETH node_two
eth_user@node_two:~$ ls -a
.  ..  .bash_logout  .bashrc  .ethereum  .profile  eth_common
# Output omitted
eth_user@node_two:~$
```

Second one is also ready.

Note about `docker run` command line options:

- `-p 8545:8545`   in the node_one expose the default RPC port of geth.
- `-p 8546:8546` in the node_two expose port, whom will be used later in geth.
- `— net=ETH` is a custom docker network, to allow containers communicate each other(because we’re building the cluster).

Inspect docker network(remember `IPv4Address`, we’ll use it later), run command `docker network inspect ETH`:

```json
[
    {
        # ..... omitted ....
        "Containers": {
            "50e624e9481765443216eebaa4d0d7ae1dda3497f64eb55d6160632c7b7d0cce": {
                "Name": "cocky_mccarthy",
                "EndpointID": "15a34c3bf61f85cd1e705bf72470e2ac46d370159db59d07715e428518533bba",
                "MacAddress": "02:42:ac:12:00:03",
                "IPv4Address": "172.18.0.3/16",
                "IPv6Address": ""
            },
            "54d6fecd407b586bd4d0e20422923dd7355a691ce4de8a2050d649d7c9318526": {
                "Name": "nostalgic_raman",
                "EndpointID": "64fdd19a2f50e5fd184afa839b271c122a22d8b965ea7c72240624804c73cf3b",
                "MacAddress": "02:42:ac:12:00:02",
                "IPv4Address": "172.18.0.2/16",
                "IPv6Address": ""
            }
        },
        # ..... omitted ....
    }
]
```

Now we have two docker containers connected each other. Need to generate coinbase account, in order to mine ether we must provide an address [to receive reward for found blocks](http://www.ethdocs.org/en/latest/mining.html#mining-rewards).

node_one:
```bash
eth_user@node_one:~$ ./eth_common/setup_account 
Address: {9b40d576bfaa7781e0826a4024b6300566113ce1}
eth_user@node_one:~$
```
node_two:
```bash
eth_user@node_two:~$ ./eth_common/setup_account 
Address: {648a4b24cf769da5467bf9b008dace89d9f65a80}
eth_user@node_two:~$
```

Here we’re using `setup_account` shell script, which has been copied early to the docker container. 
Time to start minning.

node_one:
```bash
eth_user@node_one:~$ geth --identity="NODE_ONE" --networkid="500" --verbosity=1 --mine --minerthreads=1 --rpc --rpcaddr 0.0.0.0 console
Welcome to the Geth JavaScript console!
instance: Geth/NODE_ONE/v1.7.2-stable-1db4ecdc/linux-amd64/go1.9
coinbase: 0x9b40d576bfaa7781e0826a4024b6300566113ce1
at block: 0 (Thu, 01 Jan 1970 00:00:00 UTC)
 datadir: /home/eth_user/.ethereum
 modules: admin:1.0 debug:1.0 eth:1.0 miner:1.0 net:1.0 personal:1.0 rpc:1.0 txpool:1.0 web3:1.0
>
```

node_two:
```bash
eth_user@node_two:~$ geth --identity="NODE_TWO" --networkid="500" --verbosity=1 --mine --minerthreads=1 --rpc --rpcport=8546 --rpcaddr 0.0.0.0 console
Welcome to the Geth JavaScript console!
instance: Geth/NODE_TWO/v1.7.2-stable-1db4ecdc/linux-amd64/go1.9
coinbase: 0x648a4b24cf769da5467bf9b008dace89d9f65a80
at block: 0 (Thu, 01 Jan 1970 00:00:00 UTC)
 datadir: /home/eth_user/.ethereum
 modules: admin:1.0 debug:1.0 eth:1.0 miner:1.0 net:1.0 personal:1.0 rpc:1.0 txpool:1.0 web3:1.0
>
```

Note about the command line options to `geth`:

- ` — identity` must be unique identifier of the node
- `— networkid` must be the same on the both nodes
- `—verbosity` there is many levels `0=silent, 1=error, 2=warn, 3=info, 4=core, 5=debug, 6=detail` (default: 3)
- `— mine` enable minning
- `— rpc` enable RPC
- `— rpcport=8546` change the (default: 8545) RPC port in order to reach container from the host machine

Documentation for all other command line options you can find [here](https://github.com/ethereum/go-ethereum/wiki/Command-Line-Options)

Let’s run some command to check the state of our nodes.

node_one:
```js
> eth.hashrate
0
> eth.blockNumber
0
```

If both commands return zero, don’t worry, the DAG is generated. Wait some time and check again, you must see results(your output might be different):
```js
> eth.hashrate
23458
> eth.blockNumber
20
```
Let’s check peers, our nodes must detect each other:
```js
> admin.peers
[]
```
Peers are empty, in order to add peers we must provide a full enode url to the `admin.addPeer()` method, to get the enode url run command:

node_one:
```js
> admin.nodeInfo.enode
"enode://2468b878bb87****072fae1362fd3448@[::]:30303"
```
I omit most of the enode, your enode url will be other, except last part `[::]:30303`.
- `[::]`  — means localhost, that’s the enode url of node_one.

Let’s get the second enode from another container:
node_two:
```
> admin.nodeInfo.enode
"enode://4f3c1f87914a68255f9b736aa**ac754d7558ba@[::]:30303"
```
Ok, we have enode urls of both containers, let’s add its to each other. In order to do that, we need container IP address, whom we have from the output of the `docker network inspect ETH` command, `IPv4Address`.

node_one:
```
#
# enode from node_two with IP address of node_two container
> enode = "enode://4f3c1f87914a68255f9b736aa**ac754d7558ba@172.18.0.3:30303"
> admin.addPeer(enode)
> admin.peers
[{
    caps: ["eth/63"],
    id: "4f3c1f87914a68255f9b736aa**ac754d7558ba",
    name: "Geth/NODE_TWO/v1.7.2-stable-1db4ecdc/linux-amd64/go1.9",
    network: {
      localAddress: "172.18.0.2:41760",
      remoteAddress: "172.18.0.3:30303"
    },
    protocols: {
      eth: {
        difficulty: 70077493,
        head: "0x2d1a50604ea00163728a9ff80824c66105dcfb129a66d218f709ce6bab285249",
        version: 63
      }
    }
}]
```
node_two:
```
# enode from node_one with IP address of node_one container
enode = "enode://2468b878bb87****072fae1362fd3448@172.18.0.2:30303
> admin.addPeer(enode)
> admin.peers
[{
    caps: ["eth/63"],
    id: "2468b878bb87****072fae1362fd3448",
    name: "Geth/NODE_ONE/v1.7.2-stable-1db4ecdc/linux-amd64/go1.9",
    network: {
      localAddress: "172.18.0.3:30303",
      remoteAddress: "172.18.0.2:41760"
    },
    protocols: {
      eth: {
        difficulty: 76191910,
        head: "0x1eca2ed57825c8840eca54cf807228f15473e120f65fbaaf6e3b5b79d6d5203d",
        version: 63
      }
    }
}]
```

That’s good, nodes are seeing each other. Let’s check the block number it must be the same on both nodes(+\- 1–2 blocks, because the mining is going fast, your output might be different):

node_one:
```js
> eth.blockNumber
750
> eth.hashrate
60757
```

node_two:
```js
> eth.blockNumber
753
> eth.hashrate
61494
```
*Don’t close docker containers* it’s time to create a script to run commands in our nodes by `JSON-RPC`.

Here is an example of Ruby script:

```ruby
#!/usr/bin/env ruby
require "bundler/setup"
require 'json-rpc-client'
EM.run {
  EventMachine.add_periodic_timer(5) { # 5 seconds timeout
    node_one = JsonRpcClient.new('http://localhost:8545/') 
    node_two = JsonRpcClient.new('http://localhost:8546/')
    [
      { name: "NODE_ONE", node: node_one },
      { name: "NODE_TWO", node: node_two } 
    ].each do |node|
      rpc_coinbase = node[:node].eth_coinbase
      rpc_blockNumber = node[:node].eth_blockNumber
      rpc_coinbase.callback do |result|
        puts "#{node[:name]} coinbase: #{result}"
      end
      rpc_coinbase.errback do |error|
        puts error
      end
      rpc_blockNumber.callback do |result|
        puts "#{node[:name]} blocknumber: #{Integer(result)}"
      end
      rpc_blockNumber.errback do |error|
        puts error
      end
    end
  }
}
```
And a Nodejs example:
```js
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
   // blockNumber
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
}, 5000) // 5 seconds timeout
```

Now run scripts and check out the results(note about 5 seconds timeout):
```bash
$> node index.js 
NODE ONE coinbase: 0x718cb4a34cac0fa4e9a37f249340078896b4dfa0
NODE ONE block number: 1467
NODE TWO coinbase: 0x648a4b24cf769da5467bf9b008dace89d9f65a80
NODE TWO block number: 1467
```
```bash
$> ruby client.rb 
NODE_ONE blocknumber: 1533
NODE_TWO coinbase: 0x648a4b24cf769da5467bf9b008dace89d9f65a80
NODE_TWO blocknumber: 1533
NODE_ONE coinbase: 0x718cb4a34cac0fa4e9a37f249340078896b4dfa0
```
We have builded private ethereum network cluster with the script writen on Ruby and Nodejs, those scripts able to communicate with our cluster using JSON-RPC protocol.
It’s a good start to create your blockchain project based on Ethereum. 

References:
- https://ethereum.gitbooks.io/frontier-guide/content/index.html
- http://www.ethdocs.org/en/latest/introduction/index.html
- https://github.com/ethereum/wiki/wiki
- https://github.com/ethereum/go-ethereum/wiki

<sub>P.S. forgive me my bad English, it’s not my native language.</sub>

