"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { loginSchema, type LoginValues } from "@/schemas";
import { ApiError, errorMessage } from "@/services/http";

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      await login(values.email, values.password);
      router.replace("/admin");
    } catch (err) {
      setFormError(err instanceof ApiError && (err.status === 401 || err.status === 403) ? "E-mail ou senha incorretos." : errorMessage(err));
    }
  }

  return (
    <div className="grelha grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm border border-carvao-600 bg-carvao-800 p-7">
        <Logo href="/admin/login" />
        <h1 className="mt-6 text-4xl font-black">Entrar no painel</h1>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
          <TextField label="E-mail" type="email" autoComplete="username" {...register("email")} error={errors.email?.message} />
          <TextField label="Senha" type="password" autoComplete="current-password" {...register("password")} error={errors.password?.message} />
          {formError && (
            <p role="alert" className="rounded-sm bg-vinho/25 px-3 py-2 text-sm text-red-200">
              {formError}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
