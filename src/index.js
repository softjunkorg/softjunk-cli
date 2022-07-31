import { Command } from "commander";
import * as Commands from "./commands/index.js";

const program = new Command();

program
    .name("softjunk-cli")
    .description("CLI to execute softjunk actions on the framework");

Object.entries(Commands).map(function (command) {
    const created_command = program
        .command(command[1].name)
        .description(command[1].description)
        .action(command[1].handler);

    if (command[1].options) {
        command[1].options.map(opt => created_command.addOption(opt));
    }

    if (command[1].arguments) {
        command[1].arguments.map(arg => created_command.addArgument(arg));
    }
});

program.parse();
