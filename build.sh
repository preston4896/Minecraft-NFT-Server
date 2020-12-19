#!/bin/sh
cd ./smart-contracts
ganache-cli -p 7545 &
truffle test