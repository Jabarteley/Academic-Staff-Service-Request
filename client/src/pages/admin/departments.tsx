import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, FolderKanban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Department, Faculty } from "@shared/schema";

const departmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  code: z.string().min(1, "Department code is required"),
  facultyId: z.string().optional(),
});

export default function Departments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const { data: departments, isLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: faculties } = useQuery<Faculty[]>({
    queryKey: ["/api/faculties"],
  });

  const form = useForm({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      code: "",
      facultyId: "",
    },
  });

  // Update form values when editingDepartment changes
  useEffect(() => {
    if (editingDepartment) {
      form.reset({
        name: editingDepartment.name,
        code: editingDepartment.code,
        facultyId: editingDepartment.facultyId || "",
      });
    } else {
      form.reset({
        name: "",
        code: "",
        facultyId: "",
      });
    }
  }, [editingDepartment, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!editingDepartment) return;
      return apiRequest("PUT", `/api/admin/departments/${editingDepartment.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({
        title: "Department updated",
        description: "Department has been updated successfully.",
      });
      setEditingDepartment(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update department",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/departments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({
        title: "Department created",
        description: "New department has been added successfully.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create department",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (editingDepartment) {
      updateMutation.mutate({ ...data, id: editingDepartment.id });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Departments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage university departments
          </p>
        </div>
        <Dialog 
          open={isDialogOpen || !!editingDepartment} 
          onOpenChange={(open) => {
            if (!open) {
              setIsDialogOpen(false);
              setEditingDepartment(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button data-testid="button-new-department">
              <Plus className="mr-2 h-4 w-4" />
              New Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDepartment ? 'Edit Department' : 'Create New Department'}
              </DialogTitle>
              <DialogDescription>
                {editingDepartment ? 'Update department details' : 'Add a new department to the system'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Computer Science" {...field} data-testid="input-department-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CSC" {...field} data-testid="input-department-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="facultyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Faculty</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a faculty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {faculties?.map(faculty => (
                              <SelectItem key={faculty.id} value={faculty.id}>
                                {faculty.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingDepartment(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={editingDepartment ? updateMutation.isPending : createMutation.isPending}
                  >
                    {editingDepartment 
                      ? (updateMutation.isPending ? "Updating..." : "Update Department") 
                      : (createMutation.isPending ? "Creating..." : "Create Department")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Departments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : departments && departments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => {
                  const faculty = faculties?.find(f => f.id === dept.facultyId);
                  return (
                    <TableRow key={dept.id} data-testid={`row-department-${dept.id}`}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell>{dept.code}</TableCell>
                      <TableCell>{faculty?.name || '-'}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingDepartment(dept)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FolderKanban className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No departments found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
