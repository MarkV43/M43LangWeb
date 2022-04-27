alias b := build
alias t := test
alias c := check

build:
    wasm-pack build ../m43lang-wasm --debug -d ../m43lang-web/wasm
    rm ./wasm/.gitignore

test:
    cd m43lang && cargo test

check:
    cd m43lang && cargo check
