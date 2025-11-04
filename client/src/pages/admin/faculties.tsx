import { useState } from "react";
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
import type { Faculty, User } from "@shared/schema";

const facultySchema = z.object({
  name: z.string().min(1, "Faculty name is required"),
  code: z.string().min(1, "Faculty code is required"),
});

export default function Faculties() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);

  const { data: faculties, isLoading } = useQuery<Faculty[]>({
    queryKey: ["/api/faculties"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Filter users who have the DEAN role
  const deans = users?.filter(user => user.role === 'dean');

  const form = useForm({
    resolver: zodResolver(facultySchema),
    defaultValues: {
      name: "",
      code: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/faculties", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faculties"] });
      toast({
        title: "Faculty created",
        description: "New faculty has been added successfully.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create faculty",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Faculties</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage university faculties
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-faculty">
                <Plus className="mr-2 h-4 w-4" />
                New Faculty
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Faculty</DialogTitle>
                <DialogDescription>
                  Add a new faculty to the system
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Faculty Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Faculty of Science" {...field} data-testid="input-faculty-name" />
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
                        <FormLabel>Faculty Code *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., FOS" {...field} data-testid="input-faculty-code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Creating..." : "Create Faculty"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Faculties</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : faculties && faculties.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Dean</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faculties.map((faculty) => {
                    const dean = users?.find(user => user.id === faculty.deanId);
                    return (
                      <TableRow key={faculty.id} data-testid={`row-faculty-${faculty.id}`}>
                        <TableCell className="font-medium">{faculty.name}</TableCell>
                        <TableCell>{faculty.code}</TableCell>
                        <TableCell>{dean ? dean.fullName : '-'}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSelectedFaculty(faculty)}
                          >
                            Assign Dean
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
                <p className="text-sm text-muted-foreground">No faculties found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Dean Assignment Modal */}
      <Dialog open={!!selectedFaculty} onOpenChange={() => setSelectedFaculty(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Dean to {selectedFaculty?.name}</DialogTitle>
            <DialogDescription>
              Select a user to assign as dean for this faculty
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {deans && deans.length > 0 ? (
              <div className="space-y-2">
                {deans.map((dean) => (
                  <div 
                    key={dean.id} 
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-muted cursor-pointer"
                    onClick={async () => {
                      try {
                        const response = await apiRequest("PUT", `/api/faculties/${selectedFaculty?.id}/appoint-dean`, {
                          userId: dean.id
                        });
                        toast({
                          title: "Dean assigned",
                          description: `${dean.fullName} has been assigned as dean for ${selectedFaculty?.name}.`
                        });
                        queryClient.invalidateQueries({ queryKey: ["/api/faculties"] });
                        setSelectedFaculty(null);
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to assign dean: " + (error as any).message,
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <div>
                      <div className="font-medium">{dean.fullName}</div>
                      <div className="text-sm text-muted-foreground">{dean.email}</div>
                    </div>
                    {selectedFaculty?.deanId === dean.id && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Current Dean</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No users with DEAN role found. Please create a user with DEAN role first.
              </p>
            )}
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setSelectedFaculty(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}