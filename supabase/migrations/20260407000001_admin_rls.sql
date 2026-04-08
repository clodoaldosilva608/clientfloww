-- Fix RLS Policies for Admin Access to Audit Logs and user_subscriptions

-- Create the policy for audit_logs
CREATE POLICY "Admins can view all audit logs" 
ON public.audit_logs
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
    OR 
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'clodoaldosilva608@gmail.com'
);

-- Create the policy for user_subscriptions
CREATE POLICY "Admins can view all subscriptions" 
ON public.user_subscriptions
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
    OR 
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'clodoaldosilva608@gmail.com'
);

-- Ensure base Read permissions for their own subscriptions
CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions
FOR SELECT TO authenticated
USING (user_id = auth.uid());
