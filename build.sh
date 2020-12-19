#!/bin/sh
cd ./smart-contracts
ganache-cli &
truffle test
