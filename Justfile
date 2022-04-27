alias b := build
alias t := test
alias c := check

build:
    wasm-pack build ./m43lang/inner --debug -d ../../wasm
    rm ./wasm/.gitignore

test:
    cd m43lang && cargo test

check:
    cd m43lang && cargo check
