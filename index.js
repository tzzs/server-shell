const core = require('@actions/core');
const exec = require('@actions/exec')
const io = require('@actions/io')
const fs = require('fs')

const values_list = ['PRIVATE_KEY', 'USERNAME', 'IP', 'SHELL']

// get input values
let { PRIVATE_KEY, USERNAME, IP, SHELL } = function () {
    let values = []
    values_list.forEach(value => {
        values[value] = core.getInput(value)
    })
    return values
}()

function create_file(path, content) {
    fs.appendFile(path, content, (err) => {
        if (err) throw err;
    })
}

async function run() {
    try {
        if (PRIVATE_KEY.trim().length == 0) {
            throw "PRIVATE_KEY cannot be empty"
        }
        if (USERNAME.trim().length == 0) {
            throw "USERNAME cannot be empty"
        }
        if (IP.trim().length == 0) {
            throw "IP cannot be empty"
        }

        // get home dir from environment
        HOME = process.env['HOME']
        core.info(HOME)

        // config ssh
        await io.mkdirP(HOME + "/.ssh")
        await create_file(HOME + "/.ssh/deploy.key", PRIVATE_KEY);
        await exec.exec(`ls ${HOME}/.ssh`)
        await exec.exec(`chmod 600 ${HOME}/.ssh/deploy.key`)
        await create_file(HOME + "/.ssh/config", `Host server\n\
    HostName ${IP}\n\
    User ${USERNAME}\n\
    IdentityFile ~/.ssh/deploy.key\n\
    StrictHostKeyChecking no\n`)

        await exec.exec("ls -al")

        // check if SHELL is not null
        if (SHELL.trim().length != 0) {
            let shells = SHELL.split('\n')
            for (shell of shells) {
                core.info(shell)
                await exec.exec("ssh server " + shell)
            }
        }
    } catch (error) {
        core.setFailed(error);
    }
}

run();
