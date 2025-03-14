import React from 'react';
import { SECRET_TYPES } from '@/types/api';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

interface GenerateSecretModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (label: string, type: string) => Promise<void>;
  appName: string;
}

// Create a schema for form validation
const formSchema = z.object({
  secretLabel: z.string().min(1, "Secret label is required").regex(/^[a-zA-Z0-9_-]+$/, {
    message: "Secret label can only contain letters, numbers, underscores, and hyphens"
  }),
  secretType: z.string().min(1, "Secret type is required")
});

type FormValues = z.infer<typeof formSchema>;

export function GenerateSecretModal({ isOpen, onClose, onGenerate, appName }: GenerateSecretModalProps) {
  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      secretLabel: '',
      secretType: SECRET_TYPES.SECRET_TYPE_KMS_HS256
    }
  });

  const isSubmitting = form.formState.isSubmitting;
  
  // Reset form on close
  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Handle form submission
  const handleSubmit = async (values: FormValues) => {
    try {
      await onGenerate(values.secretLabel, values.secretType);
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error generating secret:', error);
      form.setError('root', { 
        type: 'manual',
        message: 'Failed to generate secret. Please try again.' 
      });
    }
  };

  // Format the secret type for display
  const formatSecretType = (type: string): string => {
    return type
      .replace('SECRET_TYPE_KMS_', '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            Generate New Secret
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            Create a new secret for your app "{appName}".
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            {form.formState.errors.root && (
              <div className="flex items-start p-3 rounded-md bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm border border-red-200 dark:border-red-800">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{form.formState.errors.root.message}</span>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="secretLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Secret Label
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="w-full bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                      placeholder="Enter secret label"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500 dark:text-gray-400">
                    Use only letters, numbers, underscores, and hyphens
                  </FormDescription>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="secretType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Secret Type
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700">
                      {Object.values(SECRET_TYPES).map((type) => (
                        <SelectItem key={type} value={type} className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-gray-700">
                          {formatSecretType(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs text-gray-500 dark:text-gray-400">
                    Select the encryption algorithm for this secret
                  </FormDescription>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="mr-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : 'Generate Secret'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 