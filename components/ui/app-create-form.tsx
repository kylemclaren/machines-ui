'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// Create a schema for form validation
const formSchema = z.object({
  app_name: z.string().min(1, "App name is required").regex(/^[a-z0-9][a-z0-9-]*$/, {
    message: "App name must contain only lowercase letters, numbers, and hyphens, and cannot start with a hyphen"
  }).max(30, "App name must be 30 characters or less"),
  org_slug: z.string().min(1, "Organization is required"),
  network: z.string().optional(),
  enable_subdomains: z.boolean().default(false)
});

export type AppFormValues = z.infer<typeof formSchema>;

interface AppCreateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AppFormValues) => void;
  isLoading?: boolean;
  organizations: { slug: string; name: string }[];
}

export function AppCreateForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  organizations
}: AppCreateFormProps) {
  const [showNetworkField, setShowNetworkField] = useState(false);

  const form = useForm<AppFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      app_name: "",
      org_slug: organizations.length > 0 ? organizations[0].slug : "",
      network: "",
      enable_subdomains: false
    }
  });

  const handleFormSubmit = (values: AppFormValues) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">Create New App</DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            Configure a new Fly.io application. Apps are containers for machines and other resources.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="app_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 dark:text-gray-300">App Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="my-new-app" 
                      {...field} 
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </FormControl>
                  <FormDescription className="text-gray-500 dark:text-gray-400">
                    A unique name for your app. Must contain only lowercase letters, numbers, and hyphens. Used for your app's subdomain (app-name.fly.dev).
                  </FormDescription>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="org_slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 dark:text-gray-300">Organization</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                        <SelectValue placeholder="Select an organization" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                      {organizations.map((org) => (
                        <SelectItem key={org.slug} value={org.slug} className="text-gray-900 dark:text-gray-100 focus:bg-gray-100 dark:focus:bg-gray-600">
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-gray-500 dark:text-gray-400">
                    The organization that will own this app.
                  </FormDescription>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="show-network" 
                checked={showNetworkField} 
                onCheckedChange={(checked) => setShowNetworkField(checked as boolean)}
                className="border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="show-network"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Configure advanced options
              </label>
            </div>

            {showNetworkField && (
              <>
                <FormField
                  control={form.control}
                  name="network"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">Network Name (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="my-network" 
                          {...field} 
                          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </FormControl>
                      <FormDescription className="text-gray-500 dark:text-gray-400">
                        Name for an IPv6 private network to segment the app onto. Leave blank to use the default network.
                      </FormDescription>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enable_subdomains"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border border-gray-200 dark:border-gray-700 p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-gray-700 dark:text-gray-300">Enable Subdomains</FormLabel>
                        <FormDescription className="text-gray-500 dark:text-gray-400">
                          Used for Fly Kubernetes workloads.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter className="gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 flex items-center justify-center cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  "Create App"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 