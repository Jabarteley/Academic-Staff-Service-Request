import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Upload, X } from "lucide-react";
import type { Department } from "@shared/schema";

const baseRequestSchema = z.object({
  requestType: z.string().min(1, "Request type is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: z.string().default("normal"),
  departmentId: z.string().min(1, "Department is required"),
});

const leaveRequestSchema = baseRequestSchema.extend({
  leaveType: z.string().min(1, "Leave type is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  substituteStaffName: z.string().min(1, "Substitute staff name is required"),
});

const conferenceRequestSchema = baseRequestSchema.extend({
  eventName: z.string().min(1, "Event name is required"),
  organizer: z.string().min(1, "Organizer is required"),
  eventDates: z.string().min(1, "Event dates are required"),
  location: z.string().min(1, "Location is required"),
  estimatedCost: z.string().optional(),
  conferencePaper: z.boolean().default(false),
  travelRequest: z.boolean().default(false),
});

const resourceRequestSchema = baseRequestSchema.extend({
  justification: z.string().min(10, "Justification is required"),
  deliveryLocation: z.string().min(1, "Delivery location is required"),
  budgetCode: z.string().optional(),
});

export default function NewRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [requestType, setRequestType] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [items, setItems] = useState<Array<{ name: string; qty: number; cost: string }>>([
    { name: "", qty: 1, cost: "" }
  ]);

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const getSchema = () => {
    switch (requestType) {
      case "leave":
        return leaveRequestSchema;
      case "conference_training":
        return conferenceRequestSchema;
      case "resource_requisition":
        return resourceRequestSchema;
      default:
        return baseRequestSchema;
    }
  };

  const form = useForm({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      requestType: "",
      title: "",
      description: "",
      priority: "normal",
      departmentId: "",
      leaveType: "",
      startDate: "",
      endDate: "",
      substituteStaffName: "",
      eventName: "",
      organizer: "",
      eventDates: "",
      location: "",
      estimatedCost: "",
      conferencePaper: false,
      travelRequest: false,
      justification: "",
      deliveryLocation: "",
      budgetCode: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined && data[key] !== "") {
          formData.append(key, data[key]);
        }
      });

      if (requestType === "resource_requisition") {
        formData.append("itemList", JSON.stringify(items));
      }

      files.forEach((file) => {
        formData.append("files", file);
      });

      return apiRequest("POST", "/api/requests", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      toast({
        title: "Request created",
        description: "Your request has been submitted successfully.",
      });
      setLocation("/requests");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems([...items, { name: "", qty: 1, cost: "" }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">New Request</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submit a new service request
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="requestType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Type *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setRequestType(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-request-type">
                            <SelectValue placeholder="Select request type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="leave">Leave</SelectItem>
                          <SelectItem value="conference_training">Conference/Training</SelectItem>
                          <SelectItem value="resource_requisition">Resource Requisition</SelectItem>
                          <SelectItem value="generic">Generic Request</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-priority">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-department">
                          <SelectValue placeholder="Select your department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments?.map((dept) => (
                          <SelectItem 
                            key={dept.id} 
                            value={dept.id}
                            data-testid={`department-option-${dept.id}`}
                          >
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief title for your request"
                        {...field}
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide detailed information about your request"
                        className="min-h-32"
                        {...field}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {requestType === "leave" && (
            <Card>
              <CardHeader>
                <CardTitle>Leave Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="leaveType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Leave Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-leave-type">
                              <SelectValue placeholder="Select leave type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="annual">Annual Leave</SelectItem>
                            <SelectItem value="sick">Sick Leave</SelectItem>
                            <SelectItem value="compassionate">Compassionate Leave</SelectItem>
                            <SelectItem value="casual">Casual Leave</SelectItem>
                            <SelectItem value="study">Study Leave</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="substituteStaffName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Substitute Staff *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Name of substitute staff"
                            {...field}
                            data-testid="input-substitute-staff"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-start-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-end-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {requestType === "conference_training" && (
            <Card>
              <CardHeader>
                <CardTitle>Conference/Training Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="eventName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Conference or training name"
                            {...field}
                            data-testid="input-event-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="organizer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organizer *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Event organizer"
                            {...field}
                            data-testid="input-organizer"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="eventDates"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Dates *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., June 15-17, 2024"
                            {...field}
                            data-testid="input-event-dates"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Event location"
                            {...field}
                            data-testid="input-location"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimatedCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Cost</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., ₦150,000"
                            {...field}
                            data-testid="input-estimated-cost"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="conferencePaper"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-conference-paper"
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          I am presenting a paper
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="travelRequest"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-travel-request"
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Travel support required
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {requestType === "resource_requisition" && (
            <Card>
              <CardHeader>
                <CardTitle>Resource Requisition Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Items *</Label>
                  <div className="space-y-3 mt-2">
                    {items.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Item name"
                          value={item.name}
                          onChange={(e) => updateItem(index, "name", e.target.value)}
                          className="flex-1"
                          data-testid={`input-item-name-${index}`}
                        />
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.qty}
                          onChange={(e) => updateItem(index, "qty", parseInt(e.target.value) || 1)}
                          className="w-24"
                          data-testid={`input-item-qty-${index}`}
                        />
                        <Input
                          placeholder="Cost"
                          value={item.cost}
                          onChange={(e) => updateItem(index, "cost", e.target.value)}
                          className="w-32"
                          data-testid={`input-item-cost-${index}`}
                        />
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            data-testid={`button-remove-item-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    className="mt-2"
                    data-testid="button-add-item"
                  >
                    Add Item
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deliveryLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Location *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Where should items be delivered"
                            {...field}
                            data-testid="input-delivery-location"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="budgetCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Budget code (if applicable)"
                            {...field}
                            data-testid="input-budget-code"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="justification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Justification *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Explain why these resources are needed"
                          className="min-h-24"
                          {...field}
                          data-testid="textarea-justification"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-md p-8 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  Upload supporting documents (PDF, DOC, DOCX, JPG, PNG, XLS, XLSX)
                </p>
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                  onChange={handleFileChange}
                  className="max-w-xs mx-auto"
                  data-testid="input-file-upload"
                />
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-md"
                      data-testid={`file-item-${index}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        data-testid={`button-remove-file-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/requests")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              data-testid="button-submit-request"
            >
              {createMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
