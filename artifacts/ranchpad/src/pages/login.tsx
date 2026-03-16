import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'wouter';
import { PawPrint } from 'lucide-react';
import { useLogin } from '@workspace/api-client-react';
import { useAuth } from '@/lib/auth';
import { Button, Input, Field } from '@/components/ui';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const { mutate: doLogin, isPending } = useLogin({
    mutation: {
      onSuccess: (data) => {
        login(data.token);
      },
      onError: (err) => {
        toast({
          title: "Login failed",
          description: err.data?.message || "Invalid credentials. Please try again.",
          variant: "destructive"
        });
      }
    }
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left side form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 z-10 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
              <PawPrint className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-display font-bold">Welcome back</h1>
            <p className="mt-2 text-muted-foreground">Sign in to manage your ranch.</p>
          </div>

          <form onSubmit={form.handleSubmit((d) => doLogin({ data: d }))} className="space-y-5">
            <Field label="Email Address" error={form.formState.errors.email}>
              <Input placeholder="you@example.com" {...form.register('email')} />
            </Field>
            
            <Field label="Password" error={form.formState.errors.password}>
              <Input type="password" placeholder="••••••••" {...form.register('password')} />
            </Field>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Right side image */}
      <div className="hidden md:block flex-1 relative bg-secondary">
        {/* Farm landscape */}
        <img 
          src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1920&h=1080&fit=crop" 
          alt="Ranch landscape at golden hour" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="text-4xl font-display font-bold mb-4">Practical tools for serious ranchers.</h2>
          <p className="text-lg text-white/80">Track health, lineage, and alerts all in one beautifully designed platform.</p>
        </div>
      </div>
    </div>
  );
}
