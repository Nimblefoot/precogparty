import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import New from "./TransactButton";
import TransactButton from "./TransactButton";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "TransactButton",
  component: TransactButton,
} as ComponentMeta<typeof New>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof TransactButton> = (args) => (
  <TransactButton {...args} />
);

export const Example = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Example.args = {
  verb: "Submit",
  status: "initial",
};
