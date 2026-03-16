import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PawPrint, Tractor, ArrowRight } from "lucide-react";
import { useLogin, useSignup } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [ranchName, setRanchName] = useState("");
  
  const { login: setAuthContext } = useAuth();
  const { toast } = useToast();

  const loginMutation = useLogin();
  const signupMutation = useSignup();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      loginMutation.mutate(
        { data: { email, password } },
        {
          onSuccess: (data) => setAuthContext(data.token),
          onError: (error: any) => {
            toast({
              title: "Login Failed",
              description: error.message || "Invalid credentials. Please try again.",
              variant: "destructive"
            });
          }
        }
      );
    } else {
      signupMutation.mutate(
        { data: { email, password, name, ranchName } },
        {
          onSuccess: (data) => setAuthContext(data.token),
          onError: (error: any) => {
            toast({
              title: "Signup Failed",
              description: error.message || "Could not create account.",
              variant: "destructive"
            });
          }
        }
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Image Panel */}
      <div className="hidden md:flex flex-1 relative bg-primary/10 overflow-hidden items-center justify-center">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
          alt="Ranch landscape" 
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-foreground/90 mix-blend-multiply" />
        <div className="relative z-10 text-center p-12 text-primary-foreground">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/20">
            <PawPrint className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-display font-black mb-4 drop-shadow-lg">RanchPad</h1>
          <p className="text-xl font-medium text-white/80 max-w-md mx-auto">
            Practical, powerful livestock management for modern ranches.
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Mobile background hint */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-primary md:hidden rounded-b-[40px] -z-10" />

        <div className="w-full max-w-md animate-in">
          <div className="md:hidden flex items-center justify-center gap-3 mb-8 text-primary-foreground">
            <PawPrint className="w-8 h-8" />
            <span className="font-display font-bold text-3xl">RanchPad</span>
          </div>

          <Card className="border-0 shadow-2xl shadow-black/5 md:border md:shadow-xl rounded-3xl overflow-hidden backdrop-blur-sm bg-card/95">
            <div className="flex border-b border-border/50">
              <button 
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-4 text-sm font-bold transition-colors ${isLogin ? 'bg-background text-primary border-b-2 border-primary' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}
              >
                Log In
              </button>
              <button 
                type="button"
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-4 text-sm font-bold transition-colors ${!isLogin ? 'bg-background text-primary border-b-2 border-primary' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}
              >
                Sign Up
              </button>
            </div>

            <CardHeader className="pt-8">
              <CardTitle className="text-3xl">{isLogin ? "Welcome back" : "Create Account"}</CardTitle>
              <CardDescription className="text-base">
                {isLogin ? "Enter your credentials to access your ranch." : "Start managing your livestock today."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      placeholder="John Doe" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      required={!isLogin} 
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@ranch.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                  />
                </div>

                {!isLogin && (
                  <div className="space-y-2 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Tractor className="w-5 h-5 text-accent" />
                      <Label htmlFor="ranchName" className="text-accent font-bold">New Ranch Name</Label>
                    </div>
                    <Input 
                      id="ranchName" 
                      placeholder="e.g. Rolling Hills Ranch" 
                      value={ranchName} 
                      onChange={e => setRanchName(e.target.value)} 
                      required={!isLogin} 
                    />
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full mt-8" 
                  size="lg"
                  isLoading={isLogin ? loginMutation.isPending : signupMutation.isPending}
                >
                  {isLogin ? "Sign In" : "Create Ranch"}
                  {!loginMutation.isPending && !signupMutation.isPending && <ArrowRight className="w-5 h-5 ml-2" />}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
