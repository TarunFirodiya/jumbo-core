"use client";

import * as React from "react";
import {
  Loader2,
  CheckSquare,
  Plus,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DateTimePicker } from "@/components/ui/date-time-picker";

import { createTaskForLead, createTaskForSellerLead, createTaskForListing, completeTask } from "@/lib/actions";
import { toast } from "sonner";
import type { TaskItem } from "@/types";

interface TasksTabProps {
  entityType: "lead" | "seller_lead" | "listing";
  entityId: string;
  initialTasks: TaskItem[];
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

interface AgentOption {
  id: string;
  fullName: string;
  role: string;
}

export function TasksTab({ entityType, entityId, initialTasks }: TasksTabProps) {
  const [tasksList, setTasksList] = React.useState<TaskItem[]>(initialTasks);
  const [showCompletedTasks, setShowCompletedTasks] = React.useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = React.useState(false);
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [newTaskDescription, setNewTaskDescription] = React.useState("");
  const [newTaskPriority, setNewTaskPriority] = React.useState("medium");
  const [newTaskDueAt, setNewTaskDueAt] = React.useState<Date | undefined>(undefined);
  const [newTaskAssigneeId, setNewTaskAssigneeId] = React.useState("");
  const [isCreatingTask, setIsCreatingTask] = React.useState(false);

  // Agent options for assignee dropdown
  const [agents, setAgents] = React.useState<AgentOption[]>([]);

  React.useEffect(() => {
    async function fetchAgents() {
      try {
        const response = await fetch("/api/v1/agents");
        if (response.ok) {
          const data = await response.json();
          setAgents(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch agents:", error);
      }
    }
    fetchAgents();
  }, []);

  const openTasks = tasksList.filter((t) => t.status !== "completed");
  const completedTasks = tasksList.filter((t) => t.status === "completed");

  async function handleCreateTask() {
    if (!newTaskTitle.trim()) return;
    setIsCreatingTask(true);
    try {
      const taskData = {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        priority: newTaskPriority,
        dueAt: newTaskDueAt ? newTaskDueAt.toISOString() : undefined,
        assigneeId: newTaskAssigneeId || undefined,
      };

      const result = entityType === "lead"
        ? await createTaskForLead(entityId, taskData)
        : entityType === "seller_lead"
        ? await createTaskForSellerLead(entityId, taskData)
        : await createTaskForListing(entityId, taskData);

      if (result.success) {
        toast.success("Task created");
        const assignee = agents.find((a) => a.id === newTaskAssigneeId);
        setTasksList((prev) => [
          {
            id: result.data!.id,
            title: newTaskTitle.trim(),
            description: newTaskDescription.trim(),
            priority: newTaskPriority,
            status: "open",
            dueAt: newTaskDueAt ? newTaskDueAt.toISOString() : null,
            completedAt: null,
            creatorName: "",
            assigneeName: assignee?.fullName || "",
          },
          ...prev,
        ]);
        setNewTaskTitle("");
        setNewTaskDescription("");
        setNewTaskPriority("medium");
        setNewTaskDueAt(undefined);
        setNewTaskAssigneeId("");
        setIsTaskDialogOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to create task");
    } finally {
      setIsCreatingTask(false);
    }
  }

  async function handleCompleteTask(taskId: string) {
    try {
      const result = await completeTask(taskId);
      if (result.success) {
        toast.success("Task completed");
        setTasksList((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, status: "completed", completedAt: new Date().toISOString() }
              : t
          )
        );
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to complete task");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Tasks</CardTitle>
        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" size="sm" className="gap-1.5">
              <Plus className="size-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task title"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Optional description"
                  className="mt-1 min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Due Date</label>
                  <DateTimePicker
                    date={newTaskDueAt}
                    setDate={setNewTaskDueAt}
                    className="mt-1 w-full"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Assignee</label>
                <Select value={newTaskAssigneeId} onValueChange={setNewTaskAssigneeId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={handleCreateTask} disabled={isCreatingTask || !newTaskTitle.trim()}>
                  {isCreatingTask ? (
                    <><Loader2 className="size-4 animate-spin mr-1" /> Creating...</>
                  ) : (
                    "Create Task"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {tasksList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckSquare className="size-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No tasks yet</p>
            <p className="text-sm mt-1">Create a task to track follow-ups and actions.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Open Tasks */}
            {openTasks.length > 0 && (
              <div className="space-y-2">
                {openTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50"
                  >
                    <Checkbox
                      className="mt-0.5"
                      onCheckedChange={() => handleCompleteTask(task.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{task.title}</span>
                        <Badge className={cn("text-[10px] px-1.5 py-0", PRIORITY_COLORS[task.priority] || "")}>
                          {task.priority}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {task.dueAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {format(new Date(task.dueAt), "MMM d, yyyy")}
                          </span>
                        )}
                        {task.assigneeName && (
                          <span>{task.assigneeName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronDown className={cn("size-4 transition-transform", showCompletedTasks && "rotate-180")} />
                  {completedTasks.length} completed task{completedTasks.length > 1 ? "s" : ""}
                </button>
                {showCompletedTasks && (
                  <div className="space-y-2 mt-2">
                    {completedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-3 rounded-lg border opacity-60"
                      >
                        <Checkbox checked disabled className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm line-through">{task.title}</span>
                          {task.completedAt && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Completed {formatDistanceToNow(new Date(task.completedAt), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
