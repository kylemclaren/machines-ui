'use client';

import React, { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FLY_REGIONS } from "@/lib/regions";
import { getRegionFlag } from "@/lib/utils";

// Create a schema for form validation
const formSchema = z.object({
  name: z.string().optional(),
  region: z.string().min(1, "Region is required"),
  size: z.string().min(1, "Machine size is required"),
  image: z.string().min(1, "Image is required"),
  cpuKind: z.enum(["shared", "performance"], {
    required_error: "CPU kind is required",
  }),
  cpus: z.coerce.number().min(1, "At least 1 CPU is required"),
  memoryMb: z.coerce.number().min(256, "At least 256MB of memory is required"),
  autostart: z.boolean().default(false),
  autostop: z.boolean().default(false),
});

export type MachineFormValues = z.infer<typeof formSchema>;

interface MachineCreateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: MachineFormValues) => void;
  isLoading?: boolean;
  appName: string;
  defaultImage?: string;
  getImage?: () => Promise<string | null>;
}

export function MachineCreateForm({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading, 
  appName,
  defaultImage = "flyio/ubuntu:22.04",
  getImage
}: MachineCreateFormProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [isFetchingImage, setIsFetchingImage] = useState(false);

  const form = useForm<MachineFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: `${appName}-${Date.now()}`,
      region: "sjc",
      size: "shared-cpu-1x",
      image: defaultImage,
      cpuKind: "shared",
      cpus: 1,
      memoryMb: 256,
      autostart: false,
      autostop: false,
    },
  });

  // Fetch image when form opens
  useEffect(() => {
    const fetchImage = async () => {
      if (open && getImage) {
        setIsFetchingImage(true);
        try {
          const image = await getImage();
          if (image) {
            console.log("Setting form image to:", image);
            form.setValue("image", image);
          }
        } catch (error) {
          console.error("Error fetching image:", error);
        } finally {
          setIsFetchingImage(false);
        }
      }
    };
    
    fetchImage();
  }, [open, getImage, form]);

  // List of machine sizes
  const machineSizes = [
    { value: "shared-cpu-1x", label: "Shared CPU - 1x (256MB)" },
    { value: "shared-cpu-2x", label: "Shared CPU - 2x (512MB)" },
    { value: "shared-cpu-4x", label: "Shared CPU - 4x (1GB)" },
    { value: "shared-cpu-8x", label: "Shared CPU - 8x (2GB)" },
    { value: "performance-1x", label: "Performance - 1x (2GB)" },
    { value: "performance-2x", label: "Performance - 2x (4GB)" },
    { value: "performance-4x", label: "Performance - 4x (8GB)" },
    { value: "performance-8x", label: "Performance - 8x (16GB)" },
  ];

  // Handle size selection to update CPU and memory
  const handleSizeChange = (value: string) => {
    form.setValue("size", value);
    
    // Update CPU kind, CPU count, and memory based on selected size
    switch (value) {
      case "shared-cpu-1x":
        form.setValue("cpuKind", "shared");
        form.setValue("cpus", 1);
        form.setValue("memoryMb", 256);
        break;
      case "shared-cpu-2x":
        form.setValue("cpuKind", "shared");
        form.setValue("cpus", 1);
        form.setValue("memoryMb", 512);
        break;
      case "shared-cpu-4x":
        form.setValue("cpuKind", "shared");
        form.setValue("cpus", 1);
        form.setValue("memoryMb", 1024);
        break;
      case "shared-cpu-8x":
        form.setValue("cpuKind", "shared");
        form.setValue("cpus", 1);
        form.setValue("memoryMb", 2048);
        break;
      case "performance-1x":
        form.setValue("cpuKind", "performance");
        form.setValue("cpus", 1);
        form.setValue("memoryMb", 2048);
        break;
      case "performance-2x":
        form.setValue("cpuKind", "performance");
        form.setValue("cpus", 2);
        form.setValue("memoryMb", 4096);
        break;
      case "performance-4x":
        form.setValue("cpuKind", "performance");
        form.setValue("cpus", 4);
        form.setValue("memoryMb", 8192);
        break;
      case "performance-8x":
        form.setValue("cpuKind", "performance");
        form.setValue("cpus", 8);
        form.setValue("memoryMb", 16384);
        break;
    }
  };

  const handleFormSubmit = (values: MachineFormValues) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">Create New Machine</DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            Configure a new Machine for your application. Fill in the basic information below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 bg-gray-100 dark:bg-gray-700">
                <TabsTrigger value="basic" className="data-[state=active]:bg-white data-[state=active]:dark:bg-gray-800">Basic</TabsTrigger>
                <TabsTrigger value="advanced" className="data-[state=active]:bg-white data-[state=active]:dark:bg-gray-800">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">Machine Name (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Auto-generated if empty" 
                          {...field} 
                          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </FormControl>
                      <FormDescription className="text-gray-500 dark:text-gray-400">
                        A unique name for your Machine. If left empty, one will be generated for you.
                      </FormDescription>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">Region</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                            <SelectValue placeholder="Select a region" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 max-h-80">
                          {FLY_REGIONS.map((region) => (
                            <SelectItem key={region.code} value={region.code} className="text-gray-900 dark:text-gray-100 focus:bg-gray-100 dark:focus:bg-gray-600">
                              <div className="flex items-center">
                                <span className="mr-2">{getRegionFlag(region.code)}</span>
                                <span>{region.name} ({region.code})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-gray-500 dark:text-gray-400">
                        Choose the geographical region where your Machine will be deployed.
                      </FormDescription>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">Machine Size</FormLabel>
                      <Select 
                        onValueChange={(value) => handleSizeChange(value)} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                            <SelectValue placeholder="Select a machine size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                          {machineSizes.map((size) => (
                            <SelectItem key={size.value} value={size.value} className="text-gray-900 dark:text-gray-100 focus:bg-gray-100 dark:focus:bg-gray-600">
                              {size.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-gray-500 dark:text-gray-400">
                        Choose the computational resources for your Machine.
                      </FormDescription>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">Docker Image</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., registry/repository:tag"
                          {...field}
                          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </FormControl>
                      <FormDescription className="text-gray-500 dark:text-gray-400">
                        Enter the Docker image to use for this Machine.
                      </FormDescription>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cpuKind"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-300">CPU Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                              <SelectValue placeholder="Select CPU type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                            <SelectItem value="shared" className="text-gray-900 dark:text-gray-100 focus:bg-gray-100 dark:focus:bg-gray-600">Shared</SelectItem>
                            <SelectItem value="performance" className="text-gray-900 dark:text-gray-100 focus:bg-gray-100 dark:focus:bg-gray-600">Performance</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cpus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-300">CPU Count</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="8" 
                            {...field} 
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="memoryMb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">Memory (MB)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="256" 
                          step="256" 
                          {...field} 
                          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </FormControl>
                      <FormDescription className="text-gray-500 dark:text-gray-400">
                        Memory in megabytes. Minimum 256MB.
                      </FormDescription>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="autostart"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border border-gray-200 dark:border-gray-700 p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-gray-700 dark:text-gray-300">Auto Start</FormLabel>
                          <FormDescription className="text-gray-500 dark:text-gray-400">
                            Start this Machine automatically when requests arrive.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="autostop"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border border-gray-200 dark:border-gray-700 p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-gray-700 dark:text-gray-300">Auto Stop</FormLabel>
                          <FormDescription className="text-gray-500 dark:text-gray-400">
                            Stop this Machine when it becomes idle.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

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
                  "Create Machine"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 