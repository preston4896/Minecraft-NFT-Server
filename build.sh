#!/bin/sh
cd ./smart-contracts
(ganache-cli -p 7545) > /dev/null 2>&1 &
truffle test