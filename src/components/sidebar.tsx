"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FileText,
  ShoppingCart,
  Users,
  Settings,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "PDV", href: "/pdv", icon: ShoppingCart },
  { label: "Produtos", href: "/produtos", icon: Package },
  { label: "Entrada NF-e", href: "/nfe", icon: FileText },
  { label: "Vendas", href: "/vendas", icon: FileText },
  { label: "Fornecedores", href: "/fornecedores", icon: Users },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Store className="h-7 w-7 text-primary" />
        <span className="text-xl font-bold text-primary">Mercado ERP</span>
      </div>

      <nav className="flex flex-col gap-1 p-4">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-4 left-4 right-4 rounded-lg border bg-muted/50 p-3">
        <p className="text-xs font-medium text-muted-foreground">
          Mercado ERP v0.1.0
        </p>
        <p className="text-xs text-muted-foreground">MVP — Sprint 1</p>
      </div>
    </aside>
  );
}
