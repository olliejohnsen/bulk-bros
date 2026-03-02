"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadForm } from "@/components/UploadForm";
import { CardSearch } from "@/components/CardSearch";

export default function UploadPage() {
  const [sharedUsername, setSharedUsername] = useState("");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Subtle grid pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      <div className="relative max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-10">
        <div className="space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            Back to gallery
          </Link>
          
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none animate-fade-in">
              SHARE YOUR <br />
              <span className="text-muted-foreground">BULK.</span>
            </h1>
            <p className="text-sm text-muted-foreground font-medium max-w-xs animate-fade-in [animation-delay:100ms]">
              Select a method to add your cards to the community collection.
            </p>
          </div>
        </div>

        <div className="bg-card border border-border/40 rounded-lg p-6 sm:p-8 shadow-2xl shadow-black/5 animate-fade-in [animation-delay:200ms]">
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="w-full mb-8 p-1 h-auto bg-muted/50 rounded-md border border-border/40">
              <TabsTrigger
                value="search"
                className="flex-1 gap-2 rounded-sm py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <Search className="w-3 h-3 stroke-[3]" />
                Search Database
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                className="flex-1 gap-2 rounded-sm py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <Camera className="w-3 h-3 stroke-[3]" />
                Upload Photo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="mt-0 animate-scale-in">
              <CardSearch
                username={sharedUsername}
                onUsernameChange={setSharedUsername}
              />
            </TabsContent>

            <TabsContent value="upload" className="mt-0 animate-scale-in">
              <UploadForm
                username={sharedUsername}
                onUsernameChange={setSharedUsername}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Tips / Info */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in [animation-delay:300ms]">
          <div className="p-4 rounded-lg border border-border/40 bg-muted/20">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Tip</p>
            <p className="text-[11px] font-medium leading-tight">Search is best for single pulls with clean metadata.</p>
          </div>
          <div className="p-4 rounded-lg border border-border/40 bg-muted/20">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Tip</p>
            <p className="text-[11px] font-medium leading-tight">Upload is best for showing off your physical stacks.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
