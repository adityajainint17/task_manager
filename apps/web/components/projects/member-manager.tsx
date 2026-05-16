"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { ProjectDetail, ProjectRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

export function MemberManager({
  project,
  canManage,
  onUpdated
}: {
  project: ProjectDetail;
  canManage: boolean;
  onUpdated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ProjectRole>("MEMBER");
  const [loading, setLoading] = useState(false);

  const addMember = async () => {
    if (!email) return;

    try {
      setLoading(true);
      await api.post(`/projects/${project.id}/members`, { email, role });
      toast.success("Member added");
      setEmail("");
      setRole("MEMBER");
      onUpdated();
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Unable to add member");
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (memberId: string, nextRole: ProjectRole) => {
    try {
      await api.put(`/projects/${project.id}/members/${memberId}`, { role: nextRole });
      toast.success("Role updated");
      onUpdated();
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Unable to update role");
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      await api.delete(`/projects/${project.id}/members/${memberId}`);
      toast.success("Member removed");
      onUpdated();
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Unable to remove member");
    }
  };

  return (
    <Card className="border-white/10 bg-card/70">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Team</h3>
        <p className="text-sm text-muted-foreground">Roles stay explicit so ownership stays clean.</p>
      </div>

      {canManage ? (
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_160px_auto]">
          <Input placeholder="Add teammate by email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Select value={role} onChange={(event) => setRole(event.target.value as ProjectRole)}>
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </Select>
          <Button onClick={addMember} disabled={loading}>
            {loading ? "Adding..." : "Add member"}
          </Button>
        </div>
      ) : null}

      <div className="space-y-3">
        {project.members.map((member) => (
          <div key={member.id} className="flex flex-col gap-3 rounded-xl border bg-background/30 p-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: member.avatarColor }}
              >
                {member.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
            </div>
            {canManage ? (
              <div className="flex items-center gap-2">
                <Select value={member.role} onChange={(event) => updateRole(member.id, event.target.value as ProjectRole)}>
                  <option value="ADMIN">Admin</option>
                  <option value="MEMBER">Member</option>
                </Select>
                <Button variant="ghost" onClick={() => removeMember(member.id)}>
                  Remove
                </Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">{member.role}</div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
