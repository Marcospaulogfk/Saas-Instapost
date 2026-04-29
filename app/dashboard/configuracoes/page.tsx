"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export default function ConfiguracoesPage() {
  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Configuracoes</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie sua conta, plano e preferencias.
        </p>
      </div>

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="conta">Conta</TabsTrigger>
          <TabsTrigger value="plano">Plano</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificacoes</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="space-y-6 pt-6">
          <section className="rounded-xl border border-border p-6 space-y-4">
            <h3 className="font-semibold">Foto de perfil</h3>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="/avatar.jpg" alt="Marcos Paulo" />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">MP</AvatarFallback>
              </Avatar>
              <div className="space-x-2">
                <Button variant="outline" size="sm">Alterar foto</Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">Remover</Button>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border p-6 space-y-4">
            <h3 className="font-semibold">Informacoes pessoais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" defaultValue="Marcos Paulo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="marcos@email.com" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button>Salvar alteracoes</Button>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="conta" className="space-y-6 pt-6">
          <section className="rounded-xl border border-border p-6 space-y-4">
            <h3 className="font-semibold">Senha</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="senha-atual">Senha atual</Label>
                <Input id="senha-atual" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha-nova">Nova senha</Label>
                <Input id="senha-nova" type="password" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button>Atualizar senha</Button>
            </div>
          </section>

          <section className="rounded-xl border border-destructive/30 p-6 space-y-3">
            <h3 className="font-semibold text-destructive">Zona de perigo</h3>
            <p className="text-sm text-muted-foreground">
              Excluir sua conta remove todos os projetos, marcas e templates de forma permanente.
            </p>
            <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10">
              Excluir minha conta
            </Button>
          </section>
        </TabsContent>

        <TabsContent value="plano" className="space-y-6 pt-6">
          <section className="rounded-xl border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Plano atual</h3>
              <Badge variant="secondary" className="bg-primary/10 text-primary">Pro</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Imagens este mes</span>
                <span className="font-medium tabular-nums">47 / 200</span>
              </div>
              <Progress value={23.5} className="h-1.5" />
              <p className="text-xs text-muted-foreground">Renova em 12 dias</p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/pricing">Ver planos</Link>
              </Button>
              <Button variant="outline">Gerenciar cobranca</Button>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="notificacoes" className="space-y-6 pt-6">
          <section className="rounded-xl border border-border p-6 space-y-4">
            <h3 className="font-semibold">Email</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Novidades do produto</p>
                  <p className="text-xs text-muted-foreground">Receber updates sobre novos recursos.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Resumo semanal</p>
                  <p className="text-xs text-muted-foreground">Resumo dos seus projetos toda segunda.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Avisos de cobranca</p>
                  <p className="text-xs text-muted-foreground">Alertas sobre faturas e renovacoes.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}
