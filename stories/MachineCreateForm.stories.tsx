import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { MachineCreateForm } from '@/components/ui/machine-create-form';
import { action } from '@storybook/addon-actions';

const meta = {
  title: 'Forms/MachineCreateForm',
  component: MachineCreateForm,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onSubmit: { action: 'submitted' },
    onOpenChange: { action: 'openChanged' },
  },
} satisfies Meta<typeof MachineCreateForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    onOpenChange: action('openChanged'),
    onSubmit: action('submitted'),
    isLoading: false,
    appName: 'my-test-app',
    defaultImage: 'nginx:latest',
  },
};

export const Loading: Story = {
  args: {
    open: true,
    onOpenChange: action('openChanged'),
    onSubmit: action('submitted'),
    isLoading: true,
    appName: 'my-test-app',
    defaultImage: 'nginx:latest',
  },
}; 