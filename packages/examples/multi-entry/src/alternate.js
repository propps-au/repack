import { say } from "robocow";
import { announce } from "./shared";

function run() {
  announce();
  console.log(say("goodbye"));
}

run();
