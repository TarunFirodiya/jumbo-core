"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createLeadRequestSchema } from "@/lib/validations/lead"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

// We can refine the schema for the form if needed, or use the API schema directly
// Flattening for the form might be easier
const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^\+91[0-9]{10}$/, "Phone must be a valid Indian number (+91XXXXXXXXXX)"),
  email: z.string().email().optional().or(z.literal("")),
  source: z.string().min(1, "Source is required"),
})

interface NewLeadFormProps {
  onSuccess?: () => void
}

export function NewLeadForm({ onSuccess }: NewLeadFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      phone: "+91",
      email: "",
      source: "manual_entry",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Map form values to API schema structure
      const payload = {
        profile: {
          fullName: values.fullName,
          phone: values.phone,
          email: values.email || undefined,
        },
        source: values.source,
      }
      
      const response = await fetch("/api/v1/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create lead");
      }
      
      const data = await response.json();
      console.log("Lead created:", data);
      
      toast.success("Lead created successfully")
      form.reset()
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create lead")
      console.error(error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+919876543210" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Optional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a source" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="manual_entry">Manual Entry</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="walk_in">Walk-in</SelectItem>
                  <SelectItem value="phone_inquiry">Phone Inquiry</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end pt-4">
          <Button type="submit">Create Lead</Button>
        </div>
      </form>
    </Form>
  )
}

