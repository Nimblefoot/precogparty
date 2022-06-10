import React, { useState } from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import New, { Status } from "./TransactButton";
import { StatelessTransactButton } from "./TransactButton";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "TransactButton",
  component: StatelessTransactButton,
} as ComponentMeta<typeof New>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof StatelessTransactButton> = (args) => (
  <StatelessTransactButton {...args} />
);

export const Example = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Example.args = {
  verb: "Submit",
  status: "initial",
};

const SimulatedTemplate: ComponentStory<typeof StatelessTransactButton> = (
  args
) => {
  const [status, setStatus] = useState<Status>("initial");

  const onClick = async () => {
    setStatus("signing");
    await new Promise((r) => setTimeout(r, 2000));
    setStatus("sending");
    await new Promise((r) => setTimeout(r, 1000));
    setStatus("confirming");
    await new Promise((r) => setTimeout(r, 3000));
    setStatus("done");
  };

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <StatelessTransactButton {...args} status={status} onClick={onClick} />
    </div>
  );
};
export const Simulated = SimulatedTemplate.bind({});

Simulated.args = {
  verb: "Submit",
};
