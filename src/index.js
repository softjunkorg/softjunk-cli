import { Command } from "commander";
import * as Commands from "./commands/index.js";

const program = new Command();

program
    .name("softjunk-cli")
    .description("CLI to execute softjunk actions on the framework");

Object.entries(Commands).map(function (command) {
    program
        .command(command[1].name)
        .description(command[1].description)
        .action(command[1].handler);
});

program.parse();
