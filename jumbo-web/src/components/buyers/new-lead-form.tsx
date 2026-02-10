"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createLeadFormSchema,
  leadSourceOptions,
  leadStatusOptions,
  type CreateLeadFormData,
} from "@/lib/validations/lead";
import { createLead } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhoneInput } from "@/components/ui/phone-input";
import { toast } from "sonner";
import { Loader2, User, Mail } from "lucide-react";

interface NewLeadFormProps {
  onSuccess?: () => void;
}

interface AgentOption {
  id: string;
  fullName: string;
}

export function NewLeadForm({ onSuccess }: NewLeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);

  const form = useForm<CreateLeadFormData>({
    resolver: zodResolver(createLeadFormSchema) as any,
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      source: "manual_entry",
      status: "new",
      assignedAgentId: null,
    },
  });

  // Fetch agents for dropdown
  useEffect(() => {
    async function fetchAgents() {
      try {
        const response = await fetch("/api/v1/agents");
        if (response.ok) {
          const data = await response.json();
          setAgents(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch agents:", error);
      } finally {
        setIsLoadingAgents(false);
      }
    }
    fetchAgents();
  }, []);

  async function onSubmit(values: CreateLeadFormData) {
    setIsSubmitting(true);
    try {
      // Map form values to API schema structure
      const payload = {
        profile: {
          fullName: values.fullName,
          phone: values.phone,
          email: values.email || undefined,
        },
        source: values.source,
        status: values.status,
        pipeline: false,
        assignedAgentId: values.assignedAgentId || undefined,
      };

      const result = await createLead(payload);

      if (result.success) {
        toast.success(result.message || "Lead created successfully");
        form.reset();
        onSuccess?.();
      } else {
        toast.error(result.message || "Failed to create lead");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create lead"
      );
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="John Doe"
                    className="pl-9"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone Number */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number *</FormLabel>
              <FormControl>
                <PhoneInput
                  defaultCountry="IN"
                  placeholder="Enter phone number"
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    className="pl-9"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Source */}
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {leadSourceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {leadStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Assigned Agent */}
        <FormField
          control={form.control}
          name="assignedAgentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assigned Agent</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || undefined}
                disabled={isLoadingAgents}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingAgents
                          ? "Loading agents..."
                          : "Select agent (optional)"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create Lead
          </Button>
        </div>
      </form>
    </Form>
  );
}
