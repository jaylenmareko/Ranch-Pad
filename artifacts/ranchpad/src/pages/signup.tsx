import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'wouter';
import { PawPrint } from 'lucide-react';
import { useSignup } from '@workspace/api-client-react';
import { useAuth } from '@/lib/auth';
import { Button, Input, Field, Card } from '@/components/ui';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const signupSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 chars"),
  ranchMode: z.enum(['create', 'join']),
  ranchName: z.string().optional(),
  ranchCity: z.string().optional(),
  ranchState: z.string().optional(),
  joinRanchName: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.ranchMode === 'create' && !data.ranchName) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ranch Name is required", path: ['ranchName'] });
  }
  if (data.ranchMode === 'join' && !data.joinRanchName) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Existing Ranch Name is required", path: ['joinRanchName'] });
  }
});

type SignupForm = z.infer<typeof signupSchema>;

export default function Signup() {
  const { login } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { ranchMode: 'create' }
  });
  
  const ranchMode = form.watch('ranchMode');

  const { mutate: doSignup, isPending } = useSignup({
    mutation: {
      onSuccess: (data) => {
        login(data.token);
      },
      onError: (err) => {
        toast({
          title: "Signup failed",
          description: err.data?.message || "Could not create account.",
          variant: "destructive"
        });
      }
    }
  });

  const onSubmit = (data: SignupForm) => {
    const payload = {
      name: data.name,
      email: data.email,
      password: data.password,
      ranchName: data.ranchMode === 'create' ? data.ranchName : undefined,
      ranchCity: data.ranchMode === 'create' ? data.ranchCity : undefined,
      ranchState: data.ranchMode === 'create' ? data.ranchState : undefined,
      joinRanchName: data.ranchMode === 'join' ? data.joinRanchName : undefined,
    };
    doSignup({ data: payload });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-background relative overflow-hidden">
      {/* Abstract background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-xl z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
            <PawPrint className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-bold">Create your account</h1>
          <p className="mt-2 text-muted-foreground">Join RanchPad to track your herd efficiently.</p>
        </div>

        <Card className="p-6 sm:p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Full Name" error={form.formState.errors.name}>
                <Input placeholder="John Doe" {...form.register('name')} />
              </Field>
              <Field label="Email" error={form.formState.errors.email}>
                <Input type="email" placeholder="you@example.com" {...form.register('email')} />
              </Field>
            </div>
            
            <Field label="Password" error={form.formState.errors.password}>
              <Input type="password" placeholder="Create a strong password" {...form.register('password')} />
            </Field>

            <div className="pt-4 border-t">
              <Label className="mb-4 block text-lg font-display">Ranch Setup</Label>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => form.setValue('ranchMode', 'create')}
                  className={cn(
                    "p-4 rounded-xl border-2 text-center transition-all",
                    ranchMode === 'create' ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50 text-muted-foreground"
                  )}
                >
                  <span className="font-semibold block">Create New</span>
                  <span className="text-xs opacity-80">Start a fresh ranch profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue('ranchMode', 'join')}
                  className={cn(
                    "p-4 rounded-xl border-2 text-center transition-all",
                    ranchMode === 'join' ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50 text-muted-foreground"
                  )}
                >
                  <span className="font-semibold block">Join Existing</span>
                  <span className="text-xs opacity-80">Connect to your team</span>
                </button>
              </div>

              {ranchMode === 'create' ? (
                <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
                  <Field label="Ranch Name" error={form.formState.errors.ranchName}>
                    <Input placeholder="e.g. Rolling Hills Ranch" {...form.register('ranchName')} />
                  </Field>
                  <div className="grid grid-cols-2 gap-5">
                    <Field label="City" error={form.formState.errors.ranchCity}>
                      <Input placeholder="Austin" {...form.register('ranchCity')} />
                    </Field>
                    <Field label="State" error={form.formState.errors.ranchState}>
                      <Input placeholder="TX" {...form.register('ranchState')} />
                    </Field>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
                  <Field label="Existing Ranch Name" error={form.formState.errors.joinRanchName}>
                    <Input placeholder="Enter exact ranch name to join" {...form.register('joinRanchName')} />
                  </Field>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full mt-8" size="lg" disabled={isPending}>
              {isPending ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
