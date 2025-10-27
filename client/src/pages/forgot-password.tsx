import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="rounded-full bg-primary/10 p-3 mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-center">
            Reset Password
          </h1>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Federal University Wukari
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forgot Password?</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you instructions to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/10">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-300">
                    Password reset instructions have been sent to your email address.
                  </AlertDescription>
                </Alert>
                <div className="text-sm text-muted-foreground">
                  <p className="mb-4">Please check your email inbox for further instructions.</p>
                  <p>If you don't receive an email within a few minutes, please check your spam folder or contact ICT Support.</p>
                </div>
                <Link href="/">
                  <Button className="w-full mt-4" data-testid="button-back-to-login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@fuwukari.edu.ng"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-9"
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-reset-password"
                >
                  {isLoading ? "Sending..." : "Send Reset Instructions"}
                </Button>

                <div className="text-center">
                  <Link href="/">
                    <Button variant="link" className="text-sm" data-testid="link-back-to-login">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </form>
            )}

            <div className="mt-6 pt-6 border-t">
              <p className="text-xs text-center text-muted-foreground">
                For assistance, contact ICT Support
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
