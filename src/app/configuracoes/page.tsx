"use client";

import { Settings, Database, Mail, Bot, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5" />
              Banco de Dados
            </CardTitle>
            <CardDescription>Conexão com Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm">Status da conexão</span>
              <Badge variant="success">Configurar</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5" />
              Recebimento de E-mail
            </CardTitle>
            <CardDescription>Webhook para NF-e por e-mail</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm">SendGrid / Postmark</span>
              <Badge variant="secondary">Em breve</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5" />
              Integração IA
            </CardTitle>
            <CardDescription>Mapeamento automático de produtos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm">OpenAI / Anthropic</span>
              <Badge variant="secondary">Em breve</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" />
              Autenticação
            </CardTitle>
            <CardDescription>Controle de acesso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm">Supabase Auth</span>
              <Badge variant="secondary">Em breve</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
