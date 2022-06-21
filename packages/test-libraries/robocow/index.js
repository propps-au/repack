import { bleep } from "./bleep";
import { blorp } from "blorp";
import * as cowsay from "cowsay";

export function say(text) {
  return cowsay.say({ text: blorp(bleep(text)) });
}
