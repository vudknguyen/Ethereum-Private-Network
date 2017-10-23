#!/usr/bin/env ruby

require "bundler/setup"
require 'json-rpc-client'

EM.run {
  EventMachine.add_periodic_timer(5) {
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
